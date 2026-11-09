/**
 * AI Adapter: Delegates to Groq (qwen/qwen3.8-27b) for ultra-fast, low-token generation
 * Preserves backwards-compatible types and methods
 */

import {
  generateGrokEmailDraft,
  generateGrokApplicationDraft,
  isGrokConfigured,
  parseEmailResponse,
  stripTrailingSignature,
  GrokApplicationOptions,
  GrokApplicationResult,
  GrokEmailResult,
} from "./grok";

export type GeminiCompletionOptions = any;
export type GeminiEmailResult = GrokEmailResult;
export type GeminiApplicationOptions = GrokApplicationOptions;
export type GeminiApplicationResult = GrokApplicationResult;

export function getGeminiApiKey(): string {
  return "";
}

export function isGeminiConfigured(): boolean {
  return isGrokConfigured();
}

export async function callGeminiAPI(options: any): Promise<{ text: string; model: string }> {
  throw new Error("Gemini has been replaced with Groq AI.");
}

export { parseEmailResponse, stripTrailingSignature };

/**
 * Generates an executive campaign email draft using Groq
 */
export async function generateGeminiEmailDraft(options: {
  topic?: string;
  category?: "all" | "accounts" | "srimatrix" | "clients" | "candidates";
  tone?: "professional" | "urgent" | "friendly";
}): Promise<GeminiEmailResult> {
  return generateGrokEmailDraft(options);
}

/**
 * Generates an official Application, Custom Letter, or Agreement using Groq
 */
export async function generateGeminiApplicationDraft(
  options: GeminiApplicationOptions
): Promise<GeminiApplicationResult> {
  return generateGrokApplicationDraft(options);
}
