import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Platform, RefreshControl, TextInput, View } from 'react-native';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { PressableOpacity } from '@/components/ui/pressable-opacity';
import { Screen } from '@/components/ui/screen';
import { Skeleton, SkeletonGroup } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { colors, tabularNums } from '@/constants/theme';
import { haptics } from '@/lib/haptics';
import {
  joinStatusMessages,
  type MyRoom,
  toRoomMessage,
  useCreateRoom,
  useJoinRoom,
  useMyRooms,
} from '@/features/rooms/queries';

export default function RoomsScreen() {
  const router = useRouter();
  const roomsQuery = useMyRooms();
  const rooms = roomsQuery.data ?? [];
  const [refreshing, setRefreshing] = useState(false);
  const [sheet, setSheet] = useState<'create' | 'join' | null>(null);
  // Oda kurulunca/katılınca gidilecek oda. Panel kapanırken sayfa değiştirmek iOS'ta takılmaya
  // yol açtığı için geçiş, panel tamamen kapandıktan sonra (onDismiss) yapılır.
  const pendingRoomId = useRef<string | null>(null);

  const openRoom = (roomId: string) => router.push({ pathname: '/room/[id]', params: { id: roomId } });

  const finishSheet = (roomId: string) => {
    setSheet(null);
    if (Platform.OS === 'ios') {
      pendingRoomId.current = roomId;
    } else {
      openRoom(roomId);
    }
  };

  const handleSheetDismiss = () => {
    const roomId = pendingRoomId.current;
    pendingRoomId.current = null;
    if (roomId) openRoom(roomId);
  };

  const refresh = async () => {
    setRefreshing(true);
    await roomsQuery.refetch();
    setRefreshing(false);
  };

  return (
    <Screen
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />
      }>
      <Text className="text-3xl font-extrabold text-ink">Odalar</Text>
      <Text className="mt-1 text-sm font-medium text-muted">Arkadaşlarınla kendi sıralamanı kur.</Text>

      <View className="mt-5 flex-row gap-3">
        <Button label="Oda Kur" onPress={() => setSheet('create')} style={{ flex: 1 }} />
        <Button label="Koda Katıl" variant="secondary" onPress={() => setSheet('join')} style={{ flex: 1 }} />
      </View>

      {roomsQuery.isLoading ? (
        <SkeletonGroup className="mt-6 gap-3">
          <Skeleton height={84} radius={24} />
          <Skeleton height={84} radius={24} />
          <Skeleton height={84} radius={24} />
        </SkeletonGroup>
      ) : roomsQuery.error ? (
        <View className="mt-6 items-center gap-3 rounded-3xl border border-border bg-surface p-6">
          <Text className="text-center text-sm text-muted">Odalar yüklenemedi.</Text>
          <Button label="Tekrar dene" variant="secondary" onPress={refresh} />
        </View>
      ) : rooms.length === 0 ? (
        <View className="mt-6 items-center gap-3 rounded-3xl border border-border bg-surface px-6 py-10">
          <View className="h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft">
            <Icon name="rooms" size={26} color={colors.primary} />
          </View>
          <Text className="text-center text-base font-bold text-ink">Henüz bir odan yok</Text>
          <Text className="text-center text-sm text-muted">
            Bir oda kur ve kodunu arkadaşlarınla paylaş ya da arkadaşının verdiği kodla katıl.
          </Text>
        </View>
      ) : (
        <View className="mt-6 gap-3">
          {rooms.map((room) => (
            <RoomCard key={room.id} room={room} onPress={() => openRoom(room.id)} />
          ))}
        </View>
      )}

      <CreateRoomSheet
        visible={sheet === 'create'}
        onClose={() => setSheet(null)}
        onDismiss={handleSheetDismiss}
        onCreated={finishSheet}
      />
      <JoinRoomSheet
        visible={sheet === 'join'}
        onClose={() => setSheet(null)}
        onDismiss={handleSheetDismiss}
        onJoined={finishSheet}
      />
    </Screen>
  );
}

