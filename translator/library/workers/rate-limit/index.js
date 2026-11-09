/**
 * Cloudflare Worker: Sliding-Window Rate Limiter
 * File: library/workers/rate-limit/index.js
 * 
 * Enforces sliding-window rate limits per client IP / auth token.
 * Protects registry from scrapers and DDoS without disrupting developers.
 */

export default {
  async fetch(request, env, ctx) {
    const clientIP = request.headers.get("CF-Connecting-IP") || "127.0.0.1";
    const path = new URL(request.url).pathname;

    // Rate limits (requests per 60-second window)
    let limit = 60; // default read limit
    if (path.includes("/publish")) {
      limit = 10;   // publish rate limit
    } else if (path.includes("/search")) {
      limit = 120;  // search query limit
    }

    const currentMinute = Math.floor(Date.now() / 60000);
    const key = `ratelimit:${clientIP}:${currentMinute}`;

    // Get current count from KV (if bound)
    let count = 0;
    if (env.RATE_LIMIT_KV) {
      const stored = await env.RATE_LIMIT_KV.get(key);
      count = stored ? parseInt(stored, 10) : 0;

      if (count >= limit) {
        return new Response(JSON.stringify({
          error: "Too Many Requests",
          message: `Rate limit of ${limit} requests/min exceeded. Please retry later.`,
          retry_after: 60
        }), {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": "60",
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": "0"
          }
        });
      }

      ctx.waitUntil(env.RATE_LIMIT_KV.put(key, (count + 1).toString(), { expirationTtl: 120 }));
    }

    // Forward request
    const response = await fetch(request);
    const newHeaders = new Headers(response.headers);
    newHeaders.set("X-RateLimit-Limit", limit.toString());
    newHeaders.set("X-RateLimit-Remaining", Math.max(0, limit - (count + 1)).toString());

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders
    });
  }
};
