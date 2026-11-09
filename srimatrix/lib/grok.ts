/**
 * Groq AI Integration (Ultra-Fast Inference, Lowest Token Consumption & Free Tier)
 * Endpoint: https://api.groq.com/openai/v1/chat/completions (OpenAI Compatible)
 * Primary Model: qwen/qwen3.8-27b (Fast 300ms response, high intelligence, structured JSON)
 * Fallback Models: openai/gpt-oss-20b, openai/gpt-oss-120b
 */

export interface GrokCompletionOptions {
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  model?: string;
  jsonMode?: boolean;
}

export interface GrokEmailGenerationOptions {
  topic?: string;
  category?: "all" | "accounts" | "srimatrix" | "clients" | "candidates";
  tone?: "professional" | "urgent" | "friendly";
}

export interface GrokEmailResult {
  success: boolean;
  subject: string;
  body: string;
  modelUsed: string;
  tokensUsed?: number;
  isFallback?: boolean;
  message?: string;
}

export interface GrokApplicationOptions {
  topic?: string;
  customPrompt?: string;
  mode?: "job" | "custom";
  role?: string;
  candidateName?: string;
  supervisor?: string;
  workLocation?: string;
}

export interface GrokApplicationResult {
  success: boolean;
  title: string;
  label?: string;
  candidateName: string;
  positionTitle: string;
  pages: string[];
  page1Html: string;
  page2Html: string;
  modelUsed: string;
  message?: string;
}

const DEFAULT_GROQ_BASE_URL = "https://api.groq.com/openai/v1";
const DEFAULT_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-20b";

/**
 * Checks whether the Groq AI API key is configured
 */
export function isGrokConfigured(): boolean {
  const key = (process.env.GROQ_API_KEY || process.env.XAI_API_KEY || "").trim();
  return Boolean(key);
}

/**
 * Low-level call to Groq Chat Completions API with minimal token consumption
 */
