/**
 * NVIDIA AI API Integration (Nemotron 3.5 Lightning 30B)
 * Endpoint: https://integrate.api.nvidia.com/v1/chat/completions (OpenAI Compatible)
 * Model: nvidia/nemotron-3.5-lightning-30b-a3b
 */

export interface NvidiaMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface NvidiaCompletionOptions {
  messages: NvidiaMessage[];
  temperature?: number;
  top_p?: number;
  maxTokens?: number;
  model?: string;
  enableThinking?: boolean;
  reasoningBudget?: number;
}

export interface NvidiaEmailGenerationOptions {
  topic?: string;
  category?: "all" | "accounts" | "srimatrix" | "clients" | "candidates";
  tone?: "professional" | "urgent" | "friendly";
}

export interface NvidiaEmailResult {
  success: boolean;
  subject: string;
  body: string;
  modelUsed: string;
  reasoning?: string;
  tokensUsed?: number;
  isFallback?: boolean;
  message?: string;
}

import { parseEmailResponse } from "@/lib/gemini";

const NVIDIA_BASE_URL = process.env.NVIDIA_BASE_URL || "https://integrate.api.nvidia.com/v1";
const DEFAULT_MODEL = process.env.NVIDIA_MODEL || "nvidia/nemotron-3.5-lightning-30b-a3b";

/**
 * Checks whether NVIDIA API key is configured
 */
export function isNvidiaConfigured(): boolean {
  return Boolean(process.env.NVIDIA_API_KEY);
}

/**
 * Call NVIDIA Nemotron API with reasoning and thinking support
 */
