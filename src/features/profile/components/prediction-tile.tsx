import { View } from 'react-native';

import { PressableOpacity } from '@/components/ui/pressable-opacity';
import { Text } from '@/components/ui/text';
import { colors, tabularNums } from '@/constants/theme';
import { TeamCrest } from '@/features/matches/components/team-crest';
import { type PredictionOutcome, predictionOutcome } from '@/features/profile/prediction-filters';
import { formatDay } from '@/lib/format';
import { trUpper } from '@/lib/text';
import type { HistoryItem } from '@/types/domain';

/** Sonuca göre vurgu rengi: tam skor altın, doğru yeşil, tutmayan kırmızı, bekleyen gri. */
export const outcomeColors: Record<PredictionOutcome, string> = {
  exact: colors.gold,
  outcome: colors.primary,
  miss: colors.danger,
  pending: colors.border,
};

type PredictionTileProps = {
  item: HistoryItem;
  onPress: () => void;
};

/** "Skor Tahminlerim" ızgarasındaki kare: maç, gerçek skor, tahmin ve sonuç. Dokununca paylaşma kartı açılır. */
export function PredictionTile({ item, onPress }: PredictionTileProps) {
  const outcome = predictionOutcome(item);
  const finished = item.status === 'finished';

  return (
    <PressableOpacity
      onPress={onPress}
      style={{ flex: 1 }}
      accessibilityLabel={`${item.home.name} - ${item.away.name}, tahminin ${item.predictedHome}-${item.predictedAway}. Paylaşmak için dokun`}>
      <View className="overflow-hidden rounded-3xl border border-border bg-surface px-3 pb-3 pt-3.5">
        <View
          style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: outcomeColors[outcome] }}
        />
        <View className="flex-row items-center justify-between">
          <Text className="text-[10px] font-bold tracking-wider text-muted">{trUpper(`${item.round}. hafta`)}</Text>
          <Text className="text-[10px] font-semibold text-muted">{formatDay(item.kickoffAt)}</Text>
        </View>

        <View className="mt-3 flex-row items-center justify-between">
          <TeamCrest name={item.home.name} shortName={item.home.shortName} logoUrl={item.home.logoUrl} size="sm" />
          <Text className="text-xl font-black text-ink" style={tabularNums}>
            {finished ? `${item.homeScore}-${item.awayScore}` : '–'}
          </Text>
          <TeamCrest name={item.away.name} shortName={item.away.shortName} logoUrl={item.away.logoUrl} size="sm" />
        </View>
        <View className="mt-1 flex-row justify-between">
          <Text className="text-[10px] font-bold text-muted">{item.home.shortName}</Text>
          <Text className="text-[10px] font-bold text-muted">{item.away.shortName}</Text>
        </View>

        <View className="mt-3 flex-row items-center justify-between rounded-xl bg-surface-muted px-2.5 py-1.5">
          <Text className="text-[11px] text-muted" style={tabularNums}>
            Tahmin{' '}
            <Text className="text-[11px] font-black text-ink">
              {item.predictedHome}-{item.predictedAway}
            </Text>
          </Text>
          <OutcomeLabel outcome={outcome} points={item.points} finished={finished} />
        </View>
      </View>
    </PressableOpacity>
  );
}

function OutcomeLabel({
  outcome,
  points,
  finished,
}: {
  outcome: PredictionOutcome;
  points: number | null;
  finished: boolean;
}) {
  if (outcome === 'pending') {
    return <Text className="text-[11px] font-semibold text-muted">{finished ? 'Hesaplanıyor' : 'Bekliyor'}</Text>;
  }
  return (
    <Text className="text-[11px] font-black" style={[tabularNums, { color: outcome === 'miss' ? colors.muted : outcomeColors[outcome] }]}>
      {points && points > 0 ? `+${points}` : '0'} puan
    </Text>
  );
}
