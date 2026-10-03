import { useState } from 'react';
import { ActivityIndicator, RefreshControl, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { colors } from '@/constants/theme';
import { MatchCard } from '@/features/matches/components/match-card';
import { WeekCard } from '@/features/matches/components/week-card';
import { WeekPickerSheet } from '@/features/matches/components/week-picker-sheet';
import { getMatchPhase, sortMatchesForHome } from '@/features/matches/phase';
import {
  useCurrentRound,
  useMyPredictions,
  useRoundMatches,
  useSeasonRounds,
} from '@/features/matches/queries';
import { useNow } from '@/hooks/use-now';
import { formatDateRange } from '@/lib/format';
import type { Match, Prediction } from '@/types/domain';

export default function HomeScreen() {
  const now = useNow();
  const [refreshing, setRefreshing] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  // Kullanıcı bir hafta seçmediyse içinde bulunulan hafta gösterilir.
  const [pickedRound, setPickedRound] = useState<number | null>(null);

  const roundQuery = useCurrentRound();
  const current = roundQuery.data ?? undefined;
  const roundsQuery = useSeasonRounds(current?.seasonId);
  const rounds = roundsQuery.data ?? [];
  const selectedRound = pickedRound ?? current?.round;
  const isCurrentRound = selectedRound !== undefined && selectedRound === current?.round;
  const roundIndex = selectedRound === undefined ? -1 : rounds.indexOf(selectedRound);

  const matchesQuery = useRoundMatches(current?.seasonId, selectedRound);
  const matches = matchesQuery.data ?? [];
  const predictionsQuery = useMyPredictions(matches.map((match) => match.id));
  const predictions = predictionsQuery.data ?? [];

  const isLoading =
    roundQuery.isLoading ||
    matchesQuery.isLoading ||
    (matches.length > 0 && predictionsQuery.isLoading);
  const loadError = roundQuery.error ?? matchesQuery.error ?? predictionsQuery.error;

  const predictionByMatch = new Map(predictions.map((p) => [p.matchId, p]));
  const points = predictions.reduce((sum, p) => sum + (p.points ?? 0), 0);
  // İçinde bulunulan haftada önce tahmin yapılabilen maçlar; diğer haftalarda takvim sırası.
  const orderedMatches = isCurrentRound
    ? sortMatchesForHome(matches, now)
    : [...matches].sort((a, b) => a.kickoffAt.localeCompare(b.kickoffAt));
  const kickoffs = matches.map((match) => match.kickoffAt).sort();

  const goToIndex = (index: number) => {
    const round = rounds[index];
    if (round !== undefined) setPickedRound(round);
  };

  const refresh = async () => {
    setRefreshing(true);
    await Promise.all([
      roundQuery.refetch(),
      roundsQuery.refetch(),
      matchesQuery.refetch(),
      predictionsQuery.refetch(),
    ]);
    setRefreshing(false);
  };

  return (
    <Screen
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />
      }>
      <Text className="text-3xl font-extrabold text-ink">Süper Lig</Text>
      <Text className="mt-1 text-sm font-medium text-muted">
        {current ? `${current.seasonName} sezonu` : ' '}
      </Text>

      {current && selectedRound !== undefined ? (
        <View className="mt-5">
          <WeekCard
            round={selectedRound}
            dateRange={
              kickoffs.length > 0
                ? formatDateRange(kickoffs[0], kickoffs[kickoffs.length - 1])
                : undefined
            }
            isCurrent={isCurrentRound}
            canGoPrev={roundIndex > 0}
            canGoNext={roundIndex >= 0 && roundIndex < rounds.length - 1}
            onPrev={() => goToIndex(roundIndex - 1)}
            onNext={() => goToIndex(roundIndex + 1)}
            onOpenPicker={() => setPickerOpen(true)}
            points={points}
            predicted={predictions.length}
            total={matches.length}
            note={matches.length > 0 ? roundNote(matches, predictions, now) : ' '}
          />
        </View>
      ) : null}

      {isLoading ? (
        <View className="items-center py-16">
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : loadError ? (
        <View className="mt-4 items-center gap-3 rounded-3xl border border-border bg-surface p-6">
          <Text className="text-center text-sm text-muted">Maçlar yüklenemedi.</Text>
          <Button label="Tekrar dene" variant="secondary" onPress={refresh} />
        </View>
      ) : !current || matches.length === 0 ? (
        <View className="mt-4 items-center gap-2 rounded-3xl border border-border bg-surface p-6">
          <Icon name="ball" size={28} color={colors.muted} />
          <Text className="text-center text-sm text-muted">Bu hafta için henüz maç yok.</Text>
        </View>
      ) : (
        <View className="mt-4 gap-3">
          {orderedMatches.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              prediction={predictionByMatch.get(match.id)}
              now={now}
            />
          ))}
        </View>
      )}

      {current && selectedRound !== undefined ? (
        <WeekPickerSheet
          visible={pickerOpen}
          rounds={rounds}
          selected={selectedRound}
          current={current.round}
          onSelect={setPickedRound}
          onClose={() => setPickerOpen(false)}
        />
      ) : null}
    </Screen>
  );
}

/** Hafta kartının altındaki açıklama: haftanın durumuna göre. */
function roundNote(matches: Match[], predictions: Prediction[], now: number): string {
  const predictedIds = new Set(predictions.map((p) => p.matchId));
  const openMatches = matches.filter((match) => getMatchPhase(match, now) === 'open');
  const waiting = openMatches.filter((match) => !predictedIds.has(match.id)).length;

  if (waiting > 0) return `${waiting} maç tahminini bekliyor.`;
  if (openMatches.length > 0) return 'Açık maçların hepsine tahmin yaptın.';
  return predictions.length === 0
    ? 'Bu haftaya tahmin yapmadın.'
    : `${matches.length} maçın ${predictions.length} tanesine tahmin yaptın.`;
}
