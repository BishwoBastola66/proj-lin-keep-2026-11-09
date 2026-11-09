/**
 * Production In-Memory Sliding Window Rate Limiter
 * Provides robust IP-based rate limiting for Next.js API routes without requiring external services.
 * Fails safely if an unexpected error occurs.
 */

interface RateLimitRecord {
  timestamps: number[];
}

// In-memory store mapping identifier (e.g. IP + endpoint) to timestamp array
const rateLimitStore = new Map<string, RateLimitRecord>();

// Cleanup stale entries every 5 minutes to prevent memory leak
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupStaleEntries(windowMs: number): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) {
    return;
  }
  lastCleanup = now;

  for (const [key, record] of rateLimitStore.entries()) {
    const validTimestamps = record.timestamps.filter((ts) => now - ts < windowMs);
    if (validTimestamps.length === 0) {
      rateLimitStore.delete(key);
    } else {
      record.timestamps = validTimestamps;
    }
  }
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // seconds until reset
}

/**
 * Check if the given identifier has exceeded the allowed rate limit.
 *
 * @param identifier Client IP or composite key (e.g., "apply:192.168.1.1")
 * @param limit Maximum number of requests allowed within windowMs (default: 5)
 * @param windowMs Time window in milliseconds (default: 10 minutes = 600,000ms)
 */
export function checkRateLimit(
  identifier: string,
  limit = 5,
  windowMs = 10 * 60 * 1000
): RateLimitResult {
  try {
    const now = Date.now();
    const windowStart = now - windowMs;

    cleanupStaleEntries(windowMs);

    let record = rateLimitStore.get(identifier);
    if (!record) {
      record = { timestamps: [] };
      rateLimitStore.set(identifier, record);
    }

    // Filter out timestamps outside the sliding window
    record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

    if (record.timestamps.length >= limit) {
      const oldest = record.timestamps[0];
      const resetSeconds = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
      return {
        success: false,
        limit,
        remaining: 0,
        reset: resetSeconds,
      };
    }

    // Record this request
    record.timestamps.push(now);

    return {
      success: true,
      limit,
      remaining: Math.max(0, limit - record.timestamps.length),
      reset: Math.ceil(windowMs / 1000),
    };
  } catch (err) {
    console.error('Rate limit error, failing safely open:', err);
    // Fail safe open: do not block legitimate users if rate limit calculation fails
    return {
      success: true,
      limit,
      remaining: 1,
      reset: 60,
    };
  }
}

/**
 * Extract client IP from Next.js Request headers.
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const firstIp = forwarded.split(',')[0].trim();
    if (firstIp) return firstIp;
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  const cfIp = req.headers.get('cf-connecting-ip');
  if (cfIp) return cfIp.trim();
  return '127.0.0.1';
}
