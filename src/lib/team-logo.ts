import { supabase } from '@/lib/supabase';

/**
 * team-logos deposundaki logonun herkese açık adresi (ağ isteği yapmaz, yalnızca adres üretir).
 * Logolar sunucudaki senkron fonksiyonu tarafından futbol API'sinden bir kez kopyalanır.
 */
export function teamLogoUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  return supabase.storage.from('team-logos').getPublicUrl(path).data.publicUrl;
}
