import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, RefreshControl, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { PressableOpacity } from '@/components/ui/pressable-opacity';
import { Screen } from '@/components/ui/screen';
import { SectionTitle } from '@/components/ui/section-title';
import { Text } from '@/components/ui/text';
import { colors, tabularNums } from '@/constants/theme';
import { RankRow } from '@/features/leaderboard/components/rank-row';
import { MatchCard } from '@/features/matches/components/match-card';
import { WeekSummaryCard } from '@/features/matches/components/week-summary-card';
import { sortMatchesForHome } from '@/features/matches/phase';
import { useCurrentRound, useMyPredictions, useRoundMatches } from '@/features/matches/queries';
import { useMyProfile } from '@/features/profile/use-my-profile';
import { useNow } from '@/hooks/use-now';
import { formatNumber } from '@/lib/format';
import { trUpper } from '@/lib/text';
import { getNationalLeaderboard, getRoomLeaderboard, rooms } from '@/mocks/data';

export default function HomeScreen() {
  const router = useRouter();
  const now = useNow();
  const [refreshing, setRefreshing] = useState(false);

  const { data: profile } = useMyProfile();
  const roundQuery = useCurrentRound();
  const current = roundQuery.data ?? undefined;
  const matchesQuery = useRoundMatches(current?.seasonId, current?.round);
  const matches = matchesQuery.data ?? [];
  const predictionsQuery = useMyPredictions(matches.map((match) => match.id));
  const predictions = predictionsQuery.data ?? [];

  const isLoading =
    roundQuery.isLoading ||
    matchesQuery.isLoading ||
    (matches.length > 0 && predictionsQuery.isLoading);
  const loadError = roundQuery.error ?? matchesQuery.error ?? predictionsQuery.error;

  const predictionByMatch = new Map(predictions.map((p) => [p.matchId, p]));
  const weekPoints = predictions.reduce((sum, p) => sum + (p.points ?? 0), 0);

  const friendsRoom = rooms[0];
  const friendsRows = getRoomLeaderboard('week');
  const nationalRank = getNationalLeaderboard('season').me.rank;

  const refresh = async () => {
    setRefreshing(true);
    await Promise.all([roundQuery.refetch(), matchesQuery.refetch(), predictionsQuery.refetch()]);
    setRefreshing(false);
  };

  return (
    <Screen
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />
      }>
      <Text className="text-sm font-semibold text-muted">
        {current ? `Süper Lig · ${current.round}. Hafta` : 'Süper Lig'}
      </Text>
      <Text className="mt-1 text-3xl font-black text-ink">
        Merhaba{profile ? ` ${profile.display_name}` : ''} 👋
      </Text>

      <View className="mt-5">
        <WeekSummaryCard
          points={weekPoints}
          predicted={predictions.length}
          total={matches.length}
        />
      </View>

      <SectionTitle title="Bu Haftanın Maçları" />
      {isLoading ? (
        <View className="items-center py-10">
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : loadError ? (
        <View className="items-center gap-3 rounded-3xl border border-border bg-surface p-6">
          <Text className="text-center text-sm text-muted">Maçlar yüklenemedi.</Text>
          <Button label="Tekrar dene" variant="secondary" onPress={refresh} />
        </View>
      ) : matches.length === 0 ? (
        <View className="items-center gap-2 rounded-3xl border border-border bg-surface p-6">
          <Icon name="ball" size={28} color={colors.muted} />
          <Text className="text-center text-sm text-muted">Bu hafta için henüz maç yok.</Text>
        </View>
      ) : (
        <View className="gap-3">
          {sortMatchesForHome(matches, now).map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              prediction={predictionByMatch.get(match.id)}
              now={now}
            />
          ))}
        </View>
      )}

      <SectionTitle
        title="Arkadaşların"
        actionLabel="Tümünü gör"
        onActionPress={() =>
          router.push({ pathname: '/room/[id]', params: { id: friendsRoom.id } })
        }
      />
      <View className="overflow-hidden rounded-3xl border border-border bg-surface">
        <View className="flex-row items-center justify-between border-b border-border px-4 py-3">
          <View>
            <Text className="text-sm font-bold text-ink">{friendsRoom.name}</Text>
            <Text className="text-xs text-muted">Bu haftanın sıralaması</Text>
          </View>
          <SampleTag />
        </View>
        {friendsRows.slice(0, 3).map((row, index) => (
          <RankRow key={row.userId} row={row} isLast={index === 2} />
        ))}
      </View>

      <SectionTitle title="Türkiye Sıralaması" />
      <PressableOpacity onPress={() => router.push('/leaderboard')}>
        <View className="flex-row items-center justify-between rounded-3xl border border-border bg-surface p-4">
          <View>
            <View className="flex-row items-center gap-2">
              <Text className="text-xs text-muted">Sezon sıran</Text>
              <SampleTag />
            </View>
            <Text className="mt-0.5 text-2xl font-black text-ink" style={tabularNums}>
              #{formatNumber(nationalRank)}
            </Text>
          </View>
          <Icon name="chevronRight" size={16} color={colors.muted} />
        </View>
      </PressableOpacity>
    </Screen>
  );
}

/** Henüz gerçek veriye bağlanmamış bölümleri işaretler. */
function SampleTag() {
  return (
    <View className="rounded-full border border-border px-2 py-0.5">
      <Text className="text-[10px] font-bold tracking-wider text-muted">{trUpper('Örnek')}</Text>
    </View>
  );
}
