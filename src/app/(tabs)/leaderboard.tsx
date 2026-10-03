import { useState } from 'react';
import { Text, View } from 'react-native';

import { Screen } from '@/components/ui/screen';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { tabularNums } from '@/constants/theme';
import { RankRow } from '@/features/leaderboard/components/rank-row';
import { formatNumber } from '@/lib/format';
import { getNationalLeaderboard } from '@/mocks/data';
import type { LeaderboardRow, LeaderboardScope } from '@/types/domain';

const scopeOptions: { value: LeaderboardScope; label: string }[] = [
  { value: 'week', label: 'Bu Hafta' },
  { value: 'season', label: 'Sezon' },
];

export default function LeaderboardScreen() {
  const [scope, setScope] = useState<LeaderboardScope>('week');
  const { top, me } = getNationalLeaderboard(scope);

  return (
    <Screen footer={<MyRankBar row={me} />}>
      <Text className="text-3xl font-bold text-ink">Sıralama</Text>
      <Text className="mt-1 text-sm text-muted">Türkiye geneli · Süper Lig</Text>

      <View className="mt-5">
        <SegmentedControl options={scopeOptions} value={scope} onChange={setScope} />
      </View>

      <View className="mt-4 overflow-hidden rounded-2xl border border-border bg-surface">
        {top.map((row, index) => (
          <RankRow key={row.userId} row={row} isLast={index === top.length - 1} />
        ))}
      </View>
    </Screen>
  );
}

/** Listenin altında sabit duran, kullanıcının kendi sırası. */
function MyRankBar({ row }: { row: LeaderboardRow }) {
  return (
    <View className="mx-5 mb-3 flex-row items-center justify-between rounded-2xl bg-ink px-5 py-4">
      <View>
        <Text className="text-xs font-medium text-surface/60">Senin sıran</Text>
        <Text className="mt-0.5 text-2xl font-bold text-surface" style={tabularNums}>
          #{formatNumber(row.rank)}
        </Text>
      </View>
      <View className="items-end">
        <Text className="text-xs font-medium text-surface/60">Puan</Text>
        <Text className="mt-0.5 text-2xl font-bold text-surface" style={tabularNums}>
          {formatNumber(row.points)}
        </Text>
      </View>
    </View>
  );
}
