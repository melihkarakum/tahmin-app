import { type ReactNode, useState } from 'react';
import { View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { PressableOpacity } from '@/components/ui/pressable-opacity';
import { Text } from '@/components/ui/text';
import { colors, tabularNums } from '@/constants/theme';
import { PointsChip } from '@/features/matches/components/points-chip';
import { PredictionButton, type PredictionButtonState } from '@/features/matches/components/prediction-button';
import { ScoreStepper } from '@/features/matches/components/score-stepper';
import { TeamCrest } from '@/features/matches/components/team-crest';
import { getMatchPhase, type MatchPhase } from '@/features/matches/phase';
import { toPredictionShortMessage, useSavePrediction } from '@/features/matches/queries';
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
  // Kullanıcı skoru değiştirince taslak oluşur; kaydedilince taslak silinir ve kayıtlı tahmin görünür.
  const [draft, setDraft] = useState<{ home: number; away: number } | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);

  const phase = getMatchPhase(match, now);
  const msLeft = new Date(match.kickoffAt).getTime() - now;

  const homeGoals = draft?.home ?? prediction?.homeGoals ?? 0;
  const awayGoals = draft?.away ?? prediction?.awayGoals ?? 0;
  const isDirty =
    draft !== null &&
    (prediction === undefined || draft.home !== prediction.homeGoals || draft.away !== prediction.awayGoals);

  const buttonState: PredictionButtonState = savePrediction.isPending
    ? 'saving'
    : errorText
      ? 'error'
      : prediction === undefined
        ? 'new'
        : isDirty
          ? 'dirty'
          : 'saved';

  const change = (home: number, away: number) => {
    setErrorText(null);
    setDraft({ home, away });
  };

  const save = () => {
    setErrorText(null);
    savePrediction.mutate(
      { matchId: match.id, homeGoals, awayGoals },
      {
        onSuccess: () => {
          haptics.success();
          setDraft(null);
          void maybeOfferPush();
        },
        onError: (saveError) => {
          haptics.warning();
          setErrorText(toPredictionShortMessage(saveError));
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

      {phase === 'open' ? (
        // Açık maçta skor paneli ve düğme hep görünür: durum değişince kart büyüyüp küçülmez.
        <View className="mt-5">
          {/* Ortadaki ayraç dar tutulur; düğmeler en dar telefonda (375 px) bile yan yana sığar. */}
          <View className="rounded-2xl bg-surface-muted px-3 pb-4 pt-3">
            <Text className="text-center text-[10px] font-bold tracking-widest text-muted">
              {trUpper('Skor tahminin')}
            </Text>
            <ResetScoreButton
              visible={homeGoals !== 0 || awayGoals !== 0}
              onPress={() => {
                haptics.selection();
                change(0, 0);
              }}
            />
            <View className="mt-3 flex-row items-center">
              <View className="flex-1 items-center">
                <ScoreStepper
                  value={homeGoals}
                  onChange={(value) => change(value, awayGoals)}
                  teamName={match.home.name}
                />
              </View>
              <Text className="w-6 text-center text-xl font-bold text-muted">-</Text>
              <View className="flex-1 items-center">
                <ScoreStepper
                  value={awayGoals}
                  onChange={(value) => change(homeGoals, value)}
                  teamName={match.away.name}
                />
              </View>
            </View>
          </View>
          <View className="mt-3">
            <PredictionButton
              state={buttonState}
              savedTime={prediction ? formatTime(prediction.updatedAt) : undefined}
              errorText={errorText ?? undefined}
              onPress={save}
            />
          </View>
        </View>
      ) : (
        <PredictionStrip phase={phase} prediction={prediction} />
      )}
    </View>
  );
}

/**
 * Skoru tek dokunuşla 0-0'a döndürür. Panelin köşesine sabitlenir; görünüp kaybolması
 * hiçbir şeyi kaydırmaz (yalnızca opaklık değişir).
 */
function ResetScoreButton({ visible, onPress }: { visible: boolean; onPress: () => void }) {
  return (
    <View style={{ position: 'absolute', top: 6, right: 6, opacity: visible ? 1 : 0, pointerEvents: visible ? 'auto' : 'none' }}>
      <PressableOpacity onPress={onPress} disabled={!visible} hitSlop={8} accessibilityLabel="Skoru 0-0 yap">
        <View className="flex-row items-center gap-1 rounded-full bg-surface px-2.5 py-1">
          <Icon name="reset" size={11} color={colors.muted} />
          <Text className="text-[11px] font-bold text-muted">Sıfırla</Text>
        </View>
      </PressableOpacity>
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

function PredictionStrip({ phase, prediction }: { phase: MatchPhase; prediction?: Prediction }) {
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
