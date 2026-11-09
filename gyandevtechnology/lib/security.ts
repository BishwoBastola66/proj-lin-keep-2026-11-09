/**
 * Security and sanitization utilities for Gyanav Solutions
 * Protects against XSS, injection, protocol smuggling, and payload abuse.
 */

const SAFE_PROTOCOLS = new Set(['http:', 'https:']);

/**
 * Validates and sanitizes a user-supplied URL.
 * Strictly permits only http: and https: protocols.
 * Rejects javascript:, data:, vbscript:, and malformed strings.
 */
export function sanitizeUrl(rawUrl?: string | null): string | null {
  if (!rawUrl || typeof rawUrl !== 'string') return null;

  const trimmed = rawUrl.trim();
  if (!trimmed || trimmed === '#' || trimmed.length > 1000) return null;

  // Block obvious dangerous protocols before URL parsing
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('file:')
  ) {
    return null;
  }

  try {
    // If user provided domain without protocol, prefix https://
    const urlToParse = lower.startsWith('http://') || lower.startsWith('https://')
      ? trimmed
      : `https://${trimmed}`;

    const parsed = new URL(urlToParse);
    if (SAFE_PROTOCOLS.has(parsed.protocol)) {
      return parsed.href;
    }
  } catch {
    return null;
  }

  return null;
}

/**
 * Strips dangerous null bytes and enforces max character length.
 */
export function sanitizeText(input?: string | null, maxLength = 5000): string {
  if (!input || typeof input !== 'string') return '';
  return input
    .replace(/\0/g, '') // remove null bytes
    .trim()
    .slice(0, maxLength);
}

/**
 * Email validation adhering to standard format and RFC length bounds.
 */
export function isValidEmail(email?: string | null): boolean {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim();
  if (trimmed.length > 254 || trimmed.length < 3) return false;
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return emailRegex.test(trimmed);
}

/**
 * Basic phone validation allowing international format.
 */
export function isValidPhone(phone?: string | null): boolean {
  if (!phone || typeof phone !== 'string') return true; // optional
  const trimmed = phone.trim();
  if (trimmed === '') return true;
  if (trimmed.length > 50) return false;
  const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/;
  return phoneRegex.test(trimmed);
}
