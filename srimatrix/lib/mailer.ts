import nodemailer from "nodemailer";
import path from "path";
import fs from "fs";

export interface EmailCredentialsConfig {
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  smtpPass: string;
  fromName: string;
  fromEmail: string;
  replyTo: string;
  linkedAccountEmail: string;
  signature: string;
  includeLogoHeader: boolean;
}

let activeEmailCredentials: Partial<EmailCredentialsConfig> = {};

export function getDefaultEmailCredentials(): EmailCredentialsConfig {
  const smtpUser = process.env.SMTP_USER || "";
  const smtpPass = (process.env.SMTP_PASS || "").replace(/\s+/g, "");
  const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
  const smtpPort = Number(process.env.SMTP_PORT) || 465;
  const smtpSecure = process.env.SMTP_SECURE === "true" || smtpPort === 465;

  return {
    smtpHost,
    smtpPort,
    smtpSecure,
    smtpUser,
    smtpPass,
    fromName: process.env.SMTP_FROM_NAME || "SriMatrix Admin",
    fromEmail: process.env.SMTP_FROM_EMAIL || "admin@srimatric.com",
    replyTo: "admin@srimatric.com",
    linkedAccountEmail: "admin@srimatric.com",
    signature: `Best regards,\nAdministrator | SriMatrix Health Operations\nadmin@srimatric.com | +1 (800) 555-0199\nSriMatrix Healthcare Systems • Philadelphia, PA\nhttps://srimatrix.io`,
    includeLogoHeader: false, // Default false: so SriMatrix image is not attached with every email unless requested
  };
}

/**
 * Backend system credentials loaded securely from environment (.env / .env.local).
 * Used for automated employee account creation and system onboarding notices.
 * Never exposed or overwritten by user UI credentials.
 */
export function getBackendSystemEmailCredentials(): EmailCredentialsConfig {
  const smtpUser = process.env.SMTP_USER || "mon@srimatrixhealth.com";
  const smtpPass = (process.env.SMTP_PASS || "kclcicsonhoupmar").replace(/\s+/g, "");
  const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
  const smtpPort = Number(process.env.SMTP_PORT) || 465;
  const smtpSecure = process.env.SMTP_SECURE === "true" || smtpPort === 465;
  const fromEmail = process.env.SMTP_FROM_EMAIL || smtpUser;
  const fromName = process.env.SMTP_FROM_NAME || "SriMatrix Health";

  return {
    smtpHost,
    smtpPort,
    smtpSecure,
    smtpUser,
    smtpPass,
    fromName,
    fromEmail,
    replyTo: fromEmail,
    linkedAccountEmail: fromEmail,
    signature: `Best regards,\nSriMatrix Health Operations\n${fromEmail}\nSriMatrix Healthcare Systems • https://srimatrix.io`,
    includeLogoHeader: false,
  };
}

export function getStoredEmailCredentials(): EmailCredentialsConfig {
  const defaults = getDefaultEmailCredentials();
  return {
    ...defaults,
    ...activeEmailCredentials,
    smtpPort: Number(activeEmailCredentials.smtpPort) || defaults.smtpPort,
    smtpPass: activeEmailCredentials.smtpPass ? String(activeEmailCredentials.smtpPass).replace(/\s+/g, "") : defaults.smtpPass,
    includeLogoHeader: activeEmailCredentials.includeLogoHeader === true,
    signature: activeEmailCredentials.signature !== undefined ? String(activeEmailCredentials.signature) : defaults.signature,
  };
}

export function saveStoredEmailCredentials(config: Partial<EmailCredentialsConfig>): EmailCredentialsConfig {
  activeEmailCredentials = {
    ...activeEmailCredentials,
    ...config,
    smtpPort: Number(config.smtpPort) || activeEmailCredentials.smtpPort,
    smtpPass: config.smtpPass ? String(config.smtpPass).replace(/\s+/g, "") : activeEmailCredentials.smtpPass,
    includeLogoHeader: config.includeLogoHeader === true,
    signature: config.signature !== undefined ? String(config.signature) : activeEmailCredentials.signature,
  };
  return getStoredEmailCredentials();
}

