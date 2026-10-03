import { Redirect } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Screen } from '@/components/ui/screen';
import { SectionTitle } from '@/components/ui/section-title';
import { Text } from '@/components/ui/text';
import { RankRow } from '@/features/leaderboard/components/rank-row';
import { MatchCard } from '@/features/matches/components/match-card';
import { WeekCard } from '@/features/matches/components/week-card';
import { WeekPickerSheet } from '@/features/matches/components/week-picker-sheet';
import { useNow } from '@/hooks/use-now';
import { getRoomLeaderboard } from '@/mocks/data';
import type { Match, Prediction, Team } from '@/types/domain';

// YALNIZCA GELİŞTİRME: tasarımı giriş yapmadan görmek için kartların tüm durumları, örnek veriyle.
// Yayın sürümünde açılmaz (ana sayfaya yönlendirir). Adres: /dev-gallery

const HOUR = 60 * 60 * 1000;

const team = (id: number, name: string, shortName: string): Team => ({ id, name, shortName });

function buildSamples(now: number): { match: Match; prediction?: Prediction }[] {
  const at = (hours: number) => new Date(now + hours * HOUR).toISOString();
  const match = (
    id: number,
    home: Team,
    away: Team,
    hours: number,
    status: Match['status'],
    score: [number, number] | null = null,
  ): Match => ({
    id,
    round: 8,
    home,
    away,
    kickoffAt: at(hours),
    status,
    homeScore: score ? score[0] : null,
    awayScore: score ? score[1] : null,
    isTest: id === -1,
  });
  const prediction = (
    matchId: number,
    home: number,
    away: number,
    points: number | null = null,
    resultType: Prediction['resultType'] = null,
  ): Prediction => ({
    matchId,
    homeGoals: home,
    awayGoals: away,
    points,
    resultType,
    updatedAt: at(-0.2),
  });

  return [
    { match: match(-1, team(1, 'Galatasaray', 'GAL'), team(2, 'Fenerbahçe', 'FEN'), 2.25, 'scheduled') },
    {
      match: match(-2, team(3, 'Antalyaspor', 'ANT'), team(4, 'Rizespor', 'RIZ'), 21, 'scheduled'),
      prediction: prediction(-2, 1, 0),
    },
    {
      match: match(-3, team(5, 'Beşiktaş', 'BES'), team(6, 'Başakşehir', 'IST'), -0.5, 'live'),
      prediction: prediction(-3, 2, 0),
    },
    {
      match: match(-4, team(7, 'Samsunspor', 'SAM'), team(8, 'Göztepe', 'GOZ'), -20, 'finished', [1, 1]),
      prediction: prediction(-4, 1, 1, 5, 'exact'),
    },
    {
      match: match(-5, team(9, 'Trabzonspor', 'TRA'), team(10, 'Konyaspor', 'KON'), -23, 'finished', [2, 0]),
      prediction: prediction(-5, 2, 1, 3, 'outcome'),
    },
    {
      match: match(-6, team(11, 'Kasımpaşa', 'KAS'), team(12, 'Alanyaspor', 'ALA'), -44, 'finished', [3, 1]),
      prediction: prediction(-6, 1, 2, 0, 'miss'),
    },
    { match: match(-7, team(13, 'Eyüpspor', 'EYU'), team(14, 'Sivasspor', 'SIV'), 30, 'postponed') },
    // Uzun takım adları: taşma ve kesilme kontrolü için.
    {
      match: match(-8, team(15, 'Adana Demirspor', 'ADA'), team(16, 'Fatih Karagümrük', 'KAR'), 50, 'scheduled'),
    },
  ];
}

const SAMPLE_ROUNDS = Array.from({ length: 38 }, (_, index) => index + 1);

export default function DevGallery() {
  const now = useNow();
  const [samples] = useState(() => buildSamples(Date.now()));
  const [round, setRound] = useState(8);
  const [pickerOpen, setPickerOpen] = useState(false);

  if (!__DEV__) return <Redirect href="/" />;

  return (
    <Screen>
      <Text className="text-sm font-semibold text-muted">Yalnızca geliştirme</Text>
      <Text className="mt-1 text-3xl font-black text-ink">Tasarım vitrini</Text>

      <View className="mt-5">
        <WeekCard
          round={round}
          dateRange="1–5 Eki"
          isCurrent={round === 8}
          canGoPrev={round > 1}
          canGoNext={round < SAMPLE_ROUNDS.length}
          onPrev={() => setRound(round - 1)}
          onNext={() => setRound(round + 1)}
          onOpenPicker={() => setPickerOpen(true)}
          points={8}
          predicted={6}
          total={9}
          rank={3}
          note="3 maç tahminini bekliyor."
        />
      </View>
      <WeekPickerSheet
        visible={pickerOpen}
        rounds={SAMPLE_ROUNDS}
        selected={round}
        current={8}
        onSelect={setRound}
        onClose={() => setPickerOpen(false)}
      />

      <SectionTitle title="Maç kartları" />
      <View className="gap-3">
        {samples.map(({ match, prediction }) => (
          <MatchCard key={match.id} match={match} prediction={prediction} now={now} />
        ))}
      </View>

      <SectionTitle title="Sıralama satırları" />
      <View className="overflow-hidden rounded-3xl border border-border bg-surface">
        {getRoomLeaderboard('week')
          .slice(0, 4)
          .map((row, index) => (
            <RankRow key={row.userId} row={row} isLast={index === 3} />
          ))}
      </View>
    </Screen>
  );
}
