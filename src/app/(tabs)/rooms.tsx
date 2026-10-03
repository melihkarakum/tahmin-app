import { useRouter } from 'expo-router';
import { Alert, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { PressableOpacity } from '@/components/ui/pressable-opacity';
import { Screen } from '@/components/ui/screen';
import { colors, tabularNums } from '@/constants/theme';
import { rooms } from '@/mocks/data';

export default function RoomsScreen() {
  const router = useRouter();

  // Oda oluşturma ve katılma FAZ 10'da gerçek hale gelecek.
  const comingSoon = () => Alert.alert('Yakında', 'Bu özellik arkadaş odaları fazında eklenecek.');

  return (
    <Screen>
      <Text className="text-3xl font-bold text-ink">Odalar</Text>
      <Text className="mt-1 text-sm text-muted">Arkadaşlarınla kendi sıralamanı kur.</Text>

      <View className="mt-5 flex-row gap-3">
        <Button label="Oda Oluştur" onPress={comingSoon} style={{ flex: 1 }} />
        <Button label="Koda Katıl" variant="secondary" onPress={comingSoon} style={{ flex: 1 }} />
      </View>

      <View className="mt-6 gap-3">
        {rooms.map((room) => (
          <PressableOpacity
            key={room.id}
            onPress={() => router.push({ pathname: '/room/[id]', params: { id: room.id } })}>
            <View className="flex-row items-center rounded-2xl border border-border bg-surface p-4">
              <View className="flex-1">
                <Text className="text-lg font-bold text-ink" numberOfLines={1}>
                  {room.name}
                </Text>
                <Text className="mt-0.5 text-sm text-muted">
                  {room.memberCount} üye · Lider: {room.leaderName}
                </Text>
              </View>
              <View className="mr-3 items-end">
                <Text className="text-xs text-muted">Sıran</Text>
                <Text className="text-xl font-bold text-ink" style={tabularNums}>
                  #{room.myRank}
                </Text>
              </View>
              <Icon name="chevronRight" size={16} color={colors.muted} />
            </View>
          </PressableOpacity>
        ))}
      </View>
    </Screen>
  );
}
