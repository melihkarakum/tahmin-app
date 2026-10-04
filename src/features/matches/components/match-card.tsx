import { type ReactNode, useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { PressableOpacity } from '@/components/ui/pressable-opacity';
import { Text } from '@/components/ui/text';
import { colors, tabularNums } from '@/constants/theme';
import { PointsChip } from '@/features/matches/components/points-chip';
import { ScoreStepper } from '@/features/matches/components/score-stepper';
import { TeamCrest } from '@/features/matches/components/team-crest';
import { getMatchPhase, type MatchPhase } from '@/features/matches/phase';
import { toPredictionMessage, useSavePrediction } from '@/features/matches/queries';
import { maybeOfferPush } from '@/features/notifications/push';
import { haptics } from '@/lib/haptics';
import { formatCountdown, formatDay, formatTime, resultLabels } from '@/lib/format';
import { trUpper } from '@/lib/text';
import type { Match, Prediction, Team } from '@/types/domain';

type MatchCardProps = {
  match: Match;
  prediction?: Prediction;
  now: number;
};

export function MatchCard({ match, prediction, now }: MatchCardProps) {
  const savePrediction = useSavePrediction();
  const [homeGoals, setHomeGoals] = useState(prediction?.homeGoals ?? 0);
  const [awayGoals, setAwayGoals] = useState(prediction?.awayGoals ?? 0);
  const [editing, setEditing] = useState(prediction === undefined);
  const [error, setError] = useState<string | null>(null);

  const phase = getMatchPhase(match, now);
  const isEditing = phase === 'open' && editing;
  const msLeft = new Date(match.kickoffAt).getTime() - now;

  const save = () => {
    setError(null);
    savePrediction.mutate(
      { matchId: match.id, homeGoals, awayGoals },
      {
        onSuccess: () => {
          haptics.success();
          setEditing(false);
          void maybeOfferPush();
        },
        onError: (saveError) => {
          haptics.warning();
          setError(toPredictionMessage(saveError));
        },
      },
    );
  };

  return (
    <View className="rounded-3xl border border-border bg-surface p-4">
      <View className="flex-row items-center justify-between">
        <Text className="text-xs font-semibold tracking-wider text-muted">
          {trUpper(formatDay(match.kickoffAt))}
        </Text>
        <View className="flex-row items-center gap-2">
          {match.isTest ? (
            <View className="rounded-full border border-border px-2 py-0.5">
              <Text className="text-[10px] font-bold tracking-wider text-muted">{trUpper('Test')}</Text>
            </View>
          ) : null}
          <StatusPill phase={phase} match={match} msLeft={msLeft} />
        </View>
      </View>

      <View className="mt-4 flex-row items-center">
        <TeamSide team={match.home} />
        <View className="w-24 items-center">
          {phase === 'finished' ? (
            <Text className="text-3xl font-black text-ink" style={tabularNums}>
              {match.homeScore} - {match.awayScore}
            </Text>
          ) : (
            <Text className="text-2xl font-black text-ink" style={tabularNums}>
              {formatTime(match.kickoffAt)}
            </Text>
          )}
        </View>
        <TeamSide team={match.away} />
      </View>

      {isEditing ? (
        <View className="mt-5">
          {/* Ortadaki ayraç dar tutulur; düğmeler en dar telefonda (375 px) bile yan yana sığar. */}
          <View className="rounded-2xl bg-surface-muted px-3 pb-4 pt-3">
            <Text className="text-center text-[10px] font-bold tracking-widest text-muted">
              {trUpper('Skor tahminin')}
            </Text>
            <View className="mt-3 flex-row items-center">
              <View className="flex-1 items-center">
                <ScoreStepper value={homeGoals} onChange={setHomeGoals} teamName={match.home.name} />
              </View>
              <Text className="w-6 text-center text-xl font-bold text-muted">-</Text>
              <View className="flex-1 items-center">
                <ScoreStepper value={awayGoals} onChange={setAwayGoals} teamName={match.away.name} />
              </View>
            </View>
          </View>
          {error ? <Text className="mt-3 text-center text-sm text-danger">{error}</Text> : null}
          <Button
            label={
              savePrediction.isPending
                ? 'Kaydediliyor…'
                : prediction
                  ? 'Tahmini Güncelle'
                  : 'Tahmini Kaydet'
            }
            onPress={save}
            disabled={savePrediction.isPending}
            style={{ marginTop: 14 }}
          />
        </View>
      ) : (
        <PredictionStrip phase={phase} prediction={prediction} onEdit={() => setEditing(true)} />
      )}
    </View>
  );
}

function TeamSide({ team }: { team: Team }) {
  return (
    <View className="flex-1 items-center">
      <TeamCrest name={team.name} shortName={team.shortName} logoUrl={team.logoUrl} />
      <Text className="mt-2 text-center text-sm font-bold text-ink" numberOfLines={1}>
        {team.name}
      </Text>
    </View>
  );
}

function StatusPill({ phase, match, msLeft }: { phase: MatchPhase; match: Match; msLeft: number }) {
  if (phase === 'open') {
    return (
      <View className="flex-row items-center gap-1 rounded-full bg-primary-soft px-2.5 py-1">
        <Icon name="clock" size={11} color={colors.primary} />
        <Text className="text-xs font-bold text-primary">{formatCountdown(msLeft)}</Text>
      </View>
    );
  }

  if (phase === 'locked' && match.status === 'live') {
    return (
      <View className="flex-row items-center gap-1.5 rounded-full bg-surface-muted px-2.5 py-1">
        <View className="h-2 w-2 rounded-full bg-live" />
        <Text className="text-xs font-black tracking-wider text-live">{trUpper('Canlı')}</Text>
      </View>
    );
  }

  const label =
    phase === 'finished'
      ? 'MS'
      : phase === 'off'
        ? match.status === 'postponed'
          ? 'Ertelendi'
          : 'İptal'
        : 'Kapandı';

  return (
    <View className="rounded-full bg-surface-muted px-2.5 py-1">
      <Text className="text-xs font-bold tracking-wider text-muted">{trUpper(label)}</Text>
    </View>
  );
}

function StripLayout({ left, right }: { left: ReactNode; right: ReactNode }) {
  return (
    <View className="mt-4 flex-row items-center justify-between rounded-2xl bg-surface-muted px-4 py-3">
      <View className="flex-1 pr-3">{left}</View>
      {right}
    </View>
  );
}

function PredictionValue({ prediction }: { prediction?: Prediction }) {
  return (
    <View>
      <Text className="text-[10px] font-bold tracking-wider text-muted">{trUpper('Tahminin')}</Text>
      {prediction ? (
        <Text className="mt-0.5 text-lg font-black text-ink" style={tabularNums}>
          {prediction.homeGoals} - {prediction.awayGoals}
        </Text>
      ) : (
        <Text className="mt-0.5 text-sm font-semibold text-muted">Tahmin yapmadın</Text>
      )}
    </View>
  );
}

function PredictionStrip({
  phase,
  prediction,
  onEdit,
}: {
  phase: MatchPhase;
  prediction?: Prediction;
  onEdit: () => void;
}) {
  if (phase === 'open') {
    return (
      <StripLayout
        left={
          <View>
            <PredictionValue prediction={prediction} />
            {prediction ? (
              <Text className="mt-0.5 text-xs text-muted">
                {formatTime(prediction.updatedAt)} itibarıyla kayıtlı
              </Text>
            ) : null}
          </View>
        }
        right={
          <PressableOpacity onPress={onEdit} hitSlop={10}>
            <Text className="text-sm font-bold text-primary">Değiştir</Text>
          </PressableOpacity>
        }
      />
    );
  }

  if (phase === 'finished') {
    const scored = prediction && prediction.points !== null && prediction.resultType !== null;
    return (
      <StripLayout
        left={
          <View>
            <PredictionValue prediction={prediction} />
            {scored && prediction.resultType ? (
              <Text className="mt-0.5 text-xs text-muted">{resultLabels[prediction.resultType]}</Text>
            ) : null}
          </View>
        }
        right={
          scored && prediction.points !== null && prediction.resultType ? (
            <PointsChip points={prediction.points} resultType={prediction.resultType} />
          ) : prediction ? (
            <Text className="text-xs font-semibold text-muted">Puan hesaplanıyor</Text>
          ) : null
        }
      />
    );
  }

  return (
    <StripLayout
      left={<PredictionValue prediction={prediction} />}
      right={
        <View className="flex-row items-center gap-1">
          <Icon name="lock" size={12} color={colors.muted} />
          <Text className="text-xs font-semibold text-muted">
            {phase === 'off' ? 'Tahmine kapalı' : 'Kilitlendi'}
          </Text>
        </View>
      }
    />
  );
}
