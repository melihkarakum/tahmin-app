import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Linking, RefreshControl, Share, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Text } from '@/components/ui/text';
import { colors } from '@/constants/theme';
import { useAuth } from '@/features/auth/auth-provider';
import { RankRow } from '@/features/leaderboard/components/rank-row';
import { useCurrentRound } from '@/features/matches/queries';
import {
  toRoomMessage,
  useDeleteRoom,
  useRemoveMember,
  useRoom,
  useRoomLeaderboard,
} from '@/features/rooms/queries';
import { inviteMessage, whatsappShareUrl } from '@/lib/invite';
import { trUpper } from '@/lib/text';
import type { LeaderboardRow, LeaderboardScope } from '@/types/domain';

const scopeOptions: { value: LeaderboardScope; label: string }[] = [
  { value: 'week', label: 'Bu Hafta' },
  { value: 'season', label: 'Sezon' },
];

export default function RoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { session } = useAuth();
  const myId = session?.user.id;
  const [scope, setScope] = useState<LeaderboardScope>('week');
  const [refreshing, setRefreshing] = useState(false);

  const roomQuery = useRoom(id);
  const room = roomQuery.data;
  const { data: current } = useCurrentRound();
  const leaderboardQuery = useRoomLeaderboard(id, scope, current?.round);
  const rows = leaderboardQuery.data ?? [];
  const removeMember = useRemoveMember(id);
  const deleteRoom = useDeleteRoom(id);

  const isOwner = room !== null && room !== undefined && room.owner_id === myId;

  const refresh = async () => {
    setRefreshing(true);
    await Promise.all([roomQuery.refetch(), leaderboardQuery.refetch()]);
    setRefreshing(false);
  };

  if (roomQuery.isLoading) {
    return (
      <Screen topInset={false}>
        <View className="items-center py-16">
          <ActivityIndicator color={colors.primary} />
        </View>
      </Screen>
    );
  }

  if (!room) {
    return (
      <Screen topInset={false}>
        <View className="items-center gap-3 rounded-3xl border border-border bg-surface p-6">
          <Text className="text-center text-sm text-muted">
            Oda bulunamadı. Silinmiş ya da artık üyesi olmayabilirsin.
          </Text>
          <Button label="Odalara dön" variant="secondary" onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  const message = inviteMessage(room.name, room.code);

  // WhatsApp yoksa telefonun paylaşma penceresi açılır.
  const inviteWhatsApp = () => {
    Linking.openURL(whatsappShareUrl(message)).catch(() => Share.share({ message }));
  };

  const inviteOther = () => {
    Share.share({ message });
  };

  const showError = (error: unknown) => Alert.alert('İşlem tamamlanamadı', toRoomMessage(error));

  const confirmRemove = (row: LeaderboardRow) => {
    Alert.alert(row.displayName, 'Bu üyeyi odadan çıkarmak istiyor musun?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Odadan çıkar',
        style: 'destructive',
        onPress: () => removeMember.mutate(row.userId, { onError: showError }),
      },
    ]);
  };

  const confirmLeave = () => {
    if (!myId) return;
    Alert.alert('Odadan ayrıl', `${room.name} odasından ayrılmak istiyor musun?`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Ayrıl',
        style: 'destructive',
        onPress: () =>
          removeMember.mutate(myId, { onSuccess: () => router.back(), onError: showError }),
      },
    ]);
  };

  const confirmDelete = () => {
    Alert.alert(
      'Odayı sil',
      `${room.name} odası tüm üyeler için silinecek. Tahminler ve puanlar silinmez. Emin misin?`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Odayı sil',
          style: 'destructive',
          onPress: () => deleteRoom.mutate(undefined, { onSuccess: () => router.back(), onError: showError }),
        },
      ],
    );
  };

  return (
    <Screen
      topInset={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />
      }>
      <Text className="text-3xl font-extrabold text-ink">{room.name}</Text>
      <Text className="mt-1 text-sm font-medium text-muted">
        {rows.length > 0 ? `${rows.length} üye` : ' '}
        {isOwner ? ' · Kurucusun' : ''}
      </Text>

      <View className="mt-5 rounded-3xl border border-border bg-surface p-4">
        <Text className="text-[10px] font-bold tracking-widest text-muted">{trUpper('Oda kodu')}</Text>
        <Text className="mt-1 text-3xl font-extrabold tracking-[4px] text-ink">{room.code}</Text>
        <View className="mt-3 flex-row gap-2">
          <Button label="WhatsApp" onPress={inviteWhatsApp} style={{ flex: 1 }} />
          <Button label="Paylaş" variant="secondary" onPress={inviteOther} style={{ flex: 1 }} />
        </View>
        <Text className="mt-2 text-xs text-muted">
          {"Arkadaşların davet bağlantısına dokunarak ya da Odalar → Koda Katıl'a bu kodu girerek katılır."}
        </Text>
      </View>

      <View className="mt-6">
        <SegmentedControl options={scopeOptions} value={scope} onChange={setScope} />
      </View>

      <View className="mt-4 overflow-hidden rounded-3xl border border-border bg-surface">
        {leaderboardQuery.isLoading ? (
          <View className="items-center py-8">
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : leaderboardQuery.error ? (
          <Text className="p-4 text-center text-sm text-muted">Sıralama yüklenemedi.</Text>
        ) : (
          rows.map((row, index) => (
            <RankRow
              key={row.userId}
              row={row}
              isLast={index === rows.length - 1}
              onPress={isOwner && !row.isMe ? () => confirmRemove(row) : undefined}
            />
          ))
        )}
      </View>
      <Text className="mt-2 text-center text-xs text-muted">
        Bu odada, oda kurulduktan sonra başlayan maçların puanları sayılır.
      </Text>
      {isOwner && rows.length > 1 ? (
        <Text className="mt-1 text-center text-xs text-muted">
          Bir üyeyi çıkarmak için satırına dokun.
        </Text>
      ) : null}

      <View className="mt-8">
        {isOwner ? (
          <Button label="Odayı Sil" variant="danger" onPress={confirmDelete} />
        ) : (
          <Button label="Odadan Ayrıl" variant="danger" onPress={confirmLeave} />
        )}
      </View>
    </Screen>
  );
}