export async function callGrokAPI({
  prompt,
  systemPrompt = "You are a concise executive assistant for SriMatrix Health. Output strictly only what is requested without conversational filler.",
  maxTokens = 600,
  temperature = 0.4,
  model = DEFAULT_MODEL,
  jsonMode = false,
}: GrokCompletionOptions): Promise<{ text: string; tokensUsed?: number; model: string }> {
  const apiKey = (process.env.GROQ_API_KEY || process.env.XAI_API_KEY || "").trim();

  if (!apiKey) {
    throw new Error("GROK_API_KEY is not configured in .env");
  }

  const isXai = apiKey.startsWith("xai-");
  const baseUrl = isXai ? "https://api.x.ai/v1" : DEFAULT_GROQ_BASE_URL;

  const candidateModels = isXai
    ? [model, "grok-2-mini", "grok-beta"]
    : maxTokens > 600
    ? ["openai/gpt-oss-20b", "openai/gpt-oss-120b"]
    : ["qwen/qwen3.8-27b", "openai/gpt-oss-20b"];

  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: prompt },
  ];

  let lastError: any = null;

  for (const m of candidateModels) {
    try {
      const payload: any = {
        model: m,
        messages,
        max_tokens: maxTokens,
        temperature,
        stream: false,
      };

      if (jsonMode) {
        payload.response_format = { type: "json_object" };
      }

      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        if (
          response.status === 404 ||
          response.status === 400 ||
          response.status === 429 ||
          response.status === 503
        ) {
          lastError = new Error(`Groq model ${m} returned ${response.status}: ${errorText}`);
          continue;
        }
        throw new Error(`Groq API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      const choice = data.choices?.[0];
      const content = choice?.message?.content || "";
      const tokensUsed = data.usage?.total_tokens;

      return {
        text: content.trim(),
        tokensUsed,
        model: m,
      };
    } catch (err: any) {
      lastError = err;
      if (err.message?.includes("not configured")) throw err;
    }
  }

  throw lastError || new Error("Failed to communicate with Groq API.");
}

/**
 * Strips any accidental trailing sign-offs / signatures from email body
 */
export function stripTrailingSignature(text: string): string {
  if (!text) return "";
  return text
    .replace(/\n\s*--\s*\n[\s\S]*$/i, "")
    .replace(
      /\n\s*(?:(?:warm|best|kind|warmest)?\s*regards|sincerely|cheers|yours truly|respectfully|thank you|thanks|with appreciation)[,\s]*[\r\n]+[\s\S]*$/i,
      ""
    )
    .replace(
      /\n\s*(?:SriMatrix Health(?:\s+Team|\s+Operations|\s+Management)?|Operations Department|Staffing Coordinator|Human Resources)[\s\S]*$/i,
      ""
    )
    .trim();
}

/**
 * Parses raw JSON or field output from Groq email response
 */
export function parseEmailResponse(rawText: string, fallbackTopic?: string): { subject: string; body: string } {
  let clean = rawText.trim();
  clean = clean.replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();

  try {
    const parsed = JSON.parse(clean);
    if (parsed.subject && parsed.body) {
      return {
        subject: String(parsed.subject).trim(),
        body: String(parsed.body).trim(),
      };
    }
  } catch {}

  const subjectMatch =
    clean.match(/"subject"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/i) ||
    clean.match(/(?:^|\n)\s*subject\s*:\s*(.+)/i);
  const bodyMatch =
    clean.match(/"body"\s*:\s*"([\s\S]*?)(?:"\s*\}|"$)/i) ||
    clean.match(/(?:^|\n)\s*body\s*:\s*([\s\S]+)/i);

  let subject = subjectMatch ? subjectMatch[1].replace(/\\"/g, '"').replace(/\\n/g, " ").trim() : "";
  let body = bodyMatch ? bodyMatch[1].replace(/\\"/g, '"').replace(/\\n/g, "\n").trim() : "";

  if (!subject || subject.startsWith("{") || subject.length < 3) {
    subject = fallbackTopic ? `${fallbackTopic.slice(0, 60)} - SriMatrix Health` : "SriMatrix Health Operations Notice";
  }
  if (!body || body.startsWith("{") || body.length < 15) {
    body = `Hi {{first_name}},\n\nFollowing up regarding our scheduled operational requirements and workforce alignment. Please review your portal schedule.`;
  }

  return { subject, body };
}

/**
 * Generates an executive campaign email draft using Groq (Fastest & low token usage)
 */
export async function generateGrokEmailDraft({
  topic,
  category = "all",
  tone = "professional",
}: GrokEmailGenerationOptions): Promise<GrokEmailResult> {
  const apiKey = (process.env.GROQ_API_KEY || process.env.XAI_API_KEY || "").trim();

  if (!apiKey) {
    const fallback = getFallbackEmail(topic, category);
    return {
      success: true,
      subject: fallback.subject,
      body: fallback.body,
      modelUsed: "offline-template-mode",
      isFallback: true,
      message: "Generated via template mode. GROQ_API_KEY is not set.",
    };
  }

  const audienceDetails =
    category === "candidates"
      ? "healthcare candidates & applicants (Registered Nurses, Travel RNs, LPNs, CNAs, Allied Health). Focus on exciting travel contracts, high weekly pay stipends, per diem shifts, fast onboarding."
      : category === "clients"
      ? "hospital administrators, clinical directors & healthcare facility managers. Focus on solving acute staffing shortages, reliable 24/7 credentialed nurse placement, Joint Commission compliance."
      : category === "accounts" || category === "srimatrix"
      ? "active SriMatrix clinical workforce & staff. Focus on timesheet deadlines, shift confirmation, credential renewals, operational updates."
      : "healthcare stakeholders, clinical staff, and facility partners.";

  const userPrompt = topic
    ? `Topic: "${topic.slice(0, 160)}". Target: ${audienceDetails}. Tone: ${tone}.`
    : `Target: ${audienceDetails}. Purpose: Weekly operations and workforce alignment notice. Tone: ${tone}.`;

  const systemPrompt = `You are the executive communications copywriter for SriMatrix Health (srimatrixhealth.com), a premier healthcare professional staffing and workforce management company.
Return ONLY raw JSON with no markdown fences:
{"subject":"...","body":"..."}

Rules:
1. Subject line must be punchy, relevant to SriMatrix healthcare staffing, under 9 words.
2. Salutation MUST use "{{first_name}}".
3. Body must be concise (under 90 words) with clear paragraph breaks (\\n\\n).
4. CRITICAL: Do NOT include any sign-off or closing signature. Backend appends the official signature.`;

  try {
    const result = await callGrokAPI({
      prompt: userPrompt,
      systemPrompt,
      maxTokens: 350,
      temperature: 0.5,
      jsonMode: true,
    });

    const parsed = parseEmailResponse(result.text, topic);
    const cleanedBody = stripTrailingSignature(parsed.body);

    return {
      success: true,
      subject: parsed.subject,
      body: cleanedBody,
      modelUsed: result.model,
      tokensUsed: result.tokensUsed,
      isFallback: false,
      message: `Generated with ${result.model} on Groq (Ultra-Fast)`,
    };
  } catch (err: any) {
    console.error("Groq email draft error:", err.message);
    const fallback = getFallbackEmail(topic, category);
    return {
      success: true,
      subject: fallback.subject,
      body: stripTrailingSignature(fallback.body),
      modelUsed: "fallback-template",
      isFallback: true,
      message: `Groq API error: ${err.message}. Used fallback draft.`,
    };
  }
}

/**
 * Replaces any accidental bracket placeholders (e.g. $[Annual Salary] or [Department Name]) with realistic SriMatrix details
 */
export function removeBracketPlaceholders(html: string, roleName: string, candidateName: string): string {
  if (!html) return "";

  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 14);
  const formattedDate = futureDate.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });

  return html
    .replace(/\$\[(?:Annual\s*)?Salary\]/gi, "$98,500 per annum ($47.36/hour)")
    .replace(/\[(?:Annual\s*)?Salary\]/gi, "$98,500 per annum ($47.36/hour)")
    .replace(/\[(?:Proposed\s*)?Start\s*Date\]/gi, formattedDate)
    .replace(/\[(?:Manager'?s?\s*)?Name(?:\/Title)?\]/gi, "Suneel Sah, Director")
    .replace(/\[(?:Reporting\s*)?To\]/gi, "Suneel Sah, Director")
    .replace(/\[Department(?:\s*Name)?\]/gi, "Clinical Operations & Healthcare Staffing Division")
    .replace(/\[(?:Work\s*)?Location.*?\]/gi, "SriMatrix Health Partner Clinical Facility / Hybrid")
    .replace(/\[Candidate(?:\s*Name)?\]/gi, candidateName || "Valued Associate")
    .replace(/\[(?:Position|Job)(?:\s*Title)?\]/gi, roleName || "Registered Nurse (RN)")
    .replace(/\[(?:Supervisor|Director)(?:\s*Name)?\]/gi, "Suneel Sah, Director")
    .replace(/\[(?:Company|Organization)(?:\s*Name)?\]/gi, "SriMatrix Health LLC")
    .replace(/\[(?:Phone|Contact)(?:\s*Number)?\]/gi, "(800) 555-SRIMATRIX")
    .replace(/\[(?:Email|Address)?\]/gi, "info@srimatrixhealth.com");
}

/**
 * Generates an official Application, Custom Letter, or Agreement for SriMatrix Health using Groq
 * Guaranteed ZERO bracket placeholders and strict page budgeting to prevent layout overflow.
 */
export async function generateGrokApplicationDraft(
  options: GrokApplicationOptions
): Promise<GrokApplicationResult> {
  const {
    topic = "Clinical Staff Offer Letter",
    customPrompt = "",
    mode = "job",
    role = "Clinical Specialist",
    candidateName = "Candidate",
    supervisor = "Suneel Sah, Director",
    workLocation = "SriMatrix Health Clinical Partner Facility",
  } = options;

  const isCustom = mode === "custom" || Boolean(customPrompt && customPrompt.trim().length > 0 && !/offer\s*letter|job\s*offer/i.test(customPrompt));
  const activePrompt = customPrompt?.trim() || topic;

  const currentDate = new Date().toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });

  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 14);
  const defaultStartDate = futureDate.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });

  const deadlineDate = new Date();
  deadlineDate.setDate(deadlineDate.getDate() + 5);
  const formattedDeadline = deadlineDate.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });

  const systemPrompt = `You are SriMatrix Health's executive HR legal counsel and corporate documentation specialist.
SriMatrix Health (srimatrixhealth.com) is a premier healthcare staffing and workforce management organization.
Director: Suneel Sah.

CRITICAL RULES:
1. NEVER USE BRACKET PLACEHOLDERS like [Department Name], [Manager's Name], $[Annual Salary], [Proposed Start Date], or [Location].
   Every single detail MUST be realistically and concretely filled in.
2. Return ONLY valid raw JSON with NO markdown code blocks, NO backticks, and NO conversational filler:
{
  "title": "${role} Offer Letter",
  "label": "${role} - ${candidateName}",
  "candidateName": "${candidateName}",
  "positionTitle": "${role}",
  "pages": [
    "<HTML string for Page 1>",
    "<HTML string for Page 2>"
  ]
}

STRICT PAGE ALLOCATION RULES (To prevent visual overflow past A4 page boundaries):
Page 1 MUST fit neatly within A4 printable area (under 320 words):
- Header:
  <div style="text-align: center; padding-bottom: 14px; border-bottom: 1px solid #e2e8f0; margin-bottom: 18px;">
    <img src="/srimatrix-health-logo.png" alt="SriMatrix Health" style="height: 52px; margin: 0 auto 6px auto; display: block; object-fit: contain;" />
    <h1 style="font-size: 20px; font-weight: bold; margin: 0; color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">Srimatrix Health</h1>
    <p style="font-size: 11px; color: #475569; margin: 2px 0 0 0;">Email: info@srimatrixhealth.com | Website: www.srimatrixhealth.com</p>
  </div>
- Date: ${currentDate}
- Subject: Formal Offer of Employment - ${role}
- Salutation: Dear ${candidateName},
- Opening congratulations paragraph.
- Position Details:
  <ul style="margin: 0 0 14px 0; padding-left: 20px; line-height: 1.6; font-size: 13.5px;">
    <li><strong>Position Title:</strong> ${role}</li>
    <li><strong>Department:</strong> Clinical Operations & Staffing Division</li>
    <li><strong>Employment Type:</strong> Full-Time Regular</li>
    <li><strong>Hours:</strong> 40 hours per week</li>
    <li><strong>Work Location:</strong> ${workLocation}</li>
    <li><strong>Supervisor:</strong> ${supervisor}</li>
    <li><strong>Start Date:</strong> ${defaultStartDate}</li>
  </ul>
- <h3 style="font-size: 14.5px; font-weight: bold; margin: 0 0 6px 0; color: #0f172a;">Duties & Responsibilities</h3>
- 5 concise bullet points of clinical/operational responsibilities.
- Brief closing paragraph for Page 1.
- CRITICAL: DO NOT start Compensation or Benefits on Page 1. Page 1 ends cleanly here!

Page 2 MUST contain:
- Mini Header:
  <div style="text-align: center; padding-bottom: 10px; border-bottom: 1px solid #e2e8f0; margin-bottom: 16px;">
    <img src="/srimatrix-health-logo.png" alt="SriMatrix Health" style="height: 42px; margin: 0 auto 4px auto; display: block; object-fit: contain;" />
    <h2 style="font-size: 16px; font-weight: bold; margin: 0; color: #0f172a;">Srimatrix Health LLC</h2>
    <p style="font-size: 11px; color: #475569; margin: 1px 0 0 0;">Healthcare Operations & Professional Staffing</p>
  </div>
- <h3 style="font-size: 14.5px; font-weight: bold; margin: 0 0 6px 0; color: #0f172a;">Compensation & Benefits</h3>
  Details: Annual base salary of $98,500 (paid bi-weekly at $47.36/hr), annual performance bonus eligibility, comprehensive medical/dental/vision coverage, 401(k) retirement plan with matching, PTO accrual, and company holidays.
- <h3 style="font-size: 14.5px; font-weight: bold; margin: 0 0 6px 0; color: #0f172a;">Employment Terms & Conditions</h3>
  At-Will employment, maintaining valid US work authorization and professional clinical licensure, background check contingency, and acceptance deadline by ${formattedDeadline}.
- Director Signature block:
  <div style="margin: 18px 0 20px 0; line-height: 1.5; font-size: 13px;">
    <p style="margin: 0 0 4px 0;">Sincerely,</p>
    <div style="height: 44px;"></div>
    <p style="margin: 0; font-weight: bold; color: #0f172a;">Suneel Sah</p>
    <p style="margin: 0; color: #334155;">Director, SriMatrix Health LLC</p>
    <p style="margin: 0; color: #64748b; font-size: 11.5px;">Email: ssah@srimatrixhealth.com</p>
  </div>
- Candidate Acceptance section with Signature, Printed Name, and Date lines.`;

  const userPrompt = `Generate the official SriMatrix Health document for:
Role: "${role}"
Candidate Name: "${candidateName}"
Instructions: "${activePrompt}"
Current Date: "${currentDate}"`;

  try {
    const result = await callGrokAPI({
      prompt: userPrompt,
      systemPrompt,
      maxTokens: 3500,
      temperature: 0.3,
      jsonMode: true,
    });

    let cleanJson = result.text.replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();
    let parsed: any = {};
    try {
      parsed = JSON.parse(cleanJson);
    } catch {
      const p1Match = cleanJson.match(/"page1Html"\s*:\s*"([\s\S]*?)(?=",\s*"page2Html"|"$)/);
      const p2Match = cleanJson.match(/"page2Html"\s*:\s*"([\s\S]*?)(?="\s*\}|"$)/);
      parsed = {
        title: `${role} Offer Letter`,
        label: `${role} - ${candidateName}`,
        pages: [
          p1Match ? p1Match[1].replace(/\\n/g, "\n").replace(/\\"/g, '"') : "",
          p2Match ? p2Match[1].replace(/\\n/g, "\n").replace(/\\"/g, '"') : "",
        ].filter(Boolean),
      };
    }

    let pages: string[] = [];
    if (Array.isArray(parsed.pages) && parsed.pages.length > 0) {
      pages = parsed.pages.map((p: any) => removeBracketPlaceholders(String(p).trim(), role, candidateName));
    } else if (parsed.page1Html) {
      pages = [
        removeBracketPlaceholders(parsed.page1Html, role, candidateName),
        removeBracketPlaceholders(parsed.page2Html || "", role, candidateName),
      ].filter(Boolean);
    }

    if (pages.length === 0) {
      pages = [
        removeBracketPlaceholders(
          `<div style="text-align: center; padding-bottom: 14px; border-bottom: 1px solid #e2e8f0; margin-bottom: 18px;">
            <img src="/srimatrix-health-logo.png" alt="SriMatrix Health" style="height: 52px; margin: 0 auto 6px auto; display: block; object-fit: contain;" />
            <h1 style="font-size: 20px; font-weight: bold; margin: 0; color: #0f172a;">Srimatrix Health</h1>
          </div>
          <p>Dear ${candidateName},</p>
          <p>We are pleased to offer you the position of <strong>${role}</strong> with Srimatrix Health LLC.</p>`,
          role,
          candidateName
        ),
      ];
    }

    const title = parsed.title || `${role} Offer Letter`;
    const label = parsed.label || `${role} - ${candidateName}`;

    return {
      success: true,
      title,
      label,
      candidateName: parsed.candidateName || candidateName,
      positionTitle: parsed.positionTitle || role,
      pages,
      page1Html: pages[0] || "",
      page2Html: pages[1] || "",
      modelUsed: result.model,
      message: `Generated ${pages.length} page${pages.length > 1 ? "s" : ""} via Groq (${result.model})`,
    };
  } catch (err: any) {
    console.error("Groq application generation error:", err.message);
    const fallbackPages = [
      removeBracketPlaceholders(
        `<div style="text-align: center; padding-bottom: 14px; border-bottom: 1px solid #e2e8f0; margin-bottom: 18px;">
          <img src="/srimatrix-health-logo.png" alt="SriMatrix Health" style="height: 52px; margin: 0 auto 6px auto; display: block; object-fit: contain;" />
          <h1 style="font-size: 20px; font-weight: bold; margin: 0; color: #0f172a;">Srimatrix Health</h1>
          <p style="font-size: 11px; color: #475569; margin: 2px 0 0 0;">Email: info@srimatrixhealth.com | Website: www.srimatrixhealth.com</p>
        </div>
        <p style="margin: 0 0 4px 0; font-size: 14px;"><strong>Date:</strong> ${currentDate}</p>
        <p style="margin: 0 0 16px 0; font-size: 14px;"><strong>Sub:</strong> Formal Offer of Employment - ${role}</p>
        <p style="margin: 0 0 12px 0; font-size: 14px;"><strong>Dear ${candidateName},</strong></p>
        <p style="margin: 0 0 16px 0; font-size: 14px; text-align: justify; line-height: 1.6;">
          We are pleased to offer you the position of <strong>${role}</strong> with Srimatrix Health LLC. We believe your clinical skills and dedication will be a tremendous asset to our healthcare network.
        </p>
        <h3 style="font-size: 15px; font-weight: bold; margin: 0 0 8px 0; color: #0f172a;">Position Details</h3>
        <ul style="margin: 0 0 16px 0; padding-left: 20px; line-height: 1.65; font-size: 13.5px;">
          <li><strong>Position Title:</strong> ${role}</li>
          <li><strong>Department:</strong> Clinical Operations & Staffing Division</li>
          <li><strong>Employment Type:</strong> Full-Time Regular</li>
          <li><strong>Hours:</strong> 40 hours per week</li>
          <li><strong>Work Location:</strong> ${workLocation}</li>
          <li><strong>Supervisor:</strong> ${supervisor}</li>
          <li><strong>Start Date:</strong> ${defaultStartDate}</li>
        </ul>
        <h3 style="font-size: 15px; font-weight: bold; margin: 0 0 6px 0; color: #0f172a;">Duties and Responsibilities</h3>
        <ul style="margin: 0 0 16px 0; padding-left: 20px; line-height: 1.65; font-size: 13.5px;">
          <li>Delivering high-quality, patient-centered clinical care and documentation.</li>
          <li>Collaborating with multidisciplinary healthcare teams and partner facility directors.</li>
          <li>Upholding strict Joint Commission, state board, and SriMatrix clinical compliance guidelines.</li>
          <li>Maintaining precise timesheet records and electronic health record documentation.</li>
          <li>Participating in continuing clinical education and quality improvement initiatives.</li>
        </ul>`,
        role,
        candidateName
      ),
      removeBracketPlaceholders(
        `<div style="text-align: center; padding-bottom: 12px; border-bottom: 1px solid #e2e8f0; margin-bottom: 18px;">
          <img src="/srimatrix-health-logo.png" alt="SriMatrix Health" style="height: 44px; margin: 0 auto 4px auto; display: block; object-fit: contain;" />
          <h2 style="font-size: 17px; font-weight: bold; margin: 0; color: #0f172a;">Srimatrix Health LLC</h2>
          <p style="font-size: 11px; color: #475569; margin: 2px 0 0 0;">Healthcare Operations & Professional Staffing</p>
        </div>
        <h3 style="font-size: 15px; font-weight: bold; margin: 0 0 8px 0; color: #0f172a;">Compensation and Benefits</h3>
        <p style="margin: 0 0 12px 0; font-size: 13.5px; text-align: justify; line-height: 1.6;">
          Your annual base salary will be <strong>$98,500 per annum</strong>, paid bi-weekly at a standard rate of <strong>$47.36/hour</strong>. You will be eligible for SriMatrix Health's comprehensive benefits program including medical, dental, and vision insurance coverage, 401(k) retirement plan with employer matching, generous paid time off (PTO), and company holidays.
        </p>
        <h3 style="font-size: 15px; font-weight: bold; margin: 0 0 8px 0; color: #0f172a;">Employment Terms</h3>
        <p style="margin: 0 0 12px 0; font-size: 13.5px; text-align: justify; line-height: 1.6;">
          Your employment with SriMatrix Health will be at-will. This offer is contingent upon successful completion of background verification and verification of authorization to work in the United States. Please sign and return this agreement by <strong>${formattedDeadline}</strong>.
        </p>
        <div style="margin: 0 0 24px 0; line-height: 1.5; font-size: 13.5px;">
          <p style="margin: 0 0 6px 0;">Sincerely,</p>
          <div style="height: 48px;"></div>
          <p style="margin: 0; font-weight: bold; color: #0f172a;">Suneel Sah</p>
          <p style="margin: 0; color: #334155;">Director, SriMatrix Health LLC</p>
          <p style="margin: 0; color: #64748b; font-size: 12px;">Email: ssah@srimatrixhealth.com</p>
        </div>
        <div style="border-top: 1px solid #cbd5e1; padding-top: 14px; margin-top: 14px;">
          <h3 style="font-size: 15px; font-weight: bold; margin: 0 0 8px 0; color: #0f172a;">Candidate Acceptance</h3>
          <p style="margin: 0 0 14px 0; font-size: 13.5px;">
            I, <strong>${candidateName}</strong>, accept the position of <strong>${role}</strong> under the terms described in this letter.
          </p>
          <div style="margin-top: 14px; display: flex; flex-direction: column; gap: 12px; font-size: 13.5px;">
            <p style="margin: 0;"><strong>Signature:</strong> ____________________________________________________</p>
            <p style="margin: 0;"><strong>Printed Name:</strong> ____________________________________________________</p>
            <p style="margin: 0;"><strong>Date:</strong> ____________________________________________________</p>
          </div>
        </div>`,
        role,
        candidateName
      ),
    ];

    return {
      success: true,
      title: `${role} Offer Letter`,
      label: `${role} - ${candidateName}`,
      candidateName,
      positionTitle: role,
      pages: fallbackPages,
      page1Html: fallbackPages[0],
      page2Html: fallbackPages[1],
      modelUsed: "template",
      message: `Groq error: ${err.message}. Loaded official SriMatrix template.`,
    };
  }
}

/**
 * Zero-token instant fallback generator for emails
 */
function getFallbackEmail(topic?: string, category?: string) {
  if (topic && topic.trim()) {
    const cleanTopic = topic.trim();
    return {
      subject: `${cleanTopic.slice(0, 45)}: SriMatrix Operational Notice`,
      body: `Hi {{first_name}},\n\nReaching out regarding ${cleanTopic}.\n\nPlease review your current status in the SriMatrix Health portal and confirm your availability for any upcoming milestones.\n\nIf you have any questions or require administrative assistance, please contact our support team.`,
    };
  }

  if (category === "clients") {
    return {
      subject: "SriMatrix Health: Urgent Nurse & Clinical Staffing Coverage",
      body: `Dear {{first_name}},\n\nSriMatrix Health is actively coordinating immediate healthcare staffing placements to cover census surges and nurse shortages at partner facilities.\n\nOur roster of pre-vetted, licensed ICU, ER, and Med-Surg RNs is ready for immediate per diem and travel deployment. Please let us know your facility needs.`,
    };
  }

  if (category === "candidates") {
    return {
      subject: "SriMatrix Health: High-Paying Travel RN & Nursing Opportunities",
      body: `Hi {{first_name}},\n\nWe have exciting high-compensation travel nursing assignments and per diem PRN shifts available across our hospital network.\n\nContracts feature top weekly stipends, rapid credentialing, and comprehensive clinical support. Reply to this email or visit your portal to view open positions.`,
    };
  }

  return {
    subject: "SriMatrix Health: Weekly Timesheet & Shift Verification Reminder",
    body: `Hi {{first_name}},\n\nThis is a friendly reminder to submit your weekly timesheets and verify your scheduled shifts in the SriMatrix portal by Friday 5:00 PM.\n\nAccurate and timely submissions ensure prompt payroll processing and operational compliance.`,
  };
}
