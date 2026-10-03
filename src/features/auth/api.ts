import { isAuthError } from '@supabase/supabase-js';

import { unregisterPush } from '@/features/notifications/push';
import { supabase } from '@/lib/supabase';

export const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;
export const MIN_PASSWORD_LENGTH = 8;

export async function signIn(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw error;
}

type SignUpInput = {
  email: string;
  password: string;
  username: string;
  displayName: string;
};

/** Hesap açar. Profil, sunucuda kayıt anında otomatik oluşturulur. */
export async function signUp(input: SignUpInput): Promise<{ needsEmailConfirmation: boolean }> {
  const { data, error } = await supabase.auth.signUp({
    email: input.email.trim(),
    password: input.password,
    options: {
      data: {
        username: input.username,
        display_name: input.displayName.trim(),
        accepted_terms: true,
      },
    },
  });
  if (error) throw error;
  return { needsEmailConfirmation: data.session === null };
}

export async function signOut(): Promise<void> {
  // Bu cihaz artık bu hesabın bildirimlerini almasın (oturum kapanmadan önce silinmeli).
  await unregisterPush();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function isUsernameAvailable(username: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_username_available', { candidate: username });
  if (error) throw error;
  return data;
}

/** Supabase hatalarını kullanıcıya gösterilecek Türkçe mesaja çevirir. */
export function toAuthMessage(error: unknown): string {
  if (isAuthError(error)) {
    switch (error.code) {
      case 'invalid_credentials':
        return 'E-posta ya da şifre hatalı.';
      case 'user_already_exists':
      case 'email_exists':
        return 'Bu e-posta ile zaten bir hesap var.';
      case 'weak_password':
        return `Şifre çok zayıf. En az ${MIN_PASSWORD_LENGTH} karakter kullan.`;
      case 'email_address_invalid':
        return 'E-posta adresi geçersiz.';
      case 'email_not_confirmed':
        return 'Önce e-postanı doğrulaman gerekiyor.';
      case 'over_request_rate_limit':
      case 'over_email_send_rate_limit':
        return 'Çok fazla deneme yapıldı. Biraz bekleyip tekrar dene.';
      case 'unexpected_failure':
        return 'Kayıt tamamlanamadı. Kullanıcı adı az önce alınmış olabilir; başka bir ad dene.';
    }
    if (error.name === 'AuthRetryableFetchError') {
      return 'Sunucuya bağlanılamadı. İnternet bağlantını kontrol et.';
    }
  }
  return 'Bir şeyler ters gitti. Tekrar dene.';
}
