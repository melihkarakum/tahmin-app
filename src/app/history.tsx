import { useState } from 'react';
import { RefreshControl, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { RowsSkeleton, SkeletonGroup } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { colors } from '@/constants/theme';
import { HistoryRow } from '@/features/profile/components/history-row';
import { usePredictionHistory } from '@/features/profile/queries';

const HISTORY_LIMIT = 200;

/** Tüm tahminlerim: maç, tahmin, sonuç, puan ve tahmin zamanı. */
export default function HistoryScreen() {
  const historyQuery = usePredictionHistory(HISTORY_LIMIT);
  const history = historyQuery.data ?? [];
  const [refreshing, setRefreshing] = useState(false);

  const refresh = async () => {
    setRefreshing(true);
    await historyQuery.refetch();
    setRefreshing(false);
  };

  return (
    <Screen
      topInset={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />
      }>
      <Text className="text-3xl font-extrabold text-ink">Tahminlerim</Text>
      <Text className="mt-1 text-sm font-medium text-muted">
        Tahmin zamanı sunucu saatiyle kaydedilir.
      </Text>

      {historyQuery.isLoading ? (
        <SkeletonGroup className="mt-5">
          <RowsSkeleton count={6} avatar={false} />
        </SkeletonGroup>
      ) : historyQuery.error ? (
        <View className="mt-5 items-center gap-3 rounded-3xl border border-border bg-surface p-6">
          <Text className="text-center text-sm text-muted">Tahminler yüklenemedi.</Text>
          <Button label="Tekrar dene" variant="secondary" onPress={refresh} />
        </View>
      ) : history.length === 0 ? (
        <Text className="mt-5 text-center text-sm text-muted">Henüz tahmin yapmadın.</Text>
      ) : (
        <View className="mt-5 overflow-hidden rounded-3xl border border-border bg-surface">
          {history.map((item, index) => (
            <HistoryRow key={item.matchId} item={item} isLast={index === history.length - 1} />
          ))}
        </View>
      )}
    </Screen>
  );
}
