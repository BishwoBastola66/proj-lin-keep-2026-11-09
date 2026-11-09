import { createClient, SupabaseClient } from '@supabase/supabase-js';

export function getSupabaseCredentials(): { url: string; anonKey: string } {
  // 1. In browser environments: ALWAYS use the secure internal proxy endpoint!
  // This completely masks and proxifies the database URL from DevTools, network inspection, and public view.
  if (typeof window !== 'undefined') {
    return {
      url: `${window.location.origin}/api/db`,
      anonKey: 'proxy-token',
    };
  }

  // 2. On server: connect directly to backend database
  const envUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const envKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    '';

  if (
    typeof envUrl === 'string' &&
    envUrl.trim().length > 0 &&
    !envUrl.includes('your-project-id') &&
    typeof envKey === 'string' &&
    envKey.trim().length > 0 &&
    !envKey.includes('your-anon-key')
  ) {
    return { url: envUrl.trim(), anonKey: envKey.trim() };
  }

  return { url: '', anonKey: '' };
}

export const isSupabaseConfigured = (): boolean => {
  if (typeof window !== 'undefined') {
    return true;
  }
  const { url, anonKey } = getSupabaseCredentials();
  return (
    url.length > 0 &&
    anonKey.length > 0 &&
    url.startsWith('http') &&
    !url.includes('your-project-id') &&
    !anonKey.includes('your-anon-key')
  );
};

declare global {
  var __gyanavSupabaseClient: SupabaseClient | undefined;
  var __gyanavSupabaseUrl: string | undefined;
  var __gyanavSupabaseKey: string | undefined;
}

export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey } = getSupabaseCredentials();
  if (!isSupabaseConfigured()) {
    globalThis.__gyanavSupabaseClient = undefined;
    return null;
  }

  if (
    !globalThis.__gyanavSupabaseClient ||
    url !== globalThis.__gyanavSupabaseUrl ||
    anonKey !== globalThis.__gyanavSupabaseKey
  ) {
    globalThis.__gyanavSupabaseUrl = url;
    globalThis.__gyanavSupabaseKey = anonKey;
    globalThis.__gyanavSupabaseClient = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return globalThis.__gyanavSupabaseClient;
}

export function saveSupabaseConfig(): void {
  globalThis.__gyanavSupabaseClient = undefined;
}

export function clearSupabaseConfig(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('gyanav_supabase_url');
  localStorage.removeItem('gyanav_supabase_anon_key');
  globalThis.__gyanavSupabaseClient = undefined;
}
