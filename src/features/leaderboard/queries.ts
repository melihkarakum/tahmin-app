import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/features/auth/auth-provider';
import { supabase } from '@/lib/supabase';
import type { LeaderboardRow, LeaderboardScope } from '@/types/domain';

export const NATIONAL_LIST_SIZE = 50;

export type NationalLeaderboard = {
  /** İlk N kişi. */
  top: LeaderboardRow[];
  /** Kullanıcının kendi satırı; henüz puanlanmış tahmini yoksa null. */
  me: LeaderboardRow | null;
  /** Sıralamadaki toplam kişi sayısı. */
  totalCount: number;
};

/** Türkiye geneli sıralama: "week" seçiliyse verilen hafta, "season" ise sezonun tamamı. */
export function useNationalLeaderboard(
  scope: LeaderboardScope,
  round: number | undefined,
  limit: number = NATIONAL_LIST_SIZE,
) {
  const { session } = useAuth();
  const userId = session?.user.id;

  return useQuery({
    queryKey: ['national-leaderboard', userId, scope, scope === 'week' ? round : null, limit],
    enabled: userId !== undefined && (scope === 'season' || round !== undefined),
    queryFn: async (): Promise<NationalLeaderboard> => {
      const { data, error } = await supabase.rpc('get_national_leaderboard', {
        p_round: scope === 'week' ? round : undefined,
        p_limit: limit,
      });
      if (error) throw error;

      const rows: LeaderboardRow[] = data.map((row) => ({
        userId: row.user_id,
        displayName: row.display_name,
        rank: row.rank,
        points: row.points,
        exactCount: row.exact_count,
        isMe: row.is_me,
      }));

      return {
        top: rows.filter((row) => row.rank <= limit),
        me: rows.find((row) => row.isMe) ?? null,
        totalCount: data[0]?.total_count ?? 0,
      };
    },
  });
}
