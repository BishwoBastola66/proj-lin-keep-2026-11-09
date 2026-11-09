import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';
import { supabase } from '@/lib/supabase';

// Global persistent connection pool to eliminate "Too many login attempts" (454) errors
const transporter = nodemailer.createTransport({
  pool: true,
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER || 'mon@srimatrixhealth.com',
    pass: process.env.SMTP_PASS || 'zwus fodd ptku syio'
  },
  maxConnections: 1, // Single authenticated connection to prevent Google concurrent login blocks
  maxMessages: 100,  // Up to 100 messages per connection before clean recycling
  rateLimit: 1,     // Paced at 1 message per second
  rateDelta: 1000
});

async function sendMailWithRetry(mailOptions: any, maxRetries = 3) {
  let lastError: any = null;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await transporter.sendMail(mailOptions);
    } catch (err: any) {
      lastError = err;
      const is454 = err?.responseCode === 454 || (err?.message && err.message.includes('454'));
      if (is454 && attempt < maxRetries) {
        const delay = attempt * 2500;
        console.warn(`[SMTP Throttle 454] Rate-limited by Google. Pausing ${delay}ms before retry ${attempt}/${maxRetries}...`);
        await new Promise(res => setTimeout(res, delay));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

export async function POST(req: Request) {
  try {
    const { entity_id, entity_type, to_email, subject, body, user_id, sender_name, sender_position, sender_phone, facility_id } = await req.json();

    const isHtml = /<[a-z][\s\S]*>/i.test(body);
    const innerContent = isHtml ? body : `<p>${body.replace(/\n/g, '<br/>')}</p>`;
    
    // Resolve logo path (transparent PNG for seamless light and dark mode)
    const logoTransparentPath = path.join(process.cwd(), 'public', 'logo-transparent.png');
    const logoFallbackPath = path.join(process.cwd(), 'public', 'image.png');
    const chosenLogoPath = fs.existsSync(logoTransparentPath) ? logoTransparentPath : logoFallbackPath;
    const hasLogo = fs.existsSync(chosenLogoPath);
    
    const attachments = hasLogo ? [
      {
        filename: 'srimatrix-health-logo.png',
        path: chosenLogoPath,
        cid: 'srimatrix-logo'
      }
    ] : [];

    const htmlTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <title>${subject || 'Srimatrix Health'}</title>
  <style>
    body, p, div, span, a, li {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }
    p { margin: 0 0 16px 0; line-height: 1.65; font-size: 15px; color: #1e293b; }
    ul { margin: 0 0 16px 0; padding-left: 20px; }
    li { margin-bottom: 6px; line-height: 1.65; font-size: 15px; color: #1e293b; }
    a { color: #0284c7; text-decoration: none; }
    a:hover { text-decoration: underline; }
    strong, b { color: #0f172a; font-weight: 600; }
  </style>
</head>
<body style="margin:0;padding:24px 16px;background-color:transparent;-webkit-font-smoothing:antialiased;">
  <div style="max-width:600px;margin:0 auto;">

    <!-- Natural Direct Content (No Gimmicky Banners) -->
    <div style="font-size:15px;line-height:1.65;color:#1e293b;">
      ${innerContent}
    </div>

    <!-- Executive Sign-off & Brand Logo (At the end / In last) -->
    <div style="margin-top:28px;padding-top:16px;border-top:1px solid #e2e8f0;">
      <p style="margin:0 0 4px 0;font-size:14px;color:#64748b;">Best regards,</p>
      <p style="margin:0;font-size:15px;font-weight:700;color:#0f172a;letter-spacing:-0.2px;">${sender_name || 'Tribhuvan Pandey'}</p>
      <p style="margin:2px 0 0 0;font-size:13px;font-weight:600;color:#0d9488;">${sender_position || 'Director, Marketing and Communication'}</p>
      <p style="margin:3px 0 0 0;font-size:13px;color:#64748b;">
        ${sender_phone || '(505) 730-6430'} &bull; <a href="https://srimatrixhealth.com" style="color:#0284c7;text-decoration:none;font-weight:500;">srimatrixhealth.com</a>
      </p>

      ${hasLogo ? `
      <div style="margin-top:14px;">
        <a href="https://srimatrixhealth.com" style="display:inline-block;text-decoration:none;">
          <img src="cid:srimatrix-logo" alt="Srimatrix Health" width="130" style="display:block;width:130px;max-width:100%;height:auto;border:0;outline:none;" />
        </a>
      </div>` : ''}
    </div>

  </div>
</body>
</html>`;

    // Send email with inline attachments and automatic 454 throttle retry
    const info = await sendMailWithRetry({
      from: `"${sender_name || 'Tribhuvan Pandey'} — Srimatrix Health" <${process.env.SMTP_USER || 'mon@srimatrixhealth.com'}>`,
      to: to_email,
      subject: subject,
      text: body.replace(/<[^>]*>?/gm, ''), // strip html for plain text fallback
      html: htmlTemplate,
      attachments: attachments
    });

    let interactionData = null;
    
    // Resolve facility_id (backwards compatibility or entity mapping)
    const targetFacilityId = entity_type === 'srimatric' ? entity_id : facility_id;

    // Log interaction only for facilities since the table requires it
    if (targetFacilityId) {
      const { data, error } = await supabase
        .from('facility_interactions')
        .insert([
          {
            facility_id: targetFacilityId,
            user_id,
            interaction_type: 'Email (Sent)',
            subject: subject,
            body: body,
            outcome: 'Sent',
            email_message_id: info.messageId,
            created_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (error) {
        console.error("Failed to log interaction:", error);
      } else {
        interactionData = data;
      }
    }

    return NextResponse.json({ success: true, messageId: info.messageId, interaction: interactionData });
  } catch (error: any) {
    console.error('Error sending email:', error);
    return NextResponse.json({ error: error.message || 'Failed to send email' }, { status: 500 });
  }
}

