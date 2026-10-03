import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { PressableOpacity } from '@/components/ui/pressable-opacity';
import { Screen } from '@/components/ui/screen';
import { SectionTitle } from '@/components/ui/section-title';
import { colors, tabularNums } from '@/constants/theme';
import { RankRow } from '@/features/leaderboard/components/rank-row';
import { MatchCard } from '@/features/matches/components/match-card';
import { sortMatchesForHome } from '@/features/matches/phase';
import { useMyProfile } from '@/features/profile/use-my-profile';
import { useNow } from '@/hooks/use-now';
import { formatNumber } from '@/lib/format';
import {
  currentRound,
  getNationalLeaderboard,
  getRoomLeaderboard,
  initialPredictions,
  matches,
  rooms,
} from '@/mocks/data';
import type { Prediction } from '@/types/domain';

export default function HomeScreen() {
  const router = useRouter();
  const now = useNow();
  const { data: profile } = useMyProfile();
  const [predictions, setPredictions] = useState<Prediction[]>(initialPredictions);

  const predictionByMatch = new Map(predictions.map((p) => [p.matchId, p]));
  const weekPoints = predictions.reduce((sum, p) => sum + (p.points ?? 0), 0);
  const sortedMatches = sortMatchesForHome(matches, now);

  const friendsRoom = rooms[0];
  const friendsRows = getRoomLeaderboard('week');
  const myRoomRank = friendsRows.find((row) => row.isMe)?.rank;
  const nationalRank = getNationalLeaderboard('season').me.rank;

  const savePrediction = (matchId: string, homeGoals: number, awayGoals: number) => {
    setPredictions((previous) => [
      ...previous.filter((p) => p.matchId !== matchId),
      { matchId, homeGoals, awayGoals, points: null, resultType: null },
    ]);
  };

  return (
    <Screen>
      <View className="flex-row items-start justify-between">
        <View>
          <Text className="text-3xl font-bold text-ink">
            Merhaba{profile ? ` ${profile.display_name}` : ''} 👋
          </Text>
          <Text className="mt-1 text-sm text-muted">Süper Lig · {currentRound}. Hafta</Text>
        </View>
        <View className="mt-2 rounded-full border border-border px-2.5 py-1">
          <Text className="text-xs font-medium text-muted">Örnek veri</Text>
        </View>
      </View>

      <View className="mt-5 flex-row rounded-2xl bg-ink p-5">
        <HeroStat label="Haftalık sıran" value={myRoomRank ? `#${myRoomRank}` : '–'} />
        <HeroStat label="Puan" value={String(weekPoints)} />
        <HeroStat label="Tahmin" value={`${predictions.length}/${matches.length}`} />
      </View>

      <SectionTitle title="Bu Haftanın Maçları" />
      <View className="gap-3">
        {sortedMatches.map((match) => (
          <MatchCard
            key={match.id}
            match={match}
            prediction={predictionByMatch.get(match.id)}
            now={now}
            onSave={savePrediction}
          />
        ))}
      </View>

      <SectionTitle
        title="Arkadaşların"
        actionLabel="Tümünü gör"
        onActionPress={() =>
          router.push({ pathname: '/room/[id]', params: { id: friendsRoom.id } })
        }
      />
      <View className="overflow-hidden rounded-2xl border border-border bg-surface">
        <View className="border-b border-border px-4 py-3">
          <Text className="text-sm font-semibold text-ink">{friendsRoom.name}</Text>
          <Text className="text-xs text-muted">Bu haftanın sıralaması</Text>
        </View>
        {friendsRows.slice(0, 3).map((row, index) => (
          <RankRow key={row.userId} row={row} isLast={index === 2} />
        ))}
      </View>

      <SectionTitle title="Türkiye Sıralaması" />
      <PressableOpacity onPress={() => router.push('/leaderboard')}>
        <View className="flex-row items-center justify-between rounded-2xl border border-border bg-surface p-4">
          <View>
            <Text className="text-xs text-muted">Sezon sıran</Text>
            <Text className="mt-0.5 text-2xl font-bold text-ink" style={tabularNums}>
              #{formatNumber(nationalRank)}
            </Text>
          </View>
          <Icon name="chevronRight" size={16} color={colors.muted} />
        </View>
      </PressableOpacity>
    </Screen>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1">
      <Text className="text-xs font-medium text-surface/60">{label}</Text>
      <Text className="mt-1 text-3xl font-bold text-surface" style={tabularNums}>
        {value}
      </Text>
    </View>
  );
}
