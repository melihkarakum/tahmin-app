import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, View } from 'react-native';

import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { SectionTitle } from '@/components/ui/section-title';
import { Text } from '@/components/ui/text';
import { colors, tabularNums } from '@/constants/theme';
import { signOut, toAuthMessage } from '@/features/auth/api';
import { FormError } from '@/features/auth/components/auth-screen';
import { NotificationSettingsCard } from '@/features/notifications/components/notification-settings-card';
import { HistoryRow } from '@/features/profile/components/history-row';
import { useDeleteAccount, useMyStats, usePredictionHistory } from '@/features/profile/queries';
import { useMyProfile } from '@/features/profile/use-my-profile';
import { formatNumber } from '@/lib/format';

const RECENT_COUNT = 5;

export default function ProfileScreen() {
  const router = useRouter();
  const { data: profile } = useMyProfile();
  const statsQuery = useMyStats();
  const historyQuery = usePredictionHistory(RECENT_COUNT);
  const deleteAccount = useDeleteAccount();
  const [actionError, setActionError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const stats = statsQuery.data;
  const history = historyQuery.data ?? [];
  const displayName = profile?.display_name ?? '';

  const refresh = async () => {
    setRefreshing(true);
    await Promise.all([statsQuery.refetch(), historyQuery.refetch()]);
    setRefreshing(false);
  };

  const handleSignOut = async () => {
    setActionError(null);
    try {
      await signOut();
    } catch (error) {
      setActionError(toAuthMessage(error));
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      'Hesabını sil',
      'E-posta adresin ve giriş bilgilerin kalıcı olarak silinir, odalardan çıkarılırsın. Geçmiş tahminlerin isimsiz olarak kalır. Bu işlem geri alınamaz.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Hesabımı sil',
          style: 'destructive',
          onPress: () =>
            deleteAccount.mutate(undefined, {
              onError: () => setActionError('Hesap silinemedi. İnternet bağlantını kontrol edip tekrar dene.'),
            }),
        },
      ],
    );
  };

  return (
    <Screen
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />
      }>
      <View className="items-center pt-4">
        <Avatar name={displayName || '?'} size="lg" />
        <Text className="mt-3 text-2xl font-extrabold text-ink">{displayName}</Text>
        <Text className="text-sm text-muted">{profile ? `@${profile.username}` : ' '}</Text>
        {stats?.seasonRank ? (
          <View className="mt-3 rounded-full border border-primary bg-primary-soft px-3 py-1">
            <Text className="text-xs font-bold text-primary" style={tabularNums}>
              Türkiye sırası #{formatNumber(stats.seasonRank)}
              {stats.seasonTotal ? ` / ${formatNumber(stats.seasonTotal)}` : ''}
            </Text>
          </View>
        ) : null}
      </View>

      {statsQuery.isLoading ? (
        <View className="items-center py-10">
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : stats ? (
        <View className="mt-6 gap-3">
          <View className="flex-row gap-3">
            <StatTile label="Sezon puanı" value={formatNumber(stats.seasonPoints)} highlight />
            <StatTile label="Tahmin" value={formatNumber(stats.predictionCount)} />
          </View>
          <View className="flex-row gap-3">
            <StatTile label="Tam skor" value={formatNumber(stats.exactCount)} />
            <StatTile label="Doğru sonuç" value={formatNumber(stats.outcomeCount)} />
          </View>
          <View className="flex-row gap-3">
            <StatTile
              label="Doğruluk"
              value={stats.accuracyPercent === null ? '–' : `%${stats.accuracyPercent}`}
            />
            <StatTile label="Son 5 hafta" value={`+${formatNumber(stats.lastFiveRoundsPoints)}`} />
          </View>
        </View>
      ) : null}

      <SectionTitle
        title="Son Tahminler"
        actionLabel={history.length > 0 ? 'Tümü' : undefined}
        onActionPress={() => router.push('/history')}
      />
      <View className="overflow-hidden rounded-3xl border border-border bg-surface">
        {historyQuery.isLoading ? (
          <View className="items-center py-8">
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : history.length === 0 ? (
          <Text className="p-5 text-center text-sm text-muted">
            Henüz tahmin yapmadın. Ana sayfadan haftanın maçlarına tahmin yapabilirsin.
          </Text>
        ) : (
          history.map((item, index) => (
            <HistoryRow key={item.matchId} item={item} isLast={index === history.length - 1} />
          ))
        )}
      </View>

      <SectionTitle title="Bildirimler" />
      <NotificationSettingsCard />

      <SectionTitle title="Hesap" />
      <View className="gap-3">
        {actionError ? <FormError message={actionError} /> : null}
        <Button label="Çıkış Yap" variant="secondary" onPress={handleSignOut} />
        <Button
          label={deleteAccount.isPending ? 'Siliniyor…' : 'Hesabımı Sil'}
          variant="danger"
          onPress={confirmDelete}
          disabled={deleteAccount.isPending}
        />
      </View>
    </Screen>
  );
}

function StatTile({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View
      className={
        highlight
          ? 'flex-1 rounded-3xl border border-primary bg-primary-soft p-4'
          : 'flex-1 rounded-3xl border border-border bg-surface p-4'
      }>
      <Text className="text-xs font-semibold text-muted">{label}</Text>
      <Text
        className={highlight ? 'mt-1 text-3xl font-extrabold text-primary' : 'mt-1 text-3xl font-extrabold text-ink'}
        style={tabularNums}>
        {value}
      </Text>
    </View>
  );
}
