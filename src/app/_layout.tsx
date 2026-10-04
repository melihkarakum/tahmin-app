import '@/global.css';

// Her kalınlık ayrı dosyadan alınır; paketin tamamı (italikler dahil 14 dosya) uygulamaya girmesin.
import { PlusJakartaSans_400Regular } from '@expo-google-fonts/plus-jakarta-sans/400Regular';
import { PlusJakartaSans_500Medium } from '@expo-google-fonts/plus-jakarta-sans/500Medium';
import { PlusJakartaSans_600SemiBold } from '@expo-google-fonts/plus-jakarta-sans/600SemiBold';
import { PlusJakartaSans_700Bold } from '@expo-google-fonts/plus-jakarta-sans/700Bold';
import { PlusJakartaSans_800ExtraBold } from '@expo-google-fonts/plus-jakarta-sans/800ExtraBold';
import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import Head from 'expo-router/head';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { HeaderCloseButton } from '@/components/ui/header-close-button';

import { fonts } from '@/constants/fonts';
import { colors } from '@/constants/theme';
import { AuthProvider, useAuth } from '@/features/auth/auth-provider';
import { useNotificationRouting, usePushRegistration } from '@/features/notifications/push';
import { usePendingInviteRedirect } from '@/features/rooms/pending-invite';
import { queryClient } from '@/lib/query-client';


// Alt sayfalar (oda, tahmin geçmişi): yalnızca geri oku olan sade başlık.
const detailHeader = {
  headerShown: true,
  title: '',
  headerBackButtonDisplayMode: 'minimal' as const,
  headerShadowVisible: false,
  headerStyle: { backgroundColor: colors.background },
  headerTintColor: colors.ink,
  headerTitleStyle: { fontFamily: fonts.bold },
};

// Alttan açılan ekranlar (paylaşma kartları, davet): başlık ve sağ üstte her zaman bir kapat (X).
// Başlık çubuğu telefonun kendisinindir; çentik/üst boşluk sorunları olmaz.
const closableHeader = {
  headerShown: true,
  headerBackVisible: false,
  headerShadowVisible: false,
  headerStyle: { backgroundColor: colors.background },
  headerTintColor: colors.ink,
  headerTitleStyle: { fontFamily: fonts.bold },
  headerRight: () => <HeaderCloseButton />,
};

// Yazı tipleri yüklenip kayıtlı oturum okunana kadar açılış ekranı açık kalır;
// böylece ne sistem yazı tipi bir an görünür ne de giriş ekranı bir an görünüp kaybolur.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </QueryClientProvider>
  );
}

function RootNavigator() {
  const { session, isLoading } = useAuth();
  const [fontsLoaded, fontError] = useFonts({
    [fonts.regular]: PlusJakartaSans_400Regular,
    [fonts.medium]: PlusJakartaSans_500Medium,
    [fonts.semibold]: PlusJakartaSans_600SemiBold,
    [fonts.bold]: PlusJakartaSans_700Bold,
    [fonts.extrabold]: PlusJakartaSans_800ExtraBold,
  });
  // Yazı tipi yüklenemezse uygulama sistem yazı tipiyle açılır, takılı kalmaz.
  const isReady = !isLoading && (fontsLoaded || fontError !== null);
  const isSignedIn = session !== null;

  useEffect(() => {
    if (isReady) SplashScreen.hide();
  }, [isReady]);

  usePushRegistration(session?.user.id);
  useNotificationRouting(isReady && isSignedIn);
  usePendingInviteRedirect(isReady && isSignedIn);

  // Hazır olana kadar açılış ekranı (splash) üstte kalır; gezinme ağacı ise ilk anda kurulur.
  // null döndürülürse uygulamayı açan adres (davet bağlantısı gibi) kaybolup ana sayfaya düşüyordu.
  return (
    <>
      <StatusBar style="light" />
      {/* Web'de sekme başlığı (davet sayfası kendi başlığını verir). */}
      <Head>
        <title>Tahminet</title>
      </Head>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}>
        <Stack.Protected guard={isSignedIn}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="room/[id]" options={detailHeader} />
          <Stack.Screen name="history" options={{ ...detailHeader, title: 'Skor Tahminlerim' }} />
          <Stack.Screen name="settings" options={{ ...detailHeader, title: 'Ayarlar' }} />
          {/* Paylaşma kartları alttan açılan sayfa olarak gelir. */}
          <Stack.Screen
            name="prediction/[matchId]"
            options={{ ...closableHeader, presentation: 'modal', title: 'Tahminini paylaş' }}
          />
          <Stack.Screen
            name="profile-card"
            options={{ ...closableHeader, presentation: 'modal', title: 'Profilini paylaş' }}
          />
        </Stack.Protected>

        <Stack.Protected guard={!isSignedIn}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>

        {/* Davet bağlantısı: girişli de girişsiz de açılır (ekran kendisi yönetir). */}
        <Stack.Screen
          name="davet"
          options={Platform.OS === 'web' ? undefined : { ...closableHeader, title: '' }}
        />
      </Stack>
    </>
  );
}
