import { NextResponse } from 'next/server';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { sanitizeText, sanitizeUrl, isValidEmail, isValidPhone } from '@/lib/security';
import { getSupabaseClient } from '@/lib/supabaseClient';
import {
  sendApplicationConfirmationEmail,
  sendApplicationAdminNotificationEmail,
} from '@/lib/email';

export async function POST(req: Request) {
  try {
    // 1. Enforce Server-Side IP Rate Limiting (5 applications per 10 minutes per IP)
    const ip = getClientIp(req);
    const rateCheck = checkRateLimit(`apply:${ip}`, 5, 10 * 60 * 1000);

    if (!rateCheck.success) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many submissions from your connection. Please wait ${rateCheck.reset} seconds before trying again.`,
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
      // Silently reject bots without raising suspicion
      return NextResponse.json({ success: true }, { status: 200 });
    }

    const {
      jobId,
      candidateName,
      candidateEmail,
      candidatePhone,
      portfolioUrl,
      message,
    } = body;

    // 4. Input validation and sanitization
    const cleanName = sanitizeText(candidateName, 150);
    const cleanEmail = sanitizeText(candidateEmail, 254);
    const cleanJobId = sanitizeText(jobId, 100);
    const cleanPhone = candidatePhone ? sanitizeText(candidatePhone, 50) : null;
    const cleanMessage = message ? sanitizeText(message, 5000) : null;

    if (!cleanName || cleanName.length < 2) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid candidate name (at least 2 characters).' },
        { status: 400 }
      );
    }

    if (!isValidEmail(cleanEmail)) {
      return NextResponse.json(
        { success: false, error: 'Please provide a valid email address.' },
        { status: 400 }
      );
    }

    if (!cleanJobId) {
      return NextResponse.json(
        { success: false, error: 'Target position ID is required.' },
        { status: 400 }
      );
    }

    if (cleanPhone && !isValidPhone(cleanPhone)) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid telephone number format.' },
        { status: 400 }
      );
    }

    // Portfolio URL protocol sanitization
    let safePortfolio: string | null = null;
    if (portfolioUrl && typeof portfolioUrl === 'string' && portfolioUrl.trim() !== '') {
      safePortfolio = sanitizeUrl(portfolioUrl);
      if (!safePortfolio) {
        return NextResponse.json(
          {
            success: false,
            error: 'Portfolio URL must be a valid http:// or https:// address.',
          },
          { status: 400 }
        );
      }
    }

    // 5. Server-side Duplicate Submission Check
    const client = getSupabaseClient();
    if (client) {
      const { data: isDuplicate } = await client.rpc('check_is_duplicate_application', {
        p_job_id: cleanJobId,
        p_email: cleanEmail,
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
      const { error: dbError } = await client.from('job_applications').insert([
        {
          job_id: cleanJobId,
          candidate_name: cleanName,
          candidate_email: cleanEmail,
          candidate_phone: cleanPhone,
          portfolio_url: safePortfolio,
          message: cleanMessage,
          stage: 'Review',
        },
      ]);

      if (dbError) {
        console.error('Supabase DB error during job application submission:', dbError.message);
        // Handle database unique constraint conflict
        if (
          dbError.code === '23505' ||
          dbError.message.includes('unique') ||
          dbError.message.includes('duplicate') ||
          dbError.message.includes('idx_job_applications_unique')
        ) {
          return NextResponse.json(
            { success: false, error: 'This submission has already been submitted.' },
            { status: 409 }
          );
        }
        if (dbError.message.includes('Rate limit exceeded')) {
          return NextResponse.json(
            { success: false, error: 'Rate limit exceeded: too many applications submitted with this email.' },
            { status: 429 }
          );
        }
        return NextResponse.json(
          { success: false, error: 'Failed to record application in database. Please contact hr@gyanavsolutions.com directly.' },
          { status: 500 }
        );
      }

      // 7. Lookup job title for personalized email
      let jobTitle = 'Applied Position';
      try {
        const { data: jobRow } = await client
          .from('jobs')
          .select('title')
          .eq('id', cleanJobId)
          .maybeSingle();
        if (jobRow?.title) {
          jobTitle = jobRow.title;
        }
      } catch {
        // Fallback to default position title
      }

      // 8. Dispatch Resend Email Notifications (non-blocking)
      // a) Confirmation to candidate from noreply
      sendApplicationConfirmationEmail({
        candidateName: cleanName,
        candidateEmail: cleanEmail,
        jobTitle,
      }).catch((emailErr) => {
        console.error('Error dispatching application confirmation email:', emailErr);
      });

      // b) Notification to admin at hr@gyanavsolutions.com
      sendApplicationAdminNotificationEmail({
        candidateName: cleanName,
        candidateEmail: cleanEmail,
        candidatePhone: cleanPhone,
        portfolioUrl: safePortfolio,
        message: cleanMessage,
        jobTitle,
        jobId: cleanJobId,
      }).catch((emailErr) => {
        console.error('Error dispatching application admin notification:', emailErr);
      });
    }

    return NextResponse.json(
      { success: true, message: 'Job application recorded successfully.' },
      {
        status: 200,
        headers: {
          'X-RateLimit-Limit': String(rateCheck.limit),
          'X-RateLimit-Remaining': String(rateCheck.remaining),
        },
      }
    );
  } catch (error) {
    console.error('Unhandled error in /api/apply:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error processing application.' },
      { status: 500 }
    );
  }
}
