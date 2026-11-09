import { Resend } from 'resend';

// Initialize Resend client only if API key is provided
const resendApiKey = process.env.RESEND_API_KEY;
const resendClient = resendApiKey ? new Resend(resendApiKey) : null;

// Default sender address using verified custom domain
const DEFAULT_FROM = process.env.RESEND_FROM_EMAIL || 'Gyanav Solutions <hr@gyanavsolutions.com>';

// Admin notification recipients
const ADMIN_APPLIED_EMAIL = process.env.ADMIN_APPLIED_EMAIL || 'hr@gyanavsolutions.com';
const ADMIN_CONTACT_EMAIL = process.env.ADMIN_CONTACT_EMAIL || 'contact@gyanavsolutions.com';

export interface SendEmailResult {
  success: boolean;
  id?: string;
  error?: string;
  skipped?: boolean;
}

/**
 * Send a confirmation email to the candidate upon receiving their job application.
 */
export async function sendApplicationConfirmationEmail(params: {
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
}): Promise<SendEmailResult> {
  const { candidateName, candidateEmail, jobTitle } = params;

  if (!resendClient) {
    console.info(`[Email Service] RESEND_API_KEY not configured. Confirmation email to ${candidateEmail} skipped.`);
    return { success: true, skipped: true };
  }

  const subject = `Confirmation: Application Received for ${jobTitle} — Gyanav Solutions`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; }
          .header { background: #ffffff; padding: 32px 40px; text-align: left; border-bottom: 1px solid #e2e8f0; }
          .header h1 { margin: 0; color: #0f172a; font-size: 20px; font-weight: 700; letter-spacing: -0.02em; }
          .header p { margin: 6px 0 0 0; color: #64748b; font-size: 13px; }
          .content { padding: 40px; }
          .badge { display: inline-block; background: #eff6ff; color: #2563eb; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 600; margin-bottom: 20px; }
          .details { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 24px 0; }
          .details p { margin: 6px 0; font-size: 14px; color: #475569; }
          .details strong { color: #0f172a; }
          .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 24px 40px; font-size: 12px; color: #64748b; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Gyanav Solutions</h1>
            <p>Premier IT Consulting & Healthcare Technology Advisory</p>
          </div>
          <div class="content">
            <div class="badge">Application Received</div>
            <p>Dear ${candidateName},</p>
            <p>Thank you for your interest in joining <strong>Gyanav Solutions</strong>. We have successfully received your application for the <strong>${jobTitle}</strong> position.</p>
            
            <div class="details">
              <p><strong>Position:</strong> ${jobTitle}</p>
              <p><strong>Applicant Name:</strong> ${candidateName}</p>
              <p><strong>Status:</strong> Under Initial Technical Screening</p>
            </div>

            <p>Our engineering and HR department is reviewing your background and credentials. If your experience aligns with our project specifications, we will reach out directly regarding the next interview stage.</p>
            <p>If you have additional portfolio links or credentials to share, feel free to reply or contact <a href="mailto:hr@gyanavsolutions.com" style="color: #2563eb;">hr@gyanavsolutions.com</a>.</p>
            
            <p style="margin-top: 32px;">Warm regards,<br><strong>HR Department</strong><br>Gyanav Solutions</p>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} Gyanav Solutions. All rights reserved.<br>
            Virginia, USA &bull; info@gyanavsolutions.com
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
Hello ${candidateName},

Thank you for applying to Gyanav Solutions. We have successfully received your application for the ${jobTitle} position.

Our HR department is currently reviewing your profile and credentials. If your background matches our technical requirements, we will reach out directly regarding the next steps.

Best regards,
HR Department
Gyanav Solutions
  `.trim();

  try {
    const data = await resendClient.emails.send({
      from: DEFAULT_FROM,
      to: [candidateEmail],
      subject,
      html,
      text,
    });

    if (data.error) {
      console.error('[Resend Error] Application confirmation failed:', data.error);
      return { success: false, error: data.error.message };
    }

    return { success: true, id: data.data?.id };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown email transmission error';
    console.error('[Resend Exception] Error in sendApplicationConfirmationEmail:', msg);
    return { success: false, error: msg };
  }
}

/**
 * Send an alert email to the admin team (hr@gyanavsolutions.com) when a new candidate submits an application.
 */
export async function sendApplicationAdminNotificationEmail(params: {
  candidateName: string;
  candidateEmail: string;
  candidatePhone?: string | null;
  portfolioUrl?: string | null;
  message?: string | null;
  jobTitle: string;
  jobId: string;
}): Promise<SendEmailResult> {
  const { candidateName, candidateEmail, candidatePhone, portfolioUrl, message, jobTitle, jobId } = params;

  if (!resendClient) {
    console.info(`[Email Service] RESEND_API_KEY not set. Admin alert to ${ADMIN_APPLIED_EMAIL} skipped.`);
    return { success: true, skipped: true };
  }

  const subject = `[New Application] ${jobTitle} — ${candidateName}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; }
          .header { background: #ffffff; padding: 24px 32px; border-bottom: 1px solid #e2e8f0; }
          .header h2 { margin: 0; color: #0f172a; font-size: 18px; }
          .content { padding: 32px; }
          .table-row { padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
          .label { font-weight: 600; color: #475569; width: 140px; display: inline-block; }
          .val { color: #0f172a; }
          .message-box { background: #f8fafc; border-left: 3px solid #2563eb; padding: 12px 16px; margin-top: 16px; border-radius: 0 6px 6px 0; font-size: 14px; color: #334155; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>New Job Application Received</h2>
          </div>
          <div class="content">
            <div class="table-row"><span class="label">Position:</span><span class="val"><strong>${jobTitle}</strong> (${jobId})</span></div>
            <div class="table-row"><span class="label">Candidate Name:</span><span class="val"><strong>${candidateName}</strong></span></div>
            <div class="table-row"><span class="label">Candidate Email:</span><span class="val"><a href="mailto:${candidateEmail}">${candidateEmail}</a></span></div>
            <div class="table-row"><span class="label">Phone:</span><span class="val">${candidatePhone || 'Not provided'}</span></div>
            <div class="table-row"><span class="label">Portfolio / Profile:</span><span class="val">${portfolioUrl ? `<a href="${portfolioUrl}" target="_blank">${portfolioUrl}</a>` : 'Not provided'}</span></div>
            
            <p style="margin-top: 20px; font-weight: 600; color: #475569; font-size: 13px; text-transform: uppercase;">Candidate Cover Note:</p>
            <div class="message-box">
              ${message ? message.replace(/\n/g, '<br>') : 'No message provided.'}
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
New Job Application Received

Position: ${jobTitle} (${jobId})
Candidate: ${candidateName}
Email: ${candidateEmail}
Phone: ${candidatePhone || 'Not provided'}
Portfolio / Profile: ${portfolioUrl || 'Not provided'}

Message:
${message || 'No message provided.'}
  `.trim();

  try {
    const data = await resendClient.emails.send({
      from: DEFAULT_FROM,
      to: [ADMIN_APPLIED_EMAIL],
      subject,
      html,
      text,
    });

    if (data.error) {
      console.error('[Resend Error] Admin application alert failed:', data.error);
      return { success: false, error: data.error.message };
    }

    return { success: true, id: data.data?.id };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown email transmission error';
    console.error('[Resend Exception] Error in sendApplicationAdminNotificationEmail:', msg);
    return { success: false, error: msg };
  }
}

/**
 * Send a confirmation email to a client or prospect upon receiving their contact inquiry.
 */
export async function sendInquiryConfirmationEmail(params: {
  name: string;
  email: string;
  focusArea: string;
  organization?: string | null;
}): Promise<SendEmailResult> {
  const { name, email, focusArea, organization } = params;

  if (!resendClient) {
    console.info(`[Email Service] RESEND_API_KEY not configured. Confirmation email to ${email} skipped.`);
    return { success: true, skipped: true };
  }

  const subject = `Confirmation: We Received Your Inquiry — Gyanav Solutions`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; }
          .header { background: #ffffff; padding: 32px 40px; text-align: left; border-bottom: 1px solid #e2e8f0; }
          .header h1 { margin: 0; color: #0f172a; font-size: 20px; font-weight: 700; letter-spacing: -0.02em; }
          .header p { margin: 6px 0 0 0; color: #64748b; font-size: 13px; }
          .content { padding: 40px; }
          .badge { display: inline-block; background: #f0fdf4; color: #16a34a; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 600; margin-bottom: 20px; }
          .details { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 24px 0; }
          .details p { margin: 6px 0; font-size: 14px; color: #475569; }
          .details strong { color: #0f172a; }
          .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 24px 40px; font-size: 12px; color: #64748b; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Gyanav Solutions</h1>
            <p>Premier IT Consulting & Healthcare Technology Advisory</p>
          </div>
          <div class="content">
            <div class="badge">Inquiry Logged</div>
            <p>Dear ${name},</p>
            <p>Thank you for reaching out to <strong>Gyanav Solutions</strong>. We have successfully received your consultation inquiry.</p>
            
            <div class="details">
              <p><strong>Focus Area:</strong> ${focusArea}</p>
              ${organization ? `<p><strong>Organization:</strong> ${organization}</p>` : ''}
              <p><strong>Primary Contact:</strong> ${email}</p>
              <p><strong>Status:</strong> Received &amp; Under Review</p>
            </div>

            <p>We received your message and our team is looking over your details. We’ll get back to you within 24 to 48 hours to talk through your project and answer any questions.</p>
            <p>If you have urgent requirements, you may reply directly to this email or reach us at <a href="mailto:contact@gyanavsolutions.com" style="color: #2563eb;">contact@gyanavsolutions.com</a>.</p>
            
            <p style="margin-top: 32px;">Warm regards,<br><strong>Gyanav Solutions Team</strong><br>Gyanav Solutions</p>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} Gyanav Solutions. All rights reserved.<br>
            Virginia, USA &bull; info@gyanavsolutions.com
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
Hello ${name},

Thank you for reaching out to Gyanav Solutions. We have received your consultation inquiry regarding ${focusArea}.

We received your message and our team is looking over your details. We’ll get back to you within 24 to 48 hours to talk through your project and answer any questions.

If you have urgent questions, you can reach us at contact@gyanavsolutions.com.

Best regards,
Gyanav Solutions Team
Gyanav Solutions
  `.trim();

  try {
    const data = await resendClient.emails.send({
      from: DEFAULT_FROM,
      to: [email],
      subject,
      html,
      text,
    });

    if (data.error) {
      console.error('[Resend Error] Inquiry confirmation failed:', data.error);
      return { success: false, error: data.error.message };
    }

    return { success: true, id: data.data?.id };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown email transmission error';
    console.error('[Resend Exception] Error in sendInquiryConfirmationEmail:', msg);
    return { success: false, error: msg };
  }
}

/**
 * Send an alert email to the admin team (contact@gyanavsolutions.com) when a client submits a consultation inquiry.
 */
export async function sendInquiryAdminNotificationEmail(params: {
  name: string;
  email: string;
  organization?: string | null;
  focusArea: string;
  message: string;
}): Promise<SendEmailResult> {
  const { name, email, organization, focusArea, message } = params;

  if (!resendClient) {
    console.info(`[Email Service] RESEND_API_KEY not set. Admin alert to ${ADMIN_CONTACT_EMAIL} skipped.`);
    return { success: true, skipped: true };
  }

  const subject = `[New Inquiry] ${focusArea} — ${name}${organization ? ` (${organization})` : ''}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; }
          .header { background: #ffffff; padding: 24px 32px; border-bottom: 1px solid #e2e8f0; }
          .header h2 { margin: 0; color: #0f172a; font-size: 18px; }
          .content { padding: 32px; }
          .table-row { padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
          .label { font-weight: 600; color: #475569; width: 140px; display: inline-block; }
          .val { color: #0f172a; }
          .message-box { background: #f8fafc; border-left: 3px solid #16a34a; padding: 12px 16px; margin-top: 16px; border-radius: 0 6px 6px 0; font-size: 14px; color: #334155; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>New Contact Inquiry Received</h2>
          </div>
          <div class="content">
            <div class="table-row"><span class="label">Name:</span><span class="val"><strong>${name}</strong></span></div>
            <div class="table-row"><span class="label">Email:</span><span class="val"><a href="mailto:${email}">${email}</a></span></div>
            <div class="table-row"><span class="label">Organization:</span><span class="val">${organization || 'Not provided'}</span></div>
            <div class="table-row"><span class="label">Focus Area:</span><span class="val"><strong>${focusArea}</strong></span></div>
            
            <p style="margin-top: 20px; font-weight: 600; color: #475569; font-size: 13px; text-transform: uppercase;">Inquiry Scope & Requirements:</p>
            <div class="message-box">
              ${message.replace(/\n/g, '<br>')}
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
New Contact Inquiry Received

Name: ${name}
Email: ${email}
Organization: ${organization || 'Not provided'}
Focus Area: ${focusArea}

Message:
${message}
  `.trim();

  try {
    const data = await resendClient.emails.send({
      from: DEFAULT_FROM,
      to: [ADMIN_CONTACT_EMAIL],
      subject,
      html,
      text,
    });

    if (data.error) {
      console.error('[Resend Error] Admin contact alert failed:', data.error);
      return { success: false, error: data.error.message };
    }

    return { success: true, id: data.data?.id };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown email transmission error';
    console.error('[Resend Exception] Error in sendInquiryAdminNotificationEmail:', msg);
    return { success: false, error: msg };
  }
}