export async function callNvidiaAPI({
  messages,
  temperature = 1,
  top_p = 0.95,
  maxTokens = 16384,
  model = DEFAULT_MODEL,
  enableThinking = true,
  reasoningBudget = 16384,
}: NvidiaCompletionOptions): Promise<{
  content: string;
  reasoning?: string;
  tokensUsed?: number;
  model: string;
}> {
  const apiKey = (process.env.NVIDIA_API_KEY || "").trim();

  if (!apiKey) {
    throw new Error("NVIDIA_API_KEY is not configured in .env");
  }

  const payload: Record<string, any> = {
    model,
    messages,
    temperature,
    top_p,
    max_tokens: maxTokens,
    stream: false,
  };

  if (enableThinking) {
    payload.chat_template_kwargs = { enable_thinking: true };
    payload.reasoning_budget = reasoningBudget;
  }

  const response = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`NVIDIA API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const choice = data.choices?.[0];
  const message = choice?.message;
  const content = message?.content || "";
  const reasoning = message?.reasoning_content || undefined;
  const tokensUsed = data.usage?.total_tokens;

  return {
    content: content.trim(),
    reasoning,
    tokensUsed,
    model: data.model || model,
  };
}

/**
 * Generates an executive campaign email draft using NVIDIA Nemotron 3.5 Lightning
 */
export async function generateNvidiaEmailDraft({
  topic,
  category = "all",
  tone = "professional",
}: NvidiaEmailGenerationOptions): Promise<NvidiaEmailResult> {
  if (!isNvidiaConfigured()) {
    const fallback = getFallbackEmail(topic, category);
    return {
      success: true,
      subject: fallback.subject,
      body: fallback.body,
      modelUsed: "offline-template-mode",
      isFallback: true,
      message: "Generated via template mode. Add NVIDIA_API_KEY in .env for live AI generation.",
    };
  }

  const audience =
    category === "clients"
      ? "corporate healthcare client partners"
      : category === "candidates"
      ? "recruitment candidates and healthcare applicants"
      : category === "srimatrix"
      ? "internal healthcare employees and staff"
      : "healthcare professional stakeholders";

  const userPrompt = topic
    ? `Topic: "${topic.slice(0, 200)}". Target Audience: ${audience}. Preferred Tone: ${tone}.`
    : `Target Audience: ${audience}. Purpose: Weekly operational update, timesheet submission, and shift compliance. Preferred Tone: ${tone}.`;

  const systemPrompt = `You are an executive email copywriter for SriMatrix Health, a premier healthcare staffing and administration provider.
Generate a concise, high-impact email based on the prompt.
Output strictly valid JSON with no markdown formatting or code fences:
{"subject": "...", "body": "..."}
Rules:
1. Include {{first_name}} in the opening greeting (e.g., "Hi {{first_name}}," or "Dear {{first_name}},").
2. Body should be professional, clear, and well-structured with paragraph line breaks.
3. Keep the body between 60 to 140 words.
4. CRITICAL: Do NOT include any sign-off, closing, or signature (do NOT write "Best regards", "Warm regards", "Sincerely", "SriMatrix Health Management", or sender names). The email system automatically attaches the official signature from the backend. End immediately after the final paragraph/call-to-action.`;

  try {
    const result = await callNvidiaAPI({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 1,
      top_p: 0.95,
      maxTokens: 16384,
      reasoningBudget: 16384,
    });

    const parsed = parseEmailResponse(result.content, topic);

    const cleanedBody = stripTrailingSignature(
      parsed.body ||
        `Hi {{first_name}},\n\nFollowing up on operational requirements. Please review your portal schedule.`
    );

    return {
      success: true,
      subject: parsed.subject || "SriMatrix Health Operations Update",
      body: cleanedBody,
      modelUsed: result.model,
      reasoning: result.reasoning,
      tokensUsed: result.tokensUsed,
      isFallback: false,
    };
  } catch (err: any) {
    console.error("NVIDIA Nemotron generation error:", err.message);
    const fallback = getFallbackEmail(topic, category);
    return {
      success: true,
      subject: fallback.subject,
      body: stripTrailingSignature(fallback.body),
      modelUsed: "fallback-template",
      isFallback: true,
      message: `NVIDIA API error: ${err.message}. Used fallback draft.`,
    };
  }
}

/**
 * Strips sign-offs and signatures so they don't duplicate backend signatures
 */
export function stripTrailingSignature(text: string): string {
  if (!text) return "";
  return text
    .replace(
      /\n\s*(?:(?:Warm|Best|Kind)?\s*regards|(?:Yours\s+)?sincerely|Thank\s+you|Thanks(?:\s+and\s+regards)?|Warmly|Respectfully|Cheers|Looking forward to speaking with you|Best),?\s*\n+[\s\S]*$/i,
      ""
    )
    .replace(/\n\s*--\s*\n+[\s\S]*$/, "")
    .replace(
      /\n\s*SriMatrix\s+(?:Health|Healthcare|Operations|Management|Administration|Talent Acquisition|Client Relations)[\s\S]*$/i,
      ""
    )
    .trim();
}

/**
 * Fallback generator for zero-cost or offline scenarios
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
      subject: "SriMatrix Health: Quarterly Service Alignment & Staffing Review",
      body: `Dear {{first_name}},\n\nWe are reviewing our active client partnerships for the upcoming quarterly cycle.\n\nPlease let us know if your facility requires any staffing adjustments, nurse allocations, or credentialing renewals.`,
    };
  }

  if (category === "candidates") {
    return {
      subject: "SriMatrix Health: Application Review & Next Steps",
      body: `Hello {{first_name}},\n\nThank you for your interest in joining SriMatrix Health.\n\nOur recruitment team has completed an initial review of your profile. Please log in to confirm your upcoming interview availability and credential checklist.`,
    };
  }

  return {
    subject: "SriMatrix Health: Weekly Timesheet & Shift Verification Reminder",
    body: `Hi {{first_name}},\n\nThis is a friendly reminder to submit your weekly timesheets and verify your scheduled shifts in the SriMatrix portal by Friday 5:00 PM.\n\nAccurate and timely submissions ensure prompt payroll processing and operational compliance.`,
  };
}
