import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Linking, RefreshControl, Share, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { PressableOpacity } from '@/components/ui/pressable-opacity';
import { Screen } from '@/components/ui/screen';
import { RowsSkeleton, Skeleton, SkeletonGroup } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { colors } from '@/constants/theme';
import { useAuth } from '@/features/auth/auth-provider';
import { useCurrentRound } from '@/features/matches/queries';
import { RenameRoomSheet } from '@/features/rooms/components/rename-room-sheet';
import { RoomInviteCard } from '@/features/rooms/components/room-invite-card';
import { RoomStandings } from '@/features/rooms/components/room-standings';
import {
  toRoomMessage,
  useDeleteRoom,
  useRemoveMember,
  useRoom,
  useRoomLeaderboard,
} from '@/features/rooms/queries';
import { haptics } from '@/lib/haptics';
import { confirmDestructive, showMessage } from '@/lib/dialogs';
import { inviteMessage, whatsappShareUrl } from '@/lib/invite';
import type { LeaderboardRow, LeaderboardScope } from '@/types/domain';

export default function RoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { session } = useAuth();
  const myId = session?.user.id;
  const [scope, setScope] = useState<LeaderboardScope>('week');
  const [refreshing, setRefreshing] = useState(false);
  // null: kullanıcı henüz dokunmadı. Odada tek başınaysan davet alanı açık başlar.
  const [inviteExpanded, setInviteExpanded] = useState<boolean | null>(null);
  const [renameOpen, setRenameOpen] = useState(false);

  const roomQuery = useRoom(id);
  const room = roomQuery.data;
  const { data: current } = useCurrentRound();
  const leaderboardQuery = useRoomLeaderboard(id, scope, current?.round);
  const rows = leaderboardQuery.data ?? [];
  const removeMember = useRemoveMember(id);
  const deleteRoom = useDeleteRoom(id);

  const isOwner = room !== null && room !== undefined && room.owner_id === myId;
  const isAlone = leaderboardQuery.isSuccess && rows.length === 1;
  const inviteOpen = inviteExpanded ?? isAlone;
  const standingsContext =
    current === null || current === undefined
      ? undefined
      : scope === 'week'
        ? `${current.round}. hafta`
        : `${current.seasonName} sezonu`;

  const refresh = async () => {
    setRefreshing(true);
    await Promise.all([roomQuery.refetch(), leaderboardQuery.refetch()]);
    setRefreshing(false);
  };

  if (roomQuery.isLoading) {
    return (
      <Screen topInset={false}>
        <SkeletonGroup className="gap-3">
          <Skeleton width="60%" height={30} />
          <Skeleton width="30%" height={14} />
          <Skeleton height={64} radius={24} style={{ marginTop: 12 }} />
          <Skeleton height={44} radius={16} style={{ marginTop: 20 }} />
          <RowsSkeleton count={4} />
        </SkeletonGroup>
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

  const showError = (error: unknown) => showMessage('İşlem tamamlanamadı', toRoomMessage(error));

  const confirmRemove = (row: LeaderboardRow) => {
    confirmDestructive({
      title: row.displayName,
      message: 'Bu üyeyi odadan çıkarmak istiyor musun?',
      confirmLabel: 'Odadan çıkar',
      onConfirm: () => removeMember.mutate(row.userId, { onError: showError }),
    });
  };

  const confirmLeave = () => {
    if (!myId) return;
    confirmDestructive({
      title: 'Odadan ayrıl',
      message: `${room.name} odasından ayrılmak istiyor musun?`,
      confirmLabel: 'Ayrıl',
      onConfirm: () => removeMember.mutate(myId, { onSuccess: () => router.back(), onError: showError }),
    });
  };

  const confirmDelete = () => {
    confirmDestructive({
      title: 'Odayı sil',
      message: `${room.name} odası tüm üyeler için silinecek. Tahminler ve puanlar silinmez. Emin misin?`,
      confirmLabel: 'Odayı sil',
      onConfirm: () => deleteRoom.mutate(undefined, { onSuccess: () => router.back(), onError: showError }),
    });
  };

  return (
    <Screen
      topInset={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />
      }>
      <View className="flex-row items-start gap-3">
        <Text className="flex-1 text-3xl font-extrabold text-ink">{room.name}</Text>
        {isOwner ? (
          <PressableOpacity onPress={() => setRenameOpen(true)} hitSlop={10} accessibilityLabel="Oda adını düzenle">
            <View className="mt-1 h-9 w-9 items-center justify-center rounded-full border border-border bg-surface">
              <Icon name="edit" size={15} color={colors.ink} />
            </View>
          </PressableOpacity>
        ) : null}
      </View>
      <Text className="mt-1 text-sm font-medium text-muted">
        {rows.length > 0 ? `${rows.length} üye` : ' '}
        {isOwner ? ' · Kurucusun' : ''}
      </Text>

      <View className="mt-5">
        <RoomInviteCard
          code={room.code}
          expanded={inviteOpen}
          onToggle={() => {
            haptics.selection();
            setInviteExpanded(!inviteOpen);
          }}
          onWhatsApp={inviteWhatsApp}
          onShare={inviteOther}
        />
      </View>

      <View className="mt-8">
        <RoomStandings
          rows={rows}
          scope={scope}
          onScopeChange={setScope}
          context={standingsContext}
          isLoading={leaderboardQuery.isLoading}
          isSwitching={leaderboardQuery.isPlaceholderData}
          hasError={leaderboardQuery.isError}
          onRetry={() => leaderboardQuery.refetch()}
          onMemberPress={isOwner ? confirmRemove : undefined}
        />
      </View>

      <View className="mt-3 flex-row items-start gap-2 px-1">
        <View className="pt-0.5">
          <Icon name="info" size={13} color={colors.muted} />
        </View>
        <Text className="flex-1 text-xs text-muted">
          Bu odada, oda kurulduktan sonra başlayan maçların puanları sayılır.
          {isOwner && rows.length > 1 ? ' Bir üyeyi çıkarmak için adına dokun.' : ''}
        </Text>
      </View>

      <View className="mt-8">
        {isOwner ? (
          <Button label="Odayı Sil" variant="danger" onPress={confirmDelete} />
        ) : (
          <Button label="Odadan Ayrıl" variant="danger" onPress={confirmLeave} />
        )}
      </View>

      <RenameRoomSheet
        visible={renameOpen}
        roomId={room.id}
        currentName={room.name}
        onClose={() => setRenameOpen(false)}
      />
    </Screen>
  );
}
