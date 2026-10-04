import { View } from 'react-native';

import { Skeleton } from '@/components/ui/skeleton';
import { PredictionTile } from '@/features/profile/components/prediction-tile';
import type { HistoryItem } from '@/types/domain';

type PredictionGridProps = {
  items: HistoryItem[];
  onPress: (item: HistoryItem) => void;
};

/** İki sütunlu tahmin ızgarası (profilde ilk birkaç tahmin için; uzun liste "Skor Tahminlerim" ekranında). */
export function PredictionGrid({ items, onPress }: PredictionGridProps) {
  const rows: HistoryItem[][] = [];
  for (let index = 0; index < items.length; index += 2) rows.push(items.slice(index, index + 2));

  return (
    <View className="gap-3">
      {rows.map((pair) => (
        <View key={pair[0].matchId} className="flex-row gap-3">
          {pair.map((item) => (
            <PredictionTile key={item.matchId} item={item} onPress={() => onPress(item)} />
          ))}
          {pair.length === 1 ? <View style={{ flex: 1 }} /> : null}
        </View>
      ))}
    </View>
  );
}

/** Izgara yüklenirken iskelet. */
export function PredictionGridSkeleton({ rows = 2 }: { rows?: number }) {
  return (
    <View className="gap-3">
      {Array.from({ length: rows }, (_, index) => (
        <View key={index} className="flex-row gap-3">
          <Skeleton flex height={150} radius={24} />
          <Skeleton flex height={150} radius={24} />
        </View>
      ))}
    </View>
  );
}
