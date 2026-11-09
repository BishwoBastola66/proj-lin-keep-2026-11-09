/**
 * Supabase Domain Proxy Client
 * 
 * Routes all Supabase requests through your webdomain (/api/supabase)
 * ensuring the direct Supabase URL (hipsfbtxlfykhproyqzx.supabase.co)
 * is never exposed directly in the browser network tab.
 */

export const PROXY_BASE_URL = typeof window !== "undefined"
  ? `${window.location.origin}/api/supabase`
  : "/api/supabase";

/**
 * Fetch helper for invoking Supabase REST/Auth through domain proxy
 */
export async function proxiedSupabaseFetch(
  endpoint: string,
  options: RequestInit = {}
) {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint.slice(1) : endpoint;
  const url = `${PROXY_BASE_URL}/${cleanEndpoint}`;

  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");

  return fetch(url, {
    ...options,
    headers,
  });
}
