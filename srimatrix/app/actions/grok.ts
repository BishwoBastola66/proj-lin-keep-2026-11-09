"use server";

import {
  generateGrokEmailDraft,
  generateGrokApplicationDraft,
  isGrokConfigured,
  GrokEmailResult,
  GrokApplicationResult,
  GrokApplicationOptions,
} from "@/lib/grok";
import { getCurrentUserAction } from "./auth";

/**
 * Server Action to generate an AI email draft (Groq: qwen/qwen3.8-27b)
 */
export async function generateEmailWithGrokAction(options: {
  topic?: string;
  category?: "all" | "accounts" | "srimatrix" | "clients" | "candidates";
  tone?: "professional" | "urgent" | "friendly";
}): Promise<GrokEmailResult> {
  const currentUser = await getCurrentUserAction();
  if (!currentUser) {
    return {
      success: false,
      subject: "",
      body: "",
      modelUsed: "none",
      message: "Unauthorized: Please log in first.",
    };
  }

  try {
    const result = await generateGrokEmailDraft(options);
    return result;
  } catch (err: any) {
    console.error("generateEmailWithGrokAction error:", err);
    return {
      success: false,
      subject: "",
      body: "",
      modelUsed: "none",
      message: err?.message || "Failed to generate email draft.",
    };
  }
}

export const generateEmailWithAIAction = generateEmailWithGrokAction;

/**
 * Server Action to generate a full SriMatrix Application / Custom Document using Groq AI
 */
export async function generateApplicationWithAIAction(
  options: GrokApplicationOptions
): Promise<GrokApplicationResult> {
  const currentUser = await getCurrentUserAction();
  if (!currentUser || currentUser.role !== "admin") {
    return {
      success: false,
      title: "Unauthorized",
      candidateName: "",
      positionTitle: "",
      pages: [],
      page1Html: "",
      page2Html: "",
      modelUsed: "none",
      message: "Unauthorized: Admin privileges required.",
    };
  }

  try {
    const result = await generateGrokApplicationDraft(options);
    return result;
  } catch (err: any) {
    console.error("generateApplicationWithAIAction error:", err);
    return {
      success: false,
      title: "Error Generating Application",
      candidateName: options.candidateName || "Candidate",
      positionTitle: options.role || "Specialist",
      pages: [],
      page1Html: "",
      page2Html: "",
      modelUsed: "error",
      message: err?.message || "Failed to generate application letter.",
    };
  }
}

/**
 * Server Action to check if AI API (Groq) is ready
 */
export async function checkGrokStatusAction(): Promise<{ configured: boolean; model: string }> {
  return {
    configured: isGrokConfigured(),
    model: process.env.GROQ_MODEL || "qwen/qwen3.8-27b",
  };
}