export function createMailerTransporter(customConfig?: Partial<EmailCredentialsConfig>) {
  const config = customConfig ? { ...getStoredEmailCredentials(), ...customConfig } : getStoredEmailCredentials();
  return nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpSecure,
    auth: {
      user: config.smtpUser,
      pass: config.smtpPass.replace(/\s+/g, ""),
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
}

// Singleton transporter instance for backward compatibility
export const mailTransporter = createMailerTransporter();

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  fromName?: string;
  fromEmail?: string;
  replyTo?: string;
  attachments?: any[];
  customConfig?: Partial<EmailCredentialsConfig>;
}

/**
 * Verifies that the SMTP credentials and connection are valid
 */
export async function verifySMTPConnection(customConfig?: Partial<EmailCredentialsConfig>): Promise<{ success: boolean; message: string }> {
  try {
    const transporter = createMailerTransporter(customConfig);
    await transporter.verify();
    const config = customConfig ? { ...getStoredEmailCredentials(), ...customConfig } : getStoredEmailCredentials();
    return {
      success: true,
      message: `SMTP connection established successfully with ${config.smtpHost}:${config.smtpPort} as ${config.smtpUser}`,
    };
  } catch (error: any) {
    console.error("SMTP verification error:", error);
    const user = customConfig?.smtpUser || customConfig?.fromEmail || "account";
    let message = error?.message || "Failed to authenticate with SMTP server.";
    if (message.includes("535") || message.includes("BadCredentials") || message.includes("Username and Password not accepted")) {
      message = `Authentication failed for ${user}: Google rejected the login (Invalid username or Google App Password).`;
    }
    return {
      success: false,
      message,
    };
  }
}

/**
 * Formats plain text email body to clean, natural HTML with proper line breaks and clickable links
 */
