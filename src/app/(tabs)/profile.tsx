import { Text, View } from 'react-native';

import { Avatar } from '@/components/ui/avatar';
import { Screen } from '@/components/ui/screen';
import { SectionTitle } from '@/components/ui/section-title';
import { tabularNums } from '@/constants/theme';
import { PointsChip } from '@/features/matches/components/points-chip';
import { formatNumber, resultLabels } from '@/lib/format';
import { history, profileStats } from '@/mocks/data';
import type { HistoryItem } from '@/types/domain';

export default function ProfileScreen() {
  const stats = profileStats;

  return (
    <Screen>
      <View className="items-center pt-4">
        <Avatar name={stats.displayName} size="lg" />
        <Text className="mt-3 text-2xl font-bold text-ink">{stats.displayName}</Text>
        <Text className="text-sm text-muted">@{stats.username}</Text>
      </View>

      <View className="mt-6 gap-3">
        <View className="flex-row gap-3">
          <StatTile label="Sezon puanı" value={formatNumber(stats.seasonPoints)} />
          <StatTile label="Tahmin" value={formatNumber(stats.predictionCount)} />
        </View>
        <View className="flex-row gap-3">
          <StatTile label="Tam skor" value={formatNumber(stats.exactCount)} />
          <StatTile label="Doğru sonuç" value={formatNumber(stats.outcomeCount)} />
        </View>
        <View className="flex-row gap-3">
          <StatTile label="Doğruluk" value={`%${stats.accuracyPercent}`} />
          <StatTile label="Son 5 hafta" value={`+${stats.lastFiveRoundsPoints}`} />
        </View>
      </View>

      <SectionTitle title="Son Tahminler" />
      <View className="overflow-hidden rounded-2xl border border-border bg-surface">
        {history.map((item, index) => (
          <HistoryRow key={item.id} item={item} isLast={index === history.length - 1} />
        ))}
      </View>
    </Screen>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 rounded-2xl border border-border bg-surface p-4">
      <Text className="text-xs font-medium text-muted">{label}</Text>
      <Text className="mt-1 text-2xl font-bold text-ink" style={tabularNums}>
        {value}
      </Text>
    </View>
  );
}

function HistoryRow({ item, isLast }: { item: HistoryItem; isLast: boolean }) {
  return (
    <View
      className={
        isLast
          ? 'flex-row items-center px-4 py-3'
          : 'flex-row items-center border-b border-border px-4 py-3'
      }>
      <View className="flex-1 pr-3">
        <Text className="text-sm font-semibold text-ink" numberOfLines={1} style={tabularNums}>
          {item.home.name} {item.homeScore} – {item.awayScore} {item.away.name}
        </Text>
        <Text className="mt-0.5 text-xs text-muted" style={tabularNums}>
          Tahminin {item.predictedHome} – {item.predictedAway} · {resultLabels[item.resultType]} ·{' '}
          {item.round}. Hafta
        </Text>
      </View>
      <PointsChip points={item.points} resultType={item.resultType} />
    </View>
  );
}
