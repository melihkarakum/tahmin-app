// Oda daveti: bağlantı ve WhatsApp mesajı. Başka dosyaya bağımlı değildir (testlerde de çalışır).

/**
 * Davet sayfasının yayınlandığı adres (EAS Hosting). Değişirse daha önce gönderilmiş
 * davet bağlantıları çalışmaz.
 */
export const WEBSITE_URL = 'https://tahminet.expo.app';

const CODE_PATTERN = /^[A-Z0-9]{6}$/;

/** Bağlantıdan gelen oda kodunu temizler; geçersizse null döner. */
export function normalizeInviteCode(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const code = raw.trim().toUpperCase();
  return CODE_PATTERN.test(code) ? code : null;
}

export function inviteUrl(code: string, baseUrl: string = WEBSITE_URL): string {
  return `${baseUrl}/davet?kod=${encodeURIComponent(code)}`;
}

/** Davet mesajı: bağlantı (tıklanabilir) ve elle girmek isteyenler için kod. */
export function inviteMessage(roomName: string, code: string, baseUrl: string = WEBSITE_URL): string {
  return `${roomName} tahmin odasına katıl!\n${inviteUrl(code, baseUrl)}\nOda kodu: ${code}`;
}

/** WhatsApp'ın resmi "tıkla ve sohbet et" biçimi: kişi seçilince mesaj hazır gelir. */
export function whatsappShareUrl(message: string): string {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}