export function formatEmailBodyHtml(text: string): string {
  if (!text) return "";
  // If text already contains HTML markup, return untouched
  if (/<\/?(?:p|br|div|table|tr|td|ul|ol|li|h[1-6]|span|a)\b/i.test(text)) {
    return text;
  }

  // 1. Convert emails to mailto links
  let formatted = text.replace(
    /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi,
    '<a href="mailto:$1" style="color: #0284c7; text-decoration: underline;">$1</a>'
  );

  // 2. Convert standard http/https URLs
  formatted = formatted.replace(
    /(https?:\/\/[^\s<]+)/gi,
    '<a href="$1" style="color: #0284c7; text-decoration: underline;" target="_blank">$1</a>'
  );

  // 3. Convert www. addresses
  formatted = formatted.replace(
    /(^|[\s(])(www\.[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}[^\s<)]*)/gi,
    '$1<a href="https://$2" style="color: #0284c7; text-decoration: underline;" target="_blank">$2</a>'
  );

  // 4. Convert specific domain references if not already part of an anchor or email
  formatted = formatted.replace(
    /(^|[\s(])(srimatrixhealth\.com|srimatrix\.io)(\b)/gi,
    '$1<a href="https://$2" style="color: #0284c7; text-decoration: underline;" target="_blank">$2</a>$3'
  );

  // 5. Convert newlines to HTML breaks
  return formatted.replace(/\n/g, "<br>");
}

/**
 * Send a single email via SMTP
 */
export async function sendEmail({
  to,
  subject,
  text,
  html,
  fromName,
  fromEmail,
  replyTo,
  attachments,
  customConfig,
}: SendEmailOptions) {
  const config = customConfig ? { ...getStoredEmailCredentials(), ...customConfig } : getStoredEmailCredentials();
  const resolvedFromName = fromName || config.fromName || "SriMatrix Admin";
  const resolvedFromEmail = fromEmail || config.fromEmail || config.smtpUser;
  const resolvedReplyTo = replyTo || config.replyTo || resolvedFromEmail;

  const fromFormatted = `"${resolvedFromName.replace(/"/g, "")}" <${resolvedFromEmail}>`;

  const emailAttachments = attachments ? [...attachments] : [];
  const defaultLogoPath = path.join(process.cwd(), "public/srimatrix-health-logo.png");

  // Only attach the SriMatrix logo image if enabled in credentials settings
  if (config.includeLogoHeader && fs.existsSync(defaultLogoPath) && !emailAttachments.some((a) => a.cid === "srimatrix_logo")) {
    emailAttachments.push({
      filename: "srimatrix-health-logo.png",
      path: defaultLogoPath,
      cid: "srimatrix_logo",
    });
  }

  const transporter = createMailerTransporter(config);

  let finalText = text;
  let finalHtml = html || (text ? text.replace(/\n/g, "<br>") : undefined);

  if (config.signature && config.signature.trim()) {
    const trimmedSig = config.signature.trim();
    const sigHtmlSnippet = trimmedSig.replace(/\n/g, "<br>");
    if (finalText && !finalText.includes(trimmedSig)) {
      finalText = `${finalText}\n\n--\n${trimmedSig}`;
    }
    // Only auto-append if the HTML doesn't already contain the signature
    if (
      finalHtml &&
      !finalHtml.includes(trimmedSig) &&
      !finalHtml.includes(sigHtmlSnippet) &&
      !finalHtml.includes('class="signature"') &&
      !finalHtml.includes('class="srimatrix-signature"')
    ) {
      const sigHtml = `<div class="srimatrix-signature" style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #475569; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; white-space: pre-wrap;">${sigHtmlSnippet}</div>`;
      if (finalHtml.includes("</body>")) {
        finalHtml = finalHtml.replace("</body>", `${sigHtml}</body>`);
      } else {
        finalHtml = `${finalHtml}${sigHtml}`;
      }
    }
  }

  const info = await transporter.sendMail({
    from: fromFormatted,
    to: Array.isArray(to) ? to.join(", ") : to,
    replyTo: resolvedReplyTo,
    subject,
    text: finalText,
    html: finalHtml,
    attachments: emailAttachments,
  });

  return info;
}

export interface CampaignRecipientItem {
  email: string;
  name?: string;
  roleOrCompany?: string;
}

export interface SendCampaignOptions {
  recipients: CampaignRecipientItem[];
  subject: string;
  body: string;
  customConfig?: Partial<EmailCredentialsConfig>;
}

/**
 * Sends a personalized campaign email to multiple recipients
 */
export async function sendCampaignBatch({
  recipients,
  subject,
  body,
  customConfig,
}: SendCampaignOptions): Promise<{
  success: boolean;
  total: number;
  sent: number;
  failed: number;
  results: Array<{ email: string; success: boolean; error?: string }>;
}> {
  const config = customConfig ? { ...getStoredEmailCredentials(), ...customConfig } : getStoredEmailCredentials();
  const results: Array<{ email: string; success: boolean; error?: string }> = [];
  let sent = 0;
  let failed = 0;

  for (const recipient of recipients) {
    if (!recipient.email || !recipient.email.includes("@")) {
      failed++;
      results.push({ email: recipient.email || "unknown", success: false, error: "Invalid email" });
      continue;
    }

    try {
      const firstName = recipient.name
        ? recipient.name.split(" ")[0]
        : recipient.email.split("@")[0];
      const fullName = recipient.name || firstName;
      const company = recipient.roleOrCompany || "SriMatrix Partner";

      // Interpolate template placeholders
      const personalizedSubject = subject
        .replace(/\{\{\s*first_name\s*\}\}/gi, firstName)
        .replace(/\{\{\s*name\s*\}\}/gi, fullName)
        .replace(/\{\{\s*company\s*\}\}/gi, company)
        .replace(/\{\{\s*email\s*\}\}/gi, recipient.email);

      const personalizedBody = body
        .replace(/\{\{\s*first_name\s*\}\}/gi, firstName)
        .replace(/\{\{\s*name\s*\}\}/gi, fullName)
        .replace(/\{\{\s*company\s*\}\}/gi, company)
        .replace(/\{\{\s*email\s*\}\}/gi, recipient.email);

      // Format body naturally with HTML line breaks and clickable links
      const formattedBody = formatEmailBodyHtml(personalizedBody);

      // Signature: appended naturally beneath body
      const signatureSection = config.signature
        ? `<div class="signature" style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #475569; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6;">${formatEmailBodyHtml(config.signature)}</div>`
        : "";

      // Logo banner: placed below signature if logo attachment enabled
      const logoSection = config.includeLogoHeader
        ? `<div style="margin-top: 18px;">
            <img src="cid:srimatrix_logo" alt="SriMatrix Health" style="height: 48px; width: auto; max-width: 220px; display: block; border: 0;" />
           </div>`
        : "";

      const senderEmail = config.fromEmail || config.smtpUser;
      const footerHtml = `<div style="margin-top: 36px; padding-top: 16px; border-top: 1px solid #f1f5f9; font-size: 12px; color: #94a3b8; text-align: center; line-height: 1.6;">
        Sent securely via SriMatrixHealth<br>
        Sender: <a href="mailto:${senderEmail}" style="color: #0284c7; text-decoration: underline;">${senderEmail}</a><br>
        © ${new Date().getFullYear()} SriMatrix Health. All rights reserved.
      </div>`;

      // Normal, clean email layout without card boxes or background canvas
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 20px 0; background-color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #1e293b;">
  <div style="max-width: 680px; margin: 0 auto; padding: 0 16px;">
    <div style="font-size: 14px; line-height: 1.6; color: #1e293b;">
      ${formattedBody}
    </div>
    ${signatureSection}
    ${logoSection}
    ${footerHtml}
  </div>
</body>
</html>
      `;

      const plainFooterText = `\n\nSent securely via SriMatrixHealth\nSender: ${senderEmail}\n© ${new Date().getFullYear()} SriMatrix Health. All rights reserved.`;
      const bodyWithSignature = config.signature
        ? `${personalizedBody}\n\n--\n${config.signature}${plainFooterText}`
        : `${personalizedBody}${plainFooterText}`;

      await sendEmail({
        to: recipient.email,
        subject: personalizedSubject,
        text: bodyWithSignature,
        html: htmlContent,
        customConfig: config,
      });

      sent++;
      results.push({ email: recipient.email, success: true });
    } catch (err: any) {
      console.error(`Failed to send email to ${recipient.email}:`, err);
      failed++;
      results.push({
        email: recipient.email,
        success: false,
        error: err?.message || "Failed to send email",
      });
    }
  }

  return {
    success: failed === 0,
    total: recipients.length,
    sent,
    failed,
    results,
  };
}

export interface WelcomeCredentialsOptions {
  name: string;
  email: string;
  password?: string;
  role?: string;
  position?: string | null;
  portalUrl?: string;
}

/**
 * Sends automated onboarding email to newly created employee/user with their login credentials
 */
export async function sendWelcomeCredentialsEmail({
  name,
  email,
  password = "srimatrix123",
  role = "employee",
  position,
  portalUrl = "https://srimatrix.io/login",
}: WelcomeCredentialsOptions) {
  const config = getBackendSystemEmailCredentials();

  const headerSection = config.includeLogoHeader
    ? `<div class="header">
        <img src="cid:srimatrix_logo" alt="SriMatrix Health" class="logo-img" style="height: 64px; width: auto; max-width: 280px; display: block; margin: 0 auto; border: 0;" />
       </div>`
    : `<div class="header" style="background: #ffffff; padding: 22px 24px; border-top: 4px solid #0284c7; border-bottom: 1px solid #e2e8f0; text-align: left;">
        <span style="font-weight: 800; font-size: 18px; color: #0284c7; letter-spacing: -0.5px;">SriMatrix Health</span>
       </div>`;

  const signatureSection = config.signature
    ? `<div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #475569; white-space: pre-wrap;">${config.signature.replace(/\n/g, "<br>")}</div>`
    : "";

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #0f172a; }
    .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .header { background: #ffffff; padding: 24px; border-top: 4px solid #0284c7; border-bottom: 1px solid #e2e8f0; text-align: center; }
    .logo-img { height: 64px; width: auto; max-width: 280px; display: block; margin: 0 auto; border: 0; }
    .content { padding: 32px; font-size: 15px; line-height: 1.6; color: #334155; }
    .creds-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 24px 0; }
    .cred-title { font-weight: 700; color: #0f172a; margin-bottom: 12px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; }
    .cred-item { margin-bottom: 10px; font-size: 14px; }
    .cred-label { color: #64748b; font-weight: 600; width: 150px; display: inline-block; }
    .cred-val { font-family: monospace; font-weight: 700; color: #4f46e5; background: #eef2ff; padding: 3px 8px; border-radius: 6px; }
    .btn { display: inline-block; background: #4f46e5; color: #ffffff !important; font-weight: 700; text-decoration: none; padding: 12px 24px; border-radius: 10px; margin-top: 16px; font-size: 14px; }
    .footer { padding: 20px 32px; background: #f8fafc; border-top: 1px solid #f1f5f9; font-size: 12px; color: #94a3b8; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    ${headerSection}
    <div class="content">
      <p style="font-size: 17px; font-weight: 700; color: #0f172a; margin-top: 0;">Dear ${name},</p>
      <p>Welcome to <strong>SriMatrix Health</strong>. Your employee account has been created on the portal.</p>
      
      <div class="creds-box">
        <div class="cred-title">Your Login Credentials</div>
        <div class="cred-item">
          <span class="cred-label">Email:</span>
          <span class="cred-val">${email}</span>
        </div>
        <div class="cred-item">
          <span class="cred-label">Password:</span>
          <span class="cred-val">${password}</span>
        </div>
      </div>

      <p>You can now log in to the SriMatrix portal to enter your weekly timesheets, track project hours, and view organizational updates.</p>

      <p style="margin-top: 24px;">
        <a href="${portalUrl}" class="btn">Log In to SriMatrix Portal &rarr;</a>
      </p>

      ${signatureSection}

      <p style="font-size: 12px; color: #64748b; margin-top: 28px; border-top: 1px solid #e2e8f0; padding-top: 16px;">
        * For security, please log in and update your password after your initial sign-in. If you have any questions, please contact your team administrator.
      </p>
    </div>
    <div class="footer">
      Sent securely via SriMatrixHealth<br>
      Sender: <a href="mailto:${config.fromEmail || config.smtpUser}" style="color: #0284c7; text-decoration: underline;">${config.fromEmail || config.smtpUser}</a><br>
      © ${new Date().getFullYear()} SriMatrix Health. All rights reserved.
    </div>
  </div>
</body>
</html>
  `;

  return await sendEmail({
    to: email,
    subject: `Welcome to SriMatrix Health - Your Account Credentials`,
    text: `Dear ${name},\n\nYour account has been created on the SriMatrix Health portal.\n\nEmail: ${email}\nPassword: ${password}\n\nPlease log in at: ${portalUrl}\n\n${config.signature}`,
    html,
    fromName: config.fromName,
    fromEmail: config.fromEmail,
    customConfig: config,
  });
}

/**
 * Send a verification test email
 */
export async function sendTestEmail(toEmail: string, customConfig?: Partial<EmailCredentialsConfig>) {
  const config = customConfig ? { ...getStoredEmailCredentials(), ...customConfig } : getStoredEmailCredentials();
  const testSubject = `[Test Verification] SriMatrix SMTP Connection Successful`;
  const testBody = `Hello,\n\nThis is a verification test email sent from SriMatrixHealth.\n\nConfiguration Status:\n• SMTP Server: ${config.smtpHost}:${config.smtpPort}\n• SMTP Authenticated Account: ${config.smtpUser}\n• Linked Admin Account: ${config.linkedAccountEmail}\n• From Name: ${config.fromName}\n• Outbound Address: ${config.fromEmail}\n• Logo Banner Attachment: ${config.includeLogoHeader ? "Enabled" : "Disabled"}\n\nYour Google App Password and SMTP Relay credentials are functioning properly.`;

  return await sendEmail({
    to: toEmail,
    subject: testSubject,
    text: testBody,
    customConfig,
  });
}
