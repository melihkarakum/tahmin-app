import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { type Href, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Alert, Platform } from 'react-native';

import { queryClient } from '@/lib/query-client';
import { supabase } from '@/lib/supabase';

// Bildirim izni, cihaz adresi ve bildirime dokununca açılacak ekran.
// Uygulama yalnızca kendi cihazının adresini sunucuya kaydeder; bildirimleri sunucu gönderir.

export type PushStatus =
  | 'unsupported' // web, simülatör ya da Android'de Expo Go
  | 'undetermined' // henüz sorulmadı
  | 'denied' // kapatılmış; yalnızca telefon ayarlarından açılabilir
  | 'granted';

/** Bu cihaz uzaktan bildirim alabilir mi? */
export function isPushSupported(): boolean {
  if (Platform.OS === 'web' || !Device.isDevice) return false;
  // SDK 53'ten beri Android'de Expo Go uzaktan bildirim almıyor; mağaza sürümünde çalışır.
  if (Platform.OS === 'android' && Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
    return false;
  }
  return true;
}

if (isPushSupported()) {
  // Uygulama açıkken gelen bildirim de ekranın üstünde gösterilir.
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

let registeredToken: string | null = null;

export async function getPushStatus(): Promise<PushStatus> {
  if (!isPushSupported()) return 'unsupported';
  const permission = await Notifications.getPermissionsAsync();
  if (permission.granted) return 'granted';
  return permission.canAskAgain ? 'undetermined' : 'denied';
}

/**
 * İzin varsa bu cihazın bildirim adresini alır ve giriş yapan kullanıcıya kaydeder.
 * ask = true ise izin henüz sorulmadıysa telefonun izin penceresini açar.
 */
export async function registerForPush({ ask }: { ask: boolean }): Promise<PushStatus> {
  if (!isPushSupported()) return 'unsupported';

  if (Platform.OS === 'android') {
    // Android 13+: izin penceresinin çıkması için önce bir bildirim kanalı gerekir.
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Bildirimler',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }

  let permission = await Notifications.getPermissionsAsync();
  if (!permission.granted && ask && permission.canAskAgain) {
    permission = await Notifications.requestPermissionsAsync();
  }
  if (!permission.granted) return permission.canAskAgain ? 'undetermined' : 'denied';

  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) throw new Error('EAS projectId bulunamadı (app.json).');

  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
  const { error } = await supabase.rpc('register_push_token', { p_token: token, p_platform: Platform.OS });
  if (error) throw error;
  registeredToken = token;
  return 'granted';
}

/** Çıkıştan önce bu cihazın adresini sunucudan siler. Hata çıkışı engellemez. */
export async function unregisterPush(): Promise<void> {
  const token = registeredToken;
  registeredToken = null;
  if (!token) return;
  // Silinemezse adres, aynı cihazda giriş yapan sonraki hesaba taşınır.
  await supabase.rpc('unregister_push_token', { p_token: token });
}

const OFFER_KEY = 'push-offer-shown-at';
const OFFER_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;

function readStorage(key: string): string | null {
  try {
    return globalThis.localStorage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string) {
  try {
    globalThis.localStorage?.setItem(key, value);
  } catch {
    // Kaydedilemezse soru bir sonraki tahminde yeniden çıkabilir; zararı yok.
  }
}

/**
 * Tahmin kaydedilince: telefonun izin penceresi henüz hiç açılmadıysa önce uygulama içinde sorar
 * ("Şimdi değil" denirse en erken bir hafta sonra tekrar). İzin penceresi iOS'ta yalnızca bir kez
 * açılabildiği için, kullanıcı ne için izin verdiğini bilerek karar verir.
 */
export async function maybeOfferPush(): Promise<void> {
  if ((await getPushStatus()) !== 'undetermined') return;
  const lastShown = Number(readStorage(OFFER_KEY) ?? 0);
  if (Date.now() - lastShown < OFFER_INTERVAL_MS) return;
  writeStorage(OFFER_KEY, String(Date.now()));

  Alert.alert(
    'Maçları kaçırma',
    'Tahmin yapmadığın maç başlamadan 1 saat önce ve hafta bitince puanınla sana haber verelim mi?',
    [
      { text: 'Şimdi değil', style: 'cancel' },
      {
        text: 'Haber ver',
        onPress: () => {
          registerForPush({ ask: true })
            .then((status) => queryClient.setQueryData(['push-status'], status))
            .catch(() => {
              // Açılamazsa Profil > Bildirimler'den tekrar denenebilir.
            });
        },
      },
    ],
  );
}

/** Giriş yapılınca (ve her açılışta) izin zaten verilmişse adresi sessizce yeniler. */
export function usePushRegistration(userId: string | undefined) {
  useEffect(() => {
    if (!userId) return;
    registerForPush({ ask: false }).catch(() => {
      // Sessiz yenileme: hata gösterilmez, Profil'deki düğmeyle tekrar denenebilir.
    });
  }, [userId]);
}

// Bildirimin taşıdığı adres yalnızca bu ekranlardan biri olabilir.
const NOTIFICATION_ROUTES: Record<string, Href> = {
  '/': '/',
  '/leaderboard': '/leaderboard',
};

/** Bildirime dokununca ilgili ekranı açar (uygulama kapalıyken açıldıysa da). */
export function useNotificationRouting(enabled: boolean) {
  const router = useRouter();

  useEffect(() => {
    if (!enabled || !isPushSupported()) return;

    const open = (response: Notifications.NotificationResponse | null) => {
      if (!response) return;
      Notifications.clearLastNotificationResponse();
      const url = response.notification.request.content.data?.url;
      const href = typeof url === 'string' ? NOTIFICATION_ROUTES[url] : undefined;
      if (href) router.navigate(href);
    };

    open(Notifications.getLastNotificationResponse());
    const subscription = Notifications.addNotificationResponseReceivedListener(open);
    return () => subscription.remove();
  }, [enabled, router]);
}
