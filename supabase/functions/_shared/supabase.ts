// Edge Function'ların veritabanına sunucu yetkisiyle (RLS'i atlayarak) erişmesi için istemci.
// Anahtar yalnızca sunucuda durur; uygulamaya hiçbir zaman gönderilmez.

import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';

export function serviceClient(): SupabaseClient {
  const url = Deno.env.get('SUPABASE_URL');
  let key: string | undefined;
  const secretKeys = Deno.env.get('SUPABASE_SECRET_KEYS');
  if (secretKeys) {
    const parsed = JSON.parse(secretKeys) as Record<string, string>;
    key = parsed.default ?? Object.values(parsed)[0];
  }
  key ??= Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) throw new Error('Supabase ortam değişkenleri eksik.');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** Zamanlayıcının ve geliştiricinin çağrısı mı? (x-sync-secret başlığı SYNC_SECRET ile aynı olmalı) */
export function isAuthorizedCall(request: Request): boolean {
  const expected = Deno.env.get('SYNC_SECRET');
  return Boolean(expected) && request.headers.get('x-sync-secret') === expected;
}
