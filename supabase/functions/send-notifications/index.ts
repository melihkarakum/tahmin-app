// Bildirim gönderimi. Yalnızca zamanlayıcı (pg_cron, 10 dakikada bir) ve geliştirici çağırır.
//   (parametresiz)          : maç hatırlatmalarını ve hafta sonuçlarını gönderir
//   ?dryRun=1               : kime ne gideceğini özetler; göndermez, kayıt düşmez
//   ?mode=test&username=ad  : o kullanıcının cihazlarına deneme bildirimi gönderir
// Her çağrı x-sync-secret başlığında SYNC_SECRET değerini taşımalıdır.

import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';

import {
  buildMessages,
  chunk,
  type CollectedNotification,
  deadTokensFromReceipts,
  type ExpoMessage,
  type ExpoReceipt,
  type ExpoTicket,
  readTickets,
} from '../_shared/push.ts';
import { isAuthorizedCall, json, serviceClient } from '../_shared/supabase.ts';

const EXPO_SEND_URL = 'https://exp.host/--/api/v2/push/send';
const EXPO_RECEIPTS_URL = 'https://exp.host/--/api/v2/push/getReceipts';

function expoHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Accept-Encoding': 'gzip, deflate',
    'Content-Type': 'application/json',
  };
  // Expo hesabında "gelişmiş bildirim güvenliği" açılırsa gerekir (şimdilik yok).
  const accessToken = Deno.env.get('EXPO_ACCESS_TOKEN');
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  return headers;
}

async function send(db: SupabaseClient, messages: ExpoMessage[]) {
  let sent = 0;
  let removedTokens = 0;
  const errors: string[] = [];

  for (const batch of chunk(messages, 100)) {
    const response = await fetch(EXPO_SEND_URL, {
      method: 'POST',
      headers: expoHeaders(),
      body: JSON.stringify(batch),
    });
    const body = await response.json().catch(() => null);
    if (!response.ok || !Array.isArray(body?.data)) {
      errors.push(`Expo HTTP ${response.status}: ${JSON.stringify(body?.errors ?? body).slice(0, 300)}`);
      continue;
    }

    const outcome = readTickets(batch, body.data as ExpoTicket[]);
    sent += outcome.stored.length;
    errors.push(...outcome.errors);

    if (outcome.stored.length > 0) {
      const { error } = await db.from('push_tickets').insert(outcome.stored);
      if (error) errors.push(`bilet kaydı: ${error.message}`);
    }
    if (outcome.deadTokens.length > 0) {
      const { error } = await db.from('push_tokens').delete().in('token', outcome.deadTokens);
      if (error) errors.push(`adres silme: ${error.message}`);
      else removedTokens += outcome.deadTokens.length;
    }
  }

  return { sent, removedTokens, errors };
}

/** 15 dakikadan eski biletlerin makbuzlarını okur; artık bildirim alamayan cihazları siler. */
async function checkReceipts(db: SupabaseClient) {
  const cutoff = new Date(Date.now() - 15 * 60_000).toISOString();
  const { data: tickets, error } = await db
    .from('push_tickets')
    .select('id, token')
    .lt('created_at', cutoff)
    .order('created_at')
    .limit(1000);
  if (error) throw error;
  if (tickets.length === 0) return { checked: 0, removedTokens: 0 };

  const response = await fetch(EXPO_RECEIPTS_URL, {
    method: 'POST',
    headers: expoHeaders(),
    body: JSON.stringify({ ids: tickets.map((ticket: { id: string }) => ticket.id) }),
  });
  const body = await response.json().catch(() => null);
  if (!response.ok || typeof body?.data !== 'object' || body.data === null) {
    return { checked: 0, removedTokens: 0, error: `Expo HTTP ${response.status}` };
  }

  const dead = deadTokensFromReceipts(body.data as Record<string, ExpoReceipt>, tickets);
  if (dead.length > 0) {
    const { error: deleteError } = await db.from('push_tokens').delete().in('token', dead);
    if (deleteError) throw deleteError;
  }
  // Okunan biletler ve bir günden eski (makbuzu artık tutulmayan) biletler silinir.
  await db.from('push_tickets').delete().in('id', tickets.map((ticket: { id: string }) => ticket.id));
  await db
    .from('push_tickets')
    .delete()
    .lt('created_at', new Date(Date.now() - 24 * 60 * 60_000).toISOString());

  return { checked: tickets.length, removedTokens: dead.length };
}

async function collect(db: SupabaseClient, fn: string, now: string, dryRun: boolean) {
  const { data, error } = await db.rpc(fn, { p_now: now, p_dry_run: dryRun });
  if (error) throw error;
  return data as CollectedNotification[];
}

async function sendAll(db: SupabaseClient, dryRun: boolean) {
  const now = new Date().toISOString();
  const receipts = dryRun ? null : await checkReceipts(db);
  const reminders = await collect(db, 'collect_match_reminders', now, dryRun);
  const results = await collect(db, 'collect_round_results', now, dryRun);
  const messages = buildMessages([...reminders, ...results]);

  if (dryRun) {
    return {
      dryRun: true,
      reminders: reminders.length,
      results: results.length,
      devices: messages.length,
      preview: [...reminders, ...results].slice(0, 5).map(({ title, body, url }) => ({ title, body, url })),
    };
  }

  const outcome = await send(db, messages);
  return { reminders: reminders.length, results: results.length, ...outcome, receipts };
}

async function sendTest(db: SupabaseClient, username: string | null) {
  if (!username) return { error: 'username gerekli' };
  const { data: profile, error } = await db
    .from('profiles')
    .select('id')
    .eq('username', username.toLowerCase())
    .maybeSingle();
  if (error) throw error;
  if (!profile) return { error: 'kullanıcı bulunamadı' };

  const { data: tokens, error: tokenError } = await db
    .from('push_tokens')
    .select('token')
    .eq('user_id', profile.id);
  if (tokenError) throw tokenError;

  const messages = buildMessages([
    {
      user_id: profile.id,
      tokens: tokens.map((row: { token: string }) => row.token),
      title: 'Bildirimler çalışıyor',
      body: 'Maç hatırlatmaları ve hafta sonuçları bu şekilde gelecek.',
      url: '/',
    },
  ]);
  return { mode: 'test', devices: messages.length, ...(await send(db, messages)) };
}

Deno.serve(async (request) => {
  if (!isAuthorizedCall(request)) return json({ error: 'forbidden' }, 403);

  const params = new URL(request.url).searchParams;
  const mode = params.get('mode') ?? 'send';
  try {
    const db = serviceClient();
    if (mode === 'send') return json(await sendAll(db, params.get('dryRun') === '1'));
    if (mode === 'test') return json(await sendTest(db, params.get('username')));
    return json({ error: `bilinmeyen mod: ${mode}` }, 400);
  } catch (error) {
    console.error(error);
    return json({ error: error instanceof Error ? error.message : String(error) }, 500);
  }
});
