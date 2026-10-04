import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/features/auth/auth-provider';
import { supabase } from '@/lib/supabase';
import { teamLogoUrl } from '@/lib/team-logo';
import type { HistoryItem, MatchStatus, ProfileStats, ResultType } from '@/types/domain';

/** Güncel sezon istatistikleri ve Türkiye sırası. */
export function useMyStats() {
  const { session } = useAuth();
  const userId = session?.user.id;

  return useQuery({
    queryKey: ['my-stats', userId],
    enabled: userId !== undefined,
    queryFn: async (): Promise<ProfileStats> => {
      const { data, error } = await supabase.rpc('get_my_stats');
      if (error) throw error;
      const row = data[0];
      return {
        seasonPoints: row?.season_points ?? 0,
        predictionCount: row?.prediction_count ?? 0,
        scoredCount: row?.scored_count ?? 0,
        exactCount: row?.exact_count ?? 0,
        outcomeCount: row?.outcome_count ?? 0,
        accuracyPercent: row?.accuracy_percent ?? null,
        lastFiveRoundsPoints: row?.last_five_rounds_points ?? 0,
        seasonRank: row?.season_rank ?? null,
        seasonTotal: row?.season_total ?? null,
      };
    },
  });
}

/** Profil, "Skor Tahminlerim" ve paylaşma ekranı aynı listeyi kullanır (sunucu sınırı 200). */
export const HISTORY_LIMIT = 200;

/** Kullanıcının tahmin geçmişi, en yeni maç önce. */
export function usePredictionHistory(limit: number = HISTORY_LIMIT) {
  const { session } = useAuth();
  const userId = session?.user.id;

  return useQuery({
    queryKey: ['prediction-history', userId, limit],
    enabled: userId !== undefined,
    queryFn: async (): Promise<HistoryItem[]> => {
      const { data, error } = await supabase.rpc('get_my_prediction_history', { p_limit: limit });
      if (error) throw error;
      return data.map((row) => ({
        matchId: row.match_id,
        round: row.round,
        kickoffAt: row.kickoff_at,
        status: row.status as MatchStatus,
        home: {
          id: 0,
          name: row.home_team_name,
          shortName: row.home_team_short,
          logoUrl: teamLogoUrl(row.home_team_logo),
        },
        away: {
          id: 0,
          name: row.away_team_name,
          shortName: row.away_team_short,
          logoUrl: teamLogoUrl(row.away_team_logo),
        },
        homeScore: row.home_score,
        awayScore: row.away_score,
        predictedHome: row.predicted_home,
        predictedAway: row.predicted_away,
        points: row.points,
        resultType: row.result_type as ResultType | null,
        predictedAt: row.predicted_at,
      }));
    },
  });
}

/** Görünen adı değiştirir (yalnızca kendi profili; kural sunucuda, RLS). */
export function useUpdateDisplayName() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const userId = session?.user.id;

  return useMutation({
    mutationFn: async (displayName: string) => {
      const { error } = await supabase
        .from('profiles')
        .update({ display_name: displayName.trim() })
        .eq('id', userId as string);
      if (error) throw error;
    },
    // Ad sıralamalarda ve odalarda da görünür: hepsi yenilenir.
    onSuccess: () => queryClient.invalidateQueries(),
  });
}

/**
 * Hesabı siler: giriş bilgileri silinir, profil anonimleşir (sunucudaki delete_my_account).
 * Ardından cihazdaki oturum temizlenir; giriş ekranına dönülür.
 */
export function useDeleteAccount() {
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('delete_my_account');
      if (error) throw error;
      // Kullanıcı sunucuda artık yok; yalnızca cihazdaki oturumu temizlemek yeterli.
      await supabase.auth.signOut({ scope: 'local' });
    },
  });
}
