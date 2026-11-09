/**
 * Cloudflare Worker: Hot Read KV Cache Layer
 * File: library/workers/cache/index.js
 * 
 * Provides sub-millisecond edge caching for package metadata and search queries.
 * Cache invalidation occurs on publish, update, and yank operations.
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // Only cache GET queries for packages and search
    const isCacheable = method === "GET" && (path.startsWith("/v1/pkg/") || path.startsWith("/v1/search"));
    const cacheKey = `cache:${url.pathname}${url.search}`;

    if (isCacheable && env.REGISTRY_KV) {
      const cached = await env.REGISTRY_KV.get(cacheKey, { type: "json" });
      if (cached) {
        return new Response(JSON.stringify(cached), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "X-Cache": "HIT-EDGE-KV",
            "Cache-Control": "public, max-age=60, s-maxage=300"
          }
        });
      }
    }

    // Forward to origin API (or D1 backing)
    const response = await fetch(request);

    if (isCacheable && response.status === 200 && env.REGISTRY_KV) {
      const clone = response.clone();
      try {
        const data = await clone.json();
        // TTL 5 minutes for package metadata, 1 minute for search
        const ttl = path.startsWith("/v1/search") ? 60 : 300;
        ctx.waitUntil(env.REGISTRY_KV.put(cacheKey, JSON.stringify(data), { expirationTtl: ttl }));
      } catch (err) {
        // Non-json response, skip KV caching
      }
    }

    return response;
  }
};
