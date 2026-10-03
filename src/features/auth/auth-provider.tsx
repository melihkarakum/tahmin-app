import type { Session } from '@supabase/supabase-js';
import { createContext, type ReactNode, use, useEffect, useRef, useState } from 'react';

import { queryClient } from '@/lib/query-client';
import { supabase } from '@/lib/supabase';

type AuthState = {
  session: Session | null;
  /** Kayıtlı oturum henüz okunmadıysa true; bu sırada açılış ekranı gösterilir. */
  isLoading: boolean;
};

const AuthContext = createContext<AuthState>({ session: null, isLoading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ session: null, isLoading: true });
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    // İlk olay (INITIAL_SESSION) cihazda kayıtlı oturumu da getirir.
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUserId = session?.user.id ?? null;

      // Kullanıcı değişince (çıkış ya da başka hesap) önceki kullanıcının verisi bellekten silinir.
      if (userIdRef.current !== nextUserId) {
        queryClient.clear();
        userIdRef.current = nextUserId;
      }

      setState({ session, isLoading: false });
    });

    return () => data.subscription.unsubscribe();
  }, []);

  return <AuthContext value={state}>{children}</AuthContext>;
}

export function useAuth(): AuthState {
  return use(AuthContext);
}
