import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/features/auth/auth-provider';
import { supabase } from '@/lib/supabase';
import type { LeaderboardRow, LeaderboardScope } from '@/types/domain';

export type MyRoom = {
  id: string;
  name: string;
  code: string;
  isOwner: boolean;
  memberCount: number;
  myRank: number | null;
  leaderName: string | null;
  leaderPoints: number | null;
};

/** Kullanıcının üyesi olduğu odalar: üye sayısı, sezon sırası ve lider. */
export function useMyRooms() {
  const { session } = useAuth();
  const userId = session?.user.id;

  return useQuery({
    queryKey: ['my-rooms', userId],
    enabled: userId !== undefined,
    queryFn: async (): Promise<MyRoom[]> => {
      const { data, error } = await supabase.rpc('get_my_rooms');
      if (error) throw error;
      return data.map((row) => ({
        id: row.id,
        name: row.name,
        code: row.code,
        isOwner: row.is_owner,
        memberCount: row.member_count,
        myRank: row.my_rank,
        leaderName: row.leader_name,
        leaderPoints: row.leader_points,
      }));
    },
  });
}

/** Oda bilgisi. Üye değilsen ya da oda silindiyse null döner. */
export function useRoom(roomId: string) {
  return useQuery({
    queryKey: ['room', roomId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rooms')
        .select('id, name, code, owner_id')
        .eq('id', roomId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

/** Oda sıralaması: "week" seçiliyse verilen hafta, "season" ise sezonun tamamı. */
export function useRoomLeaderboard(roomId: string, scope: LeaderboardScope, round: number | undefined) {
  const { session } = useAuth();
  const userId = session?.user.id;

  return useQuery({
    queryKey: ['room-leaderboard', roomId, scope, scope === 'week' ? round : null],
    enabled: scope === 'season' || round !== undefined,
    queryFn: async (): Promise<LeaderboardRow[]> => {
      const { data, error } = await supabase.rpc('get_room_leaderboard', {
        p_room_id: roomId,
        p_round: scope === 'week' ? round : undefined,
      });
      if (error) throw error;
      return data.map((row) => ({
        userId: row.user_id,
        displayName: row.display_name,
        rank: row.rank,
        points: row.points,
        exactCount: row.exact_count,
        isMe: row.user_id === userId,
      }));
    },
  });
}

export function useCreateRoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase.rpc('create_room', { p_name: name });
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-rooms'] }),
  });
}

export type JoinStatus =
  | 'joined'
  | 'already_member'
  | 'not_found'
  | 'room_full'
  | 'too_many_rooms'
  | 'rate_limited';

export function useJoinRoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (code: string) => {
      const { data, error } = await supabase.rpc('join_room', { p_code: code });
      if (error) throw error;
      const result = data[0];
      return { status: result.status as JoinStatus, roomId: result.room_id };
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-rooms'] }),
  });
}

/** Odadan ayrılma (kendisi) ya da üye çıkarma (oda sahibi). Kurallar sunucuda (RLS). */
export function useRemoveMember(roomId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('room_members')
        .delete()
        .eq('room_id', roomId)
        .eq('user_id', userId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries(),
  });
}

/** Odayı siler (yalnızca oda sahibi; kural sunucuda). */
export function useDeleteRoom(roomId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('rooms').delete().eq('id', roomId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-rooms'] }),
  });
}

export const joinStatusMessages: Record<Exclude<JoinStatus, 'joined' | 'already_member'>, string> = {
  not_found: 'Bu kodla bir oda bulunamadı. Kodu kontrol et.',
  room_full: 'Bu oda dolu (en fazla 50 kişi).',
  too_many_rooms: 'En fazla 20 odada bulunabilirsin.',
  rate_limited: 'Çok fazla yanlış deneme yaptın. 15 dakika sonra tekrar dene.',
};

export function toRoomMessage(error: unknown): string {
  const message =
    typeof error === 'object' && error !== null && 'message' in error
      ? String((error as { message: unknown }).message)
      : '';

  if (message.includes('2-40 karakter')) return 'Oda adı 2-40 karakter olmalı.';
  if (message.includes('En fazla 10 oda')) return 'En fazla 10 oda kurabilirsin.';
  if (message.includes('En fazla 20 odada')) return 'En fazla 20 odada bulunabilirsin.';
  if (message.includes('fetch') || message.includes('Network')) {
    return 'Sunucuya bağlanılamadı. İnternet bağlantını kontrol et.';
  }
  return 'İşlem tamamlanamadı. Tekrar dene.';
}