function RoomCard({ room, onPress }: { room: MyRoom; onPress: () => void }) {
  const leader =
    room.leaderName && room.leaderPoints ? `Lider: ${room.leaderName} (${room.leaderPoints})` : 'Henüz puan yok';

  return (
    <PressableOpacity onPress={onPress}>
      <View className="flex-row items-center rounded-3xl border border-border bg-surface p-4">
        <View className="mr-3 h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft">
          <Text className="text-lg font-extrabold text-primary">
            {room.name.trim().charAt(0).toLocaleUpperCase('tr-TR')}
          </Text>
        </View>
        <View className="flex-1 pr-2">
          <View className="flex-row items-center gap-2">
            <Text className="shrink text-base font-bold text-ink" numberOfLines={1}>
              {room.name}
            </Text>
            {room.isOwner ? (
              <View className="rounded-full border border-border px-1.5 py-0.5">
                <Text className="text-[9px] font-bold tracking-wider text-muted">KURUCU</Text>
              </View>
            ) : null}
          </View>
          <Text className="mt-0.5 text-xs text-muted" numberOfLines={1}>
            {room.memberCount} üye · {leader}
          </Text>
        </View>
        <View className="mr-2 items-end">
          <Text className="text-[10px] font-semibold text-muted">Sıran</Text>
          <Text className="text-xl font-extrabold text-ink" style={tabularNums}>
            {room.myRank ? `#${room.myRank}` : '–'}
          </Text>
        </View>
        <Icon name="chevronRight" size={14} color={colors.muted} />
      </View>
    </PressableOpacity>
  );
}

function CreateRoomSheet({
  visible,
  onClose,
  onDismiss,
  onCreated,
}: {
  visible: boolean;
  onClose: () => void;
  onDismiss: () => void;
  onCreated: (roomId: string) => void;
}) {
  const createRoom = useCreateRoom();
  const inputRef = useRef<TextInput>(null);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    setName('');
    setError(null);
    onClose();
  };

  const submit = () => {
    if (name.trim().length < 2) {
      setError('Oda adı en az 2 karakter olmalı.');
      return;
    }
    setError(null);
    createRoom.mutate(name, {
      onSuccess: (room) => {
        haptics.success();
        setName('');
        onCreated(room.id);
      },
      onError: (createError) => setError(toRoomMessage(createError)),
    });
  };

  return (
    <BottomSheet
      visible={visible}
      title="Oda kur"
      onClose={close}
      onShow={() => inputRef.current?.focus()}
      onDismiss={onDismiss}
      subtitle={<Text className="text-xs text-muted">Kodu arkadaşlarına gönder, aynı odada yarışın.</Text>}>
      <TextField
        ref={inputRef}
        label="Oda adı"
        value={name}
        onChangeText={setName}
        placeholder="Halısaha Tayfa"
        maxLength={40}
        returnKeyType="done"
        onSubmitEditing={submit}
        error={error}
      />
      <Button
        label={createRoom.isPending ? 'Kuruluyor…' : 'Odayı Kur'}
        onPress={submit}
        disabled={createRoom.isPending}
        style={{ marginTop: 16 }}
      />
    </BottomSheet>
  );
}

function JoinRoomSheet({
  visible,
  onClose,
  onDismiss,
  onJoined,
}: {
  visible: boolean;
  onClose: () => void;
  onDismiss: () => void;
  onJoined: (roomId: string) => void;
}) {
  const joinRoom = useJoinRoom();
  const inputRef = useRef<TextInput>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    setCode('');
    setError(null);
    onClose();
  };

  const submit = () => {
    if (code.trim().length !== 6) {
      setError('Oda kodu 6 karakter olmalı.');
      return;
    }
    setError(null);
    joinRoom.mutate(code, {
      onSuccess: ({ status, roomId }) => {
        if ((status === 'joined' || status === 'already_member') && roomId) {
          haptics.success();
          setCode('');
          onJoined(roomId);
          return;
        }
        if (status !== 'joined' && status !== 'already_member') {
          haptics.warning();
          setError(joinStatusMessages[status]);
        }
      },
      onError: (joinError) => setError(toRoomMessage(joinError)),
    });
  };

  return (
    <BottomSheet
      visible={visible}
      title="Koda katıl"
      onClose={close}
      onShow={() => inputRef.current?.focus()}
      onDismiss={onDismiss}
      subtitle={<Text className="text-xs text-muted">Arkadaşının paylaştığı 6 karakterlik kodu gir.</Text>}>
      <TextField
        ref={inputRef}
        label="Oda kodu"
        value={code}
        onChangeText={(text) => setCode(text.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
        placeholder="HT42K9"
        maxLength={6}
        autoCapitalize="characters"
        autoCorrect={false}
        returnKeyType="go"
        onSubmitEditing={submit}
        style={{ letterSpacing: 4 }}
        error={error}
      />
      <Button
        label={joinRoom.isPending ? 'Katılınıyor…' : 'Katıl'}
        onPress={submit}
        disabled={joinRoom.isPending}
        style={{ marginTop: 16 }}
      />
    </BottomSheet>
  );
}
