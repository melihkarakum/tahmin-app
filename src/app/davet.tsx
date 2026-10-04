import { useLocalSearchParams, useRouter } from 'expo-router';
import Head from 'expo-router/head';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { Platform, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/features/auth/auth-provider';
import { savePendingInvite } from '@/features/rooms/pending-invite';
import { joinStatusMessages, toRoomMessage, useJoinRoom } from '@/features/rooms/queries';
import { normalizeInviteCode } from '@/lib/invite';
import { trUpper } from '@/lib/text';

// Davet bağlantısı: https://tahminet.expo.app/davet?kod=ABC234
// - Tarayıcıda: kodu ve uygulamayla nasıl katılınacağını gösteren sayfa (web sitesi).
// - Uygulamada (bağlantı uygulamayı açınca): onay alıp odaya katılır. Giriş yapılmamışsa kod
//   saklanır, girişten sonra bu ekran yeniden açılır.
export default function InviteScreen() {
  const { kod } = useLocalSearchParams<{ kod?: string | string[] }>();
  const code = normalizeInviteCode(Array.isArray(kod) ? kod[0] : kod);
  return Platform.OS === 'web' ? <InviteLanding code={code} /> : <InviteJoin code={code} />;
}

const noSubscription = () => () => {};

/** Sayfa önceden (sunucuda, kodsuz) üretilir; kod yalnızca tarayıcıda okunur. */
function useIsBrowser() {
  return useSyncExternalStore(
    noSubscription,
    () => true,
    () => false,
  );
}

function InviteLanding({ code }: { code: string | null }) {
  const mounted = useIsBrowser();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!code) return;
    try {
      await globalThis.navigator?.clipboard?.writeText(code);
      setCopied(true);
    } catch {
      // Kopyalanamazsa kod ekranda okunabilir.
    }
  };

  return (
    <Screen>
      <Head>
        <title>Tahmin odasına davet</title>
      </Head>
      <View className="w-full max-w-[440px] self-center pt-6">
        <Text className="text-xs font-bold tracking-widest text-primary">{trUpper('Skor tahmini')}</Text>
        <Text className="mt-2 text-3xl font-extrabold text-ink">Tahmin odasına davet edildin</Text>
        <Text className="mt-2 text-sm text-muted">
          Arkadaşlarınla Süper Lig maçlarının skorunu tahmin et, odanın sıralamasında yarışın. Para
          yok, ödül yok; sadece eğlence.
        </Text>

        {mounted && !code ? (
          <View className="mt-6 rounded-3xl border border-border bg-surface p-5">
            <Text className="text-sm text-muted">
              Davet bağlantısı eksik ya da hatalı. Arkadaşından oda kodunu tekrar iste.
            </Text>
          </View>
        ) : (
          <View className="mt-6 items-center rounded-3xl border border-border bg-surface p-5">
            <Text className="text-[10px] font-bold tracking-widest text-muted">{trUpper('Oda kodu')}</Text>
            <Text className="mt-1 text-4xl font-extrabold tracking-[6px] text-ink">
              {mounted ? code : ' '}
            </Text>
            <Button
              label={copied ? 'Kopyalandı' : 'Kodu Kopyala'}
              variant="secondary"
              onPress={copy}
              style={{ marginTop: 16, alignSelf: 'stretch' }}
            />
          </View>
        )}

        <View className="mt-6 gap-4">
          <Step number={1} text="Uygulamayı telefonuna indir. Çok yakında App Store ve Google Play'de." />
          <Step number={2} text="Kayıt ol ya da giriş yap." />
          <Step number={3} text="Odalar sekmesinde Koda Katıl'a dokun ve bu kodu gir." />
        </View>
      </View>
    </Screen>
  );
}

function Step({ number, text }: { number: number; text: string }) {
  return (
    <View className="flex-row items-start gap-3">
      <View className="h-7 w-7 items-center justify-center rounded-full bg-primary-soft">
        <Text className="text-sm font-bold text-primary">{number}</Text>
      </View>
      <Text className="flex-1 pt-1 text-sm text-ink">{text}</Text>
    </View>
  );
}

function InviteJoin({ code }: { code: string | null }) {
  const router = useRouter();
  const { session } = useAuth();
  const joinRoom = useJoinRoom();
  const [message, setMessage] = useState<string | null>(null);
  const isSignedIn = session !== null;

  useEffect(() => {
    if (code && !isSignedIn) savePendingInvite(code);
  }, [code, isSignedIn]);

  if (!code) {
    return (
      <Screen>
        <Text className="mt-6 text-3xl font-extrabold text-ink">Davet açılamadı</Text>
        <Text className="mt-2 text-sm text-muted">
          Bağlantı eksik ya da hatalı. Arkadaşından oda kodunu iste ve Odalar sekmesinde Koda
          Katıl&apos;a gir.
        </Text>
        <Button label="Ana Sayfaya Dön" onPress={() => router.replace('/')} style={{ marginTop: 24 }} />
      </Screen>
    );
  }

  if (!isSignedIn) {
    return (
      <Screen>
        <Text className="mt-6 text-3xl font-extrabold text-ink">Tahmin odasına davet edildin</Text>
        <Text className="mt-2 text-sm text-muted">
          Odaya katılmak için önce giriş yap ya da kayıt ol. Ardından davet kendiliğinden açılacak.
        </Text>
        <CodeCard code={code} />
        <View className="mt-6 gap-3">
          <Button label="Giriş Yap" onPress={() => router.replace('/login')} />
          <Button label="Kayıt Ol" variant="secondary" onPress={() => router.replace('/register')} />
        </View>
      </Screen>
    );
  }

  const join = () => {
    setMessage(null);
    joinRoom.mutate(code, {
      onSuccess: ({ status, roomId }) => {
        if (status === 'joined' || status === 'already_member') {
          if (roomId) router.replace({ pathname: '/room/[id]', params: { id: roomId } });
          return;
        }
        setMessage(joinStatusMessages[status]);
      },
      onError: (error) => setMessage(toRoomMessage(error)),
    });
  };

  return (
    <Screen>
      <Text className="mt-6 text-3xl font-extrabold text-ink">Tahmin odasına davet edildin</Text>
      <Text className="mt-2 text-sm text-muted">
        Katılınca bu odanın haftalık ve sezon sıralamasında yer alırsın. Tahminlerin tüm odalarında
        geçerlidir.
      </Text>
      <CodeCard code={code} />
      {message ? <Text className="mt-4 text-sm text-danger">{message}</Text> : null}
      <View className="mt-6 gap-3">
        <Button
          label={joinRoom.isPending ? 'Katılınıyor…' : 'Odaya Katıl'}
          onPress={join}
          disabled={joinRoom.isPending}
        />
        <Button label="Vazgeç" variant="secondary" onPress={() => router.replace('/')} />
      </View>
    </Screen>
  );
}

function CodeCard({ code }: { code: string }) {
  return (
    <View className="mt-6 items-center rounded-3xl border border-border bg-surface p-5">
      <Text className="text-[10px] font-bold tracking-widest text-muted">{trUpper('Oda kodu')}</Text>
      <Text className="mt-1 text-4xl font-extrabold tracking-[6px] text-ink">{code}</Text>
    </View>
  );
}
