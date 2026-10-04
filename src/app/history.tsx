import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { SkeletonGroup } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { colors } from '@/constants/theme';
import { FilterChips } from '@/features/profile/components/filter-chips';
import { PredictionGridSkeleton } from '@/features/profile/components/prediction-grid';
import { PredictionTile } from '@/features/profile/components/prediction-tile';
import {
  filterCounts,
  matchesFilter,
  PREDICTION_FILTERS,
  type PredictionFilter,
} from '@/features/profile/prediction-filters';
import { usePredictionHistory } from '@/features/profile/queries';

/** "Skor Tahminlerim": tüm tahminler, süzgeçle (Doğru, Tam Skor, Yanlış, Bekleyen). Uzun liste için FlatList. */
export default function HistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { filtre } = useLocalSearchParams<{ filtre?: string }>();
  const [filter, setFilter] = useState<PredictionFilter>(
    PREDICTION_FILTERS.includes(filtre as PredictionFilter) ? (filtre as PredictionFilter) : 'all',
  );
  const historyQuery = usePredictionHistory();
  const history = historyQuery.data ?? [];
  const [refreshing, setRefreshing] = useState(false);

  const counts = filterCounts(history);
  const filtered = history.filter((item) => matchesFilter(item, filter));

  const openShare = (matchId: number) =>
    router.push({ pathname: '/prediction/[matchId]', params: { matchId: String(matchId) } });

  const refresh = async () => {
    setRefreshing(true);
    await historyQuery.refetch();
    setRefreshing(false);
  };

  const header = (
    <View className="pb-4">
      <Text className="mb-3 text-sm font-medium text-muted">Tahmin zamanı sunucu saatiyle kaydedilir.</Text>
      <FilterChips value={filter} counts={counts} onChange={setFilter} />
    </View>
  );

  const empty = historyQuery.isLoading ? (
    <SkeletonGroup>
      <PredictionGridSkeleton rows={3} />
    </SkeletonGroup>
  ) : historyQuery.error ? (
    <View className="items-center gap-3 rounded-3xl border border-border bg-surface p-6">
      <Text className="text-center text-sm text-muted">Tahminler yüklenemedi.</Text>
      <Button label="Tekrar dene" variant="secondary" onPress={refresh} />
    </View>
  ) : (
    <View className="items-center rounded-3xl border border-border bg-surface p-6">
      <Text className="text-center text-sm text-muted">
        {history.length === 0 ? 'Henüz tahmin yapmadın.' : 'Bu süzgeçte tahmin yok.'}
      </Text>
    </View>
  );

  return (
    <FlatList
      className="flex-1 bg-background"
      data={filtered}
      keyExtractor={(item) => String(item.matchId)}
      numColumns={2}
      columnWrapperStyle={{ gap: 12 }}
      contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: insets.bottom + 24, gap: 12 }}
      ListHeaderComponent={header}
      ListEmptyComponent={empty}
      renderItem={({ item, index }) => (
        <>
          <PredictionTile item={item} onPress={() => openShare(item.matchId)} />
          {/* Tek kalan son kare tam genişliğe yayılmasın. */}
          {index === filtered.length - 1 && filtered.length % 2 === 1 ? <View style={{ flex: 1 }} /> : null}
        </>
      )}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />}
    />
  );
}
