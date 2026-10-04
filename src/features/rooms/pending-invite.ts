import { useRouter } from 'expo-router';
import { useEffect } from 'react';

import { normalizeInviteCode } from '@/lib/invite';

// Davet bağlantısı açıldığında giriş yapılmamışsa kod cihazda saklanır; giriş yapılınca
// davet ekranı kaldığı yerden açılır. Bir günden eski davet unutulur.

const KEY = 'pending-invite';
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

export function savePendingInvite(code: string) {
  try {
    globalThis.localStorage?.setItem(KEY, JSON.stringify({ code, savedAt: Date.now() }));
  } catch {
    // Saklanamazsa kullanıcı girişten sonra kodu Odalar > Koda Katıl'a elle girebilir.
  }
}

function takePendingInvite(): string | null {
  try {
    const raw = globalThis.localStorage?.getItem(KEY);
    if (!raw) return null;
    globalThis.localStorage?.removeItem(KEY);
    const { code, savedAt } = JSON.parse(raw) as { code?: unknown; savedAt?: unknown };
    if (typeof savedAt !== 'number' || Date.now() - savedAt > MAX_AGE_MS) return null;
    return normalizeInviteCode(code);
  } catch {
    return null;
  }
}

/** Giriş yapılınca bekleyen davet varsa davet ekranını açar. */
export function usePendingInviteRedirect(enabled: boolean) {
  const router = useRouter();

  useEffect(() => {
    if (!enabled) return;
    const code = takePendingInvite();
    if (code) router.navigate({ pathname: '/davet', params: { kod: code } });
  }, [enabled, router]);
}
