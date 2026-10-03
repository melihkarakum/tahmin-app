import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { AppState } from 'react-native';

import { useAuth } from '@/features/auth/auth-provider';
import { getPushStatus, registerForPush } from '@/features/notifications/push';
import { supabase } from '@/lib/supabase';

export type NotificationSettings = { matchReminders: boolean; roundResults: boolean };

// push.ts'deki maybeOfferPush de bu anahtarı günceller.
const PUSH_STATUS_KEY = ['push-status'];

/** Kullanıcının bildirim tercihleri (sunucuda; kayıt yoksa ikisi de açık). */
export function useNotificationSettings() {
  const { session } = useAuth();
  const userId = session?.user.id;

  return useQuery({
    queryKey: ['notification-settings', userId],
    enabled: userId !== undefined,
    queryFn: async (): Promise<NotificationSettings> => {
      const { data, error } = await supabase.rpc('get_my_notification_settings');
      if (error) throw error;
      const row = data[0];
      return { matchReminders: row?.match_reminders ?? true, roundResults: row?.round_results ?? true };
    },
  });
}

export function useUpdateNotificationSettings() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const queryKey = ['notification-settings', session?.user.id];

  return useMutation({
    mutationFn: async (next: NotificationSettings) => {
      const { error } = await supabase.rpc('set_notification_settings', {
        p_match_reminders: next.matchReminders,
        p_round_results: next.roundResults,
      });
      if (error) throw error;
    },
    // Anahtar hemen değişir; sunucu reddederse eski haline döner.
    onMutate: async (next) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<NotificationSettings>(queryKey);
      queryClient.setQueryData(queryKey, next);
      return { previous };
    },
    onError: (_error, _next, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });
}

/** Telefonun bildirim izni. Ayarlar uygulamasından dönünce yeniden okunur. */
export function usePushStatus() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') queryClient.invalidateQueries({ queryKey: PUSH_STATUS_KEY });
    });
    return () => subscription.remove();
  }, [queryClient]);

  return useQuery({ queryKey: PUSH_STATUS_KEY, queryFn: getPushStatus });
}

/** İzin ister ve cihazı kaydeder. */
export function useEnablePush() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => registerForPush({ ask: true }),
    onSuccess: (status) => queryClient.setQueryData(PUSH_STATUS_KEY, status),
  });
}
