// Expo bildirim servisi için saf yardımcılar. Platforma özgü kod içermez:
// hem Edge Function'da (Deno) hem yerel testlerde (Node) çalışır.

/** Veritabanındaki collect_* fonksiyonlarının döndürdüğü satır. */
export type CollectedNotification = {
  user_id: string;
  tokens: string[] | null;
  title: string;
  body: string;
  url: string;
};

export type ExpoMessage = {
  to: string;
  title: string;
  body: string;
  data: { url: string };
  sound: 'default';
  channelId: 'default';
};

export type ExpoTicket =
  | { status: 'ok'; id: string }
  | { status: 'error'; message?: string; details?: { error?: string } };

export type ExpoReceipt = { status: 'ok' } | { status: 'error'; message?: string; details?: { error?: string } };

/** Her cihaz adresine ayrı bir ileti (bir kişinin birden fazla cihazı olabilir). */
export function buildMessages(rows: CollectedNotification[]): ExpoMessage[] {
  const messages: ExpoMessage[] = [];
  for (const row of rows) {
    for (const token of row.tokens ?? []) {
      messages.push({
        to: token,
        title: row.title,
        body: row.body,
        data: { url: row.url },
        sound: 'default',
        channelId: 'default',
      });
    }
  }
  return messages;
}

export function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) chunks.push(items.slice(index, index + size));
  return chunks;
}

/**
 * Gönderim yanıtını okur. Biletler iletilerle aynı sıradadır.
 * - Başarılı biletler 15 dakika sonra makbuz kontrolü için saklanır.
 * - DeviceNotRegistered: uygulama silinmiş ya da bildirim izni kaldırılmış; adres silinir.
 */
export function readTickets(messages: ExpoMessage[], tickets: ExpoTicket[]) {
  const stored: { id: string; token: string }[] = [];
  const deadTokens: string[] = [];
  const errors: string[] = [];

  tickets.forEach((ticket, index) => {
    const token = messages[index]?.to;
    if (!token) return;
    if (ticket.status === 'ok') {
      stored.push({ id: ticket.id, token });
    } else if (ticket.details?.error === 'DeviceNotRegistered') {
      deadTokens.push(token);
    } else {
      errors.push(ticket.details?.error ?? ticket.message ?? 'bilinmeyen hata');
    }
  });

  return { stored, deadTokens, errors };
}

/** Makbuzlarda DeviceNotRegistered dönen biletlerin cihaz adresleri. */
export function deadTokensFromReceipts(
  receipts: Record<string, ExpoReceipt>,
  tickets: { id: string; token: string }[],
): string[] {
  const dead = new Set<string>();
  for (const ticket of tickets) {
    const receipt = receipts[ticket.id];
    if (receipt?.status === 'error' && receipt.details?.error === 'DeviceNotRegistered') dead.add(ticket.token);
  }
  return [...dead];
}
