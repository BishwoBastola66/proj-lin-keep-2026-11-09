// DEPRECATED: This file is no longer used.
// All email sync logic has been moved to /app/api/email/sync/route.ts
// This file is kept only as a reference. Do NOT import it.

export async function startImapListener() {
  console.log('[DEPRECATED] imapListener is disabled. Use /api/email/sync instead.');
}

export async function syncInbox() {
  console.log('[DEPRECATED] syncInbox is disabled. Use /api/email/sync instead.');
  return { count: 0 };
}
