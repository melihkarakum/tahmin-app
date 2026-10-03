import { View } from 'react-native';

import { Text } from '@/components/ui/text';
import { tabularNums } from '@/constants/theme';
import { PointsChip } from '@/features/matches/components/points-chip';
import { formatKickoff, formatTime, resultLabels } from '@/lib/format';
import type { HistoryItem } from '@/types/domain';

type HistoryRowProps = {
  item: HistoryItem;
  isLast: boolean;
};

/** Tahmin geçmişinde bir satır: maç, sonuç, tahmin, kazanılan puan ve tahmin zamanı. */
export function HistoryRow({ item, isLast }: HistoryRowProps) {
  const finished = item.status === 'finished';
  const scored = item.points !== null && item.resultType !== null;

  return (
    <View className={isLast ? 'px-4 py-3.5' : 'border-b border-border px-4 py-3.5'}>
      <View className="flex-row items-center">
        <Text className="flex-1 pr-2 text-sm font-bold text-ink" numberOfLines={1}>
          {item.home.name}
        </Text>
        <Text className="w-16 text-center text-base font-extrabold text-ink" style={tabularNums}>
          {finished ? `${item.homeScore} - ${item.awayScore}` : formatTime(item.kickoffAt)}
        </Text>
        <Text className="flex-1 pl-2 text-right text-sm font-bold text-ink" numberOfLines={1}>
          {item.away.name}
        </Text>
      </View>

      <View className="mt-2.5 flex-row items-center justify-between">
        <View className="flex-1 pr-3">
          <Text className="text-xs font-semibold text-ink" style={tabularNums}>
            Tahminin {item.predictedHome} - {item.predictedAway}
            {scored && item.resultType ? (
              <Text className="text-xs font-normal text-muted"> · {resultLabels[item.resultType]}</Text>
            ) : null}
          </Text>
          <Text className="mt-0.5 text-[11px] text-muted">
            {item.round}. hafta · {formatKickoff(item.predictedAt)} kaydedildi
          </Text>
        </View>
        {scored && item.points !== null && item.resultType ? (
          <PointsChip points={item.points} resultType={item.resultType} />
        ) : (
          <View className="rounded-full bg-surface-muted px-3 py-1">
            <Text className="text-xs font-semibold text-muted">
              {finished ? 'Hesaplanıyor' : 'Bekliyor'}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
