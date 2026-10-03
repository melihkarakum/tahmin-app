import { type ReactNode, useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { PressableOpacity } from '@/components/ui/pressable-opacity';
import { colors, tabularNums } from '@/constants/theme';
import { PointsChip } from '@/features/matches/components/points-chip';
import { ScoreStepper } from '@/features/matches/components/score-stepper';
import { TeamBadge } from '@/features/matches/components/team-badge';
import { getMatchPhase, type MatchPhase } from '@/features/matches/phase';
import { formatCountdown, formatKickoff, resultLabels } from '@/lib/format';
import type { Match, Prediction, Team } from '@/types/domain';

type MatchCardProps = {
  match: Match;
  prediction?: Prediction;
  now: number;
  onSave: (matchId: string, homeGoals: number, awayGoals: number) => void;
};

export function MatchCard({ match, prediction, now, onSave }: MatchCardProps) {
  const [homeGoals, setHomeGoals] = useState(prediction?.homeGoals ?? 0);
  const [awayGoals, setAwayGoals] = useState(prediction?.awayGoals ?? 0);
  const [editing, setEditing] = useState(prediction === undefined);

  const phase = getMatchPhase(match, now);
  const isEditing = phase === 'open' && editing;
  const msLeft = new Date(match.kickoffAt).getTime() - now;

  const save = () => {
    onSave(match.id, homeGoals, awayGoals);
    setEditing(false);
  };

  // Biten maçta gerçek skor, diğer durumlarda kullanıcının tahmini gösterilir.
  const homeValue = phase === 'finished' ? match.homeScore : prediction?.homeGoals;
  const awayValue = phase === 'finished' ? match.awayScore : prediction?.awayGoals;

  return (
    <View className="rounded-2xl border border-border bg-surface p-4">
      <View className="mb-2 flex-row items-center justify-between">
        <Text className="text-xs font-medium text-muted">{formatKickoff(match.kickoffAt)}</Text>
        <StatusPill phase={phase} msLeft={msLeft} />
      </View>

      <TeamRow team={match.home}>
        {isEditing ? (
          <ScoreStepper value={homeGoals} onChange={setHomeGoals} teamName={match.home.name} />
        ) : (
          <ScoreValue value={homeValue} muted={phase === 'locked'} />
        )}
      </TeamRow>
      <TeamRow team={match.away}>
        {isEditing ? (
          <ScoreStepper value={awayGoals} onChange={setAwayGoals} teamName={match.away.name} />
        ) : (
          <ScoreValue value={awayValue} muted={phase === 'locked'} />
        )}
      </TeamRow>

      <View className="mt-3 border-t border-border pt-3">
        {isEditing ? (
          <Button label={prediction ? 'Tahmini Güncelle' : 'Tahmini Kaydet'} onPress={save} />
        ) : null}

        {phase === 'open' && !editing ? (
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <Icon name="check" size={16} color={colors.primary} />
              <Text className="text-sm font-medium text-ink">Tahminin kaydedildi</Text>
            </View>
            <PressableOpacity onPress={() => setEditing(true)} hitSlop={10}>
              <Text className="text-sm font-semibold text-primary">Değiştir</Text>
            </PressableOpacity>
          </View>
        ) : null}

        {phase === 'locked' ? (
          <Text className="text-sm text-muted">
            {prediction ? 'Maç başladı, tahminin kilitlendi.' : 'Bu maça tahmin yapmadın.'}
          </Text>
        ) : null}

        {phase === 'finished' ? <FinishedFooter prediction={prediction} /> : null}
      </View>
    </View>
  );
}

function TeamRow({ team, children }: { team: Team; children: ReactNode }) {
  return (
    <View className="h-12 flex-row items-center justify-between">
      <View className="flex-1 flex-row items-center gap-3">
        <TeamBadge shortName={team.shortName} />
        <Text className="flex-1 text-base font-semibold text-ink" numberOfLines={1}>
          {team.name}
        </Text>
      </View>
      {children}
    </View>
  );
}

function ScoreValue({ value, muted }: { value: number | null | undefined; muted: boolean }) {
  return (
    <Text
      className={
        muted
          ? 'w-11 text-center text-2xl font-bold text-muted'
          : 'w-11 text-center text-2xl font-bold text-ink'
      }
      style={tabularNums}>
      {value ?? '–'}
    </Text>
  );
}

function StatusPill({ phase, msLeft }: { phase: MatchPhase; msLeft: number }) {
  if (phase === 'open') {
    return (
      <View className="rounded-full bg-primary-soft px-2.5 py-1">
        <Text className="text-xs font-semibold text-primary">{formatCountdown(msLeft)} kaldı</Text>
      </View>
    );
  }

  if (phase === 'locked') {
    return (
      <View className="flex-row items-center gap-1 rounded-full bg-surface-muted px-2.5 py-1">
        <Icon name="lock" size={11} color={colors.muted} />
        <Text className="text-xs font-semibold text-muted">Tahmin kapandı</Text>
      </View>
    );
  }

  return (
    <View className="rounded-full bg-surface-muted px-2.5 py-1">
      <Text className="text-xs font-semibold text-muted">Maç bitti</Text>
    </View>
  );
}

function FinishedFooter({ prediction }: { prediction?: Prediction }) {
  if (!prediction || prediction.points === null || prediction.resultType === null) {
    return <Text className="text-sm text-muted">Bu maça tahmin yapmadın.</Text>;
  }

  return (
    <View className="flex-row items-center justify-between">
      <View>
        <Text className="text-sm font-medium text-ink" style={tabularNums}>
          Tahminin {prediction.homeGoals} – {prediction.awayGoals}
        </Text>
        <Text className="mt-0.5 text-xs text-muted">{resultLabels[prediction.resultType]}</Text>
      </View>
      <PointsChip points={prediction.points} resultType={prediction.resultType} />
    </View>
  );
}
