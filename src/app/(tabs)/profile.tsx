import { useRouter } from 'expo-router';
import { useState } from 'react';
import { RefreshControl, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Skeleton, SkeletonGroup } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { colors } from '@/constants/theme';
import { useCurrentRound } from '@/features/matches/queries';
import { EditProfileSheet } from '@/features/profile/components/edit-profile-sheet';
import { FilterChips } from '@/features/profile/components/filter-chips';
import { PredictionGrid, PredictionGridSkeleton } from '@/features/profile/components/prediction-grid';
import { ProfileHeader, ProfileHighlights } from '@/features/profile/components/profile-header';
import { filterCounts, matchesFilter, type PredictionFilter } from '@/features/profile/prediction-filters';
import { useMyStats, usePredictionHistory } from '@/features/profile/queries';
import { useMyProfile } from '@/features/profile/use-my-profile';

// Profilde gösterilen tahmin sayısı; tamamı "Skor Tahminlerim" ekranında.
const PROFILE_GRID_COUNT = 6;

/** Instagram düzeninde profil: kimlik ve sayılar, öne çıkan istatistikler, "Skor Tahminlerim". */
export default function ProfileScreen() {
  const router = useRouter();
  const { data: profile } = useMyProfile();
  const statsQuery = useMyStats();
  const historyQuery = usePredictionHistory();
  const { data: current } = useCurrentRound();
  const [filter, setFilter] = useState<PredictionFilter>('all');
  const [editOpen, setEditOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const stats = statsQuery.data;
  const history = historyQuery.data ?? [];
  const counts = filterCounts(history);
  const filtered = history.filter((item) => matchesFilter(item, filter));
  const visible = filtered.slice(0, PROFILE_GRID_COUNT);

  const openShare = (matchId: number) =>
    router.push({ pathname: '/prediction/[matchId]', params: { matchId: String(matchId) } });

  const refresh = async () => {
    setRefreshing(true);
    await Promise.all([statsQuery.refetch(), historyQuery.refetch()]);
    setRefreshing(false);
  };

  return (
    <Screen
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />
      }>
      <ProfileHeader
        username={profile?.username ?? ''}
        displayName={profile?.display_name ?? ''}
        seasonLabel={current ? `${current.seasonName} sezonu` : undefined}
        stats={stats}
        onOpenSettings={() => router.push('/settings')}
        onEditProfile={() => setEditOpen(true)}
        onShareProfile={() => router.push('/profile-card')}
      />

      <View className="mt-5">
        {stats ? (
          <ProfileHighlights stats={stats} />
        ) : (
          <SkeletonGroup>
            <Skeleton height={68} radius={24} />
          </SkeletonGroup>
        )}
      </View>

      <View className="mt-8 flex-row items-end justify-between">
        <Text className="text-xl font-bold text-ink">Skor Tahminlerim</Text>
      </View>
      <View className="mt-3">
        <FilterChips value={filter} counts={counts} onChange={setFilter} />
      </View>

      <View className="mt-4">
        {historyQuery.isLoading ? (
          <SkeletonGroup>
            <PredictionGridSkeleton />
          </SkeletonGroup>
        ) : historyQuery.error ? (
          <View className="items-center gap-3 rounded-3xl border border-border bg-surface p-6">
            <Text className="text-center text-sm text-muted">Tahminler yüklenemedi.</Text>
            <Button label="Tekrar dene" variant="secondary" onPress={refresh} />
          </View>
        ) : history.length === 0 ? (
          <View className="items-center rounded-3xl border border-border bg-surface p-6">
            <Text className="text-center text-sm text-muted">
              Henüz tahmin yapmadın. Ana sayfadan haftanın maçlarına tahmin yapabilirsin.
            </Text>
          </View>
        ) : visible.length === 0 ? (
          <View className="items-center rounded-3xl border border-border bg-surface p-6">
            <Text className="text-center text-sm text-muted">Bu süzgeçte tahmin yok.</Text>
          </View>
        ) : (
          <>
            <PredictionGrid items={visible} onPress={(item) => openShare(item.matchId)} />
            {filtered.length > visible.length ? (
              <Button
                label={`Tüm tahminlerini gör (${filtered.length})`}
                variant="secondary"
                icon="history"
                onPress={() => router.push({ pathname: '/history', params: { filtre: filter } })}
                style={{ marginTop: 12 }}
              />
            ) : null}
            <Text className="mt-3 text-center text-xs text-muted">
              {"Bir tahmine dokun: Instagram hikâyende ya da WhatsApp'ta paylaş."}
            </Text>
          </>
        )}
      </View>

      <EditProfileSheet
        visible={editOpen}
        username={profile?.username ?? ''}
        displayName={profile?.display_name ?? ''}
        onClose={() => setEditOpen(false)}
      />
    </Screen>
  );
}
