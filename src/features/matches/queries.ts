import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/features/auth/auth-provider';
import { supabase } from '@/lib/supabase';
import type { Match, MatchStatus, Prediction, ResultType } from '@/types/domain';

const MATCH_COLUMNS =
  'id, round, kickoff_at, status, home_score, away_score, provider, home:teams!matches_home_team_id_fkey(id, name, short_name), away:teams!matches_away_team_id_fkey(id, name, short_name)';

/** Güncel sezon ve hafta (sunucudaki current_round fonksiyonu belirler). */
export function useCurrentRound() {
  return useQuery({
    queryKey: ['current-round'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('current_round');
      if (error) throw error;
      const first = data[0];
      if (!first || first.round === null) return null;
      return { seasonId: first.season_id, seasonName: first.season_name, round: first.round };
    },
  });
}

export function useRoundMatches(seasonId: number | undefined, round: number | undefined) {
  return useQuery({
    queryKey: ['matches', seasonId, round],
    enabled: seasonId !== undefined && round !== undefined,
    queryFn: async (): Promise<Match[]> => {
      const { data, error } = await supabase
        .from('matches')
        .select(MATCH_COLUMNS)
        .eq('season_id', seasonId as number)
        .eq('round', round as number)
        .order('kickoff_at');
      if (error) throw error;

      return data.map((row) => ({
        id: row.id,
        round: row.round,
        kickoffAt: row.kickoff_at,
        status: row.status as MatchStatus,
        homeScore: row.home_score,
        awayScore: row.away_score,
        isTest: row.provider === 'test',
        home: { id: row.home.id, name: row.home.name, shortName: row.home.short_name },
        away: { id: row.away.id, name: row.away.name, shortName: row.away.short_name },
      }));
    },
  });
}

/** Giriş yapan kullanıcının verilen maçlara yaptığı tahminler. */
export function useMyPredictions(matchIds: number[]) {
  const { session } = useAuth();
  const userId = session?.user.id;

  return useQuery({
    queryKey: ['my-predictions', userId, matchIds],
    enabled: userId !== undefined && matchIds.length > 0,
    queryFn: async (): Promise<Prediction[]> => {
      const { data, error } = await supabase
        .from('predictions')
        .select('match_id, home_goals, away_goals, points, result_type, updated_at')
        .eq('user_id', userId as string)
        .in('match_id', matchIds);
      if (error) throw error;

      return data.map((row) => ({
        matchId: row.match_id,
        homeGoals: row.home_goals,
        awayGoals: row.away_goals,
        points: row.points,
        resultType: row.result_type as ResultType | null,
        updatedAt: row.updated_at,
      }));
    },
  });
}

type SavePredictionInput = { matchId: number; homeGoals: number; awayGoals: number };

/** Tahmini sunucudaki save_prediction fonksiyonuyla kaydeder; maç başladıysa sunucu reddeder. */
export function useSavePrediction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ matchId, homeGoals, awayGoals }: SavePredictionInput) => {
      const { data, error } = await supabase.rpc('save_prediction', {
        p_match_id: matchId,
        p_home_goals: homeGoals,
        p_away_goals: awayGoals,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-predictions'] }),
  });
}

export function toPredictionMessage(error: unknown): string {
  const message =
    typeof error === 'object' && error !== null && 'message' in error
      ? String((error as { message: unknown }).message)
      : '';

  if (message.includes('tahmin süresi doldu')) return 'Maç başladı, bu maç için tahmin kapandı.';
  if (message.includes('tahmin yapılamaz')) return 'Bu hesapla tahmin yapılamaz.';
  if (message.includes('fetch') || message.includes('Network')) {
    return 'Sunucuya bağlanılamadı. İnternet bağlantını kontrol et.';
  }
  return 'Tahmin kaydedilemedi. Tekrar dene.';
}
