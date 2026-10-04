import { useState } from 'react';
import { RefreshControl, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { RowsSkeleton, SkeletonGroup } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { colors, tabularNums } from '@/constants/theme';
import { RankRow } from '@/features/leaderboard/components/rank-row';
import { type NationalLeaderboard, useNationalLeaderboard } from '@/features/leaderboard/queries';
import { useCurrentRound } from '@/features/matches/queries';
import { formatNumber } from '@/lib/format';
import type { LeaderboardScope } from '@/types/domain';

const scopeOptions: { value: LeaderboardScope; label: string }[] = [
  { value: 'week', label: 'Bu Hafta' },
  { value: 'season', label: 'Sezon' },
];

export default function LeaderboardScreen() {
  const [scope, setScope] = useState<LeaderboardScope>('week');
  const [refreshing, setRefreshing] = useState(false);
  const { data: current } = useCurrentRound();
  const leaderboardQuery = useNationalLeaderboard(scope, current?.round);
  const leaderboard = leaderboardQuery.data;

  const refresh = async () => {
    setRefreshing(true);
    await leaderboardQuery.refetch();
    setRefreshing(false);
  };

  const subtitle =
    scope === 'week' && current ? `Türkiye geneli · ${current.round}. hafta` : 'Türkiye geneli · Sezon';

  return (
    <Screen
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />
      }
      footer={leaderboard ? <MyRankBar leaderboard={leaderboard} /> : null}>
      <Text className="text-3xl font-extrabold text-ink">Sıralama</Text>
      <Text className="mt-1 text-sm font-medium text-muted">{subtitle}</Text>

      <View className="mt-5">
        <SegmentedControl options={scopeOptions} value={scope} onChange={setScope} />
      </View>

      {leaderboardQuery.isLoading ? (
        <SkeletonGroup className="mt-4">
          <RowsSkeleton count={8} />
        </SkeletonGroup>
      ) : leaderboardQuery.error ? (
        <View className="mt-4 items-center gap-3 rounded-3xl border border-border bg-surface p-6">
          <Text className="text-center text-sm text-muted">Sıralama yüklenemedi.</Text>
          <Button label="Tekrar dene" variant="secondary" onPress={refresh} />
        </View>
      ) : !leaderboard || leaderboard.top.length === 0 ? (
        <View className="mt-4 items-center gap-3 rounded-3xl border border-border bg-surface px-6 py-10">
          <View className="h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft">
            <Icon name="leaderboard" size={26} color={colors.primary} />
          </View>
          <Text className="text-center text-base font-bold text-ink">Henüz sıralama yok</Text>
          <Text className="text-center text-sm text-muted">
            Maçlar bittikçe tahminler puanlanır ve sıralama oluşur.
          </Text>
        </View>
      ) : (
        <>
          <View className="mt-4 overflow-hidden rounded-3xl border border-border bg-surface">
            {leaderboard.top.map((row, index) => (
              <RankRow key={row.userId} row={row} isLast={index === leaderboard.top.length - 1} />
            ))}
          </View>
          <Text className="mt-3 text-center text-xs text-muted">
            {formatNumber(leaderboard.totalCount)} kişi sıralamada · eşitlikte tam skor sayısı öne geçer
          </Text>
        </>
      )}
    </Screen>
  );
}

/** Listenin altında sabit duran, kullanıcının kendi sırası. */
function MyRankBar({ leaderboard }: { leaderboard: NationalLeaderboard }) {
  const me = leaderboard.me;

  return (
    <View className="mx-5 mb-3 flex-row items-center justify-between rounded-3xl border border-primary bg-primary-soft px-5 py-4">
      {me ? (
        <>
          <View>
            <Text className="text-xs font-semibold text-muted">Senin sıran</Text>
            <View className="mt-0.5 flex-row items-baseline gap-1">
              <Text className="text-2xl font-extrabold text-ink" style={tabularNums}>
                #{formatNumber(me.rank)}
              </Text>
              <Text className="text-xs font-semibold text-muted" style={tabularNums}>
                / {formatNumber(leaderboard.totalCount)}
              </Text>
            </View>
          </View>
          <View className="items-end">
            <Text className="text-xs font-semibold text-muted">Puan</Text>
            <Text className="mt-0.5 text-2xl font-extrabold text-primary" style={tabularNums}>
              {formatNumber(me.points)}
            </Text>
          </View>
        </>
      ) : (
        <Text className="flex-1 text-sm font-medium text-ink">
          Henüz sıralamada değilsin. Tahminlerin puanlandıkça sıraya girersin.
        </Text>
      )}
    </View>
  );
}
