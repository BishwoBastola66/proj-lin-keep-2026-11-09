import { NextResponse } from 'next/server';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { sanitizeText, isValidEmail } from '@/lib/security';
import { getSupabaseClient } from '@/lib/supabaseClient';
import {
  sendInquiryConfirmationEmail,
  sendInquiryAdminNotificationEmail,
} from '@/lib/email';

export async function POST(req: Request) {
  try {
    // 1. Enforce Server-Side IP Rate Limiting (5 inquiries per 10 minutes per IP)
    const ip = getClientIp(req);
    const rateCheck = checkRateLimit(`contact:${ip}`, 5, 10 * 60 * 1000);

    if (!rateCheck.success) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many inquiries sent from your connection. Please wait ${rateCheck.reset} seconds before trying again.`,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateCheck.reset),
            'X-RateLimit-Limit': String(rateCheck.limit),
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    }

    // 2. Parse and validate JSON payload
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON request payload.' },
        { status: 400 }
      );
    }

    // 3. Honeypot anti-bot validation
    if (body.website || body.honeypot) {
      // Silently accept bots without persisting spam
      return NextResponse.json({ success: true }, { status: 200 });
    }

    const { name, email, organization, focusArea, message } = body;

    // 4. Input validation and sanitization
    const cleanName = sanitizeText(name, 150);
    const cleanEmail = sanitizeText(email, 254);
    const cleanOrg = organization ? sanitizeText(organization, 150) : null;
    const cleanFocus = focusArea ? sanitizeText(focusArea, 100) : 'General Technology Advisory';
    const cleanMessage = sanitizeText(message, 5000);

    if (!cleanName || cleanName.length < 2) {
      return NextResponse.json(
        { success: false, error: 'Please enter your full name (at least 2 characters).' },
        { status: 400 }
      );
    }

    if (!isValidEmail(cleanEmail)) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid business or personal email address.' },
        { status: 400 }
      );
    }

    if (!cleanMessage || cleanMessage.length < 5) {
      return NextResponse.json(
        { success: false, error: 'Please provide project or inquiry details (at least 5 characters).' },
        { status: 400 }
      );
    }

    // 5. Server-side Duplicate Submission Check
    const client = getSupabaseClient();
    if (client) {
      const { data: isDuplicate } = await client.rpc('check_is_duplicate_inquiry', {
        p_email: cleanEmail,
        p_message: cleanMessage,
      });

      if (isDuplicate) {
        return NextResponse.json(
          {
            success: false,
            error: 'This submission has already been submitted.',
          },
          { status: 409 }
        );
      }

      // 6. Secure database persistence via Supabase
      const { error: dbError } = await client.from('contact_inquiries').insert([
        {
          name: cleanName,
          email: cleanEmail,
          organization: cleanOrg,
          focus_area: cleanFocus,
          message: cleanMessage,
          status: 'new',
        },
      ]);

      if (dbError) {
        console.error('Supabase DB error during contact inquiry submission:', dbError.message);
        // Handle database unique constraint conflict
        if (
          dbError.code === '23505' ||
          dbError.message.includes('unique') ||
          dbError.message.includes('duplicate') ||
          dbError.message.includes('idx_contact_inquiries_unique')
        ) {
          return NextResponse.json(
            { success: false, error: 'This submission has already been submitted.' },
            { status: 409 }
          );
        }
        if (dbError.message.includes('Rate limit exceeded')) {
          return NextResponse.json(
            { success: false, error: 'Rate limit exceeded: too many inquiries submitted with this email.' },
            { status: 429 }
          );
        }
        return NextResponse.json(
          { success: false, error: 'Failed to record inquiry in database. Please email hr@gyanavsolutions.com directly.' },
          { status: 500 }
        );
      }

      // 7. Dispatch Resend Email Notifications (non-blocking)
      // a) Confirmation to user from noreply
      sendInquiryConfirmationEmail({
        name: cleanName,
        email: cleanEmail,
        focusArea: cleanFocus,
        organization: cleanOrg,
      }).catch((emailErr) => {
        console.error('Error dispatching inquiry confirmation email:', emailErr);
      });

      // b) Notification to admin at contact@gyanavsolutions.com
      sendInquiryAdminNotificationEmail({
        name: cleanName,
        email: cleanEmail,
        organization: cleanOrg,
        focusArea: cleanFocus,
        message: cleanMessage,
      }).catch((emailErr) => {
        console.error('Error dispatching inquiry admin notification:', emailErr);
      });
    }

    return NextResponse.json(
      { success: true, message: 'Inquiry submitted successfully.' },
      {
        status: 200,
        headers: {
          'X-RateLimit-Limit': String(rateCheck.limit),
          'X-RateLimit-Remaining': String(rateCheck.remaining),
        },
      }
    );
  } catch (error) {
    console.error('Unhandled error in /api/contact:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error processing inquiry.' },
      { status: 500 }
    );
  }
}
