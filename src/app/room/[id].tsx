import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Share, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Text } from '@/components/ui/text';
import { RankRow } from '@/features/leaderboard/components/rank-row';
import { getRoomLeaderboard, rooms } from '@/mocks/data';
import type { LeaderboardScope } from '@/types/domain';

const scopeOptions: { value: LeaderboardScope; label: string }[] = [
  { value: 'week', label: 'Bu Hafta' },
  { value: 'season', label: 'Sezon' },
];

export default function RoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [scope, setScope] = useState<LeaderboardScope>('week');

  const room = rooms.find((item) => item.id === id);

  if (!room) {
    return (
      <Screen topInset={false}>
        <Text className="text-base text-muted">Oda bulunamadı.</Text>
      </Screen>
    );
  }

  // Örnek veride tüm odalar aynı sıralamayı gösterir.
  const rows = getRoomLeaderboard(scope);

  const invite = () => {
    Share.share({ message: `${room.name} tahmin odasına katıl! Oda kodu: ${room.code}` });
  };

  return (
    <Screen topInset={false}>
      <Text className="text-3xl font-bold text-ink">{room.name}</Text>
      <Text className="mt-1 text-sm text-muted">{room.memberCount} üye</Text>

      <View className="mt-5 flex-row items-center justify-between rounded-2xl border border-border bg-surface p-4">
        <View>
          <Text className="text-xs font-medium text-muted">Oda kodu</Text>
          <Text className="mt-0.5 text-2xl font-bold tracking-widest text-ink">{room.code}</Text>
        </View>
        <Button label="Davet Et" onPress={invite} />
      </View>

      <View className="mt-6">
        <SegmentedControl options={scopeOptions} value={scope} onChange={setScope} />
      </View>

      <View className="mt-4 overflow-hidden rounded-2xl border border-border bg-surface">
        {rows.map((row, index) => (
          <RankRow key={row.userId} row={row} isLast={index === rows.length - 1} />
        ))}
      </View>
    </Screen>
  );
}
