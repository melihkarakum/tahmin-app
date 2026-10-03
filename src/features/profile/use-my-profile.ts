import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/features/auth/auth-provider';
import { supabase } from '@/lib/supabase';

/** Giriş yapan kullanıcının profili. Sütunlar tek tek seçilir (bkz. docs/ARCHITECTURE.md). */
export function useMyProfile() {
  const { session } = useAuth();
  const userId = session?.user.id;

  return useQuery({
    queryKey: ['profile', userId],
    enabled: userId !== undefined,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, display_name')
        .eq('id', userId as string)
        .single();
      if (error) throw error;
      return data;
    },
  });
}
