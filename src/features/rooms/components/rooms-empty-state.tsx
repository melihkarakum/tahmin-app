import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { colors } from '@/constants/theme';

type RoomsEmptyStateProps = {
  onCreate: () => void;
  onJoin: () => void;
};

/** Hiç odası olmayan kullanıcıya ekranın ortasında: ne işe yaradığı ve iki düğme. */
export function RoomsEmptyState({ onCreate, onJoin }: RoomsEmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center py-10">
      <View className="h-20 w-20 items-center justify-center rounded-3xl border border-primary/40 bg-primary-soft">
        <Icon name="rooms" size={36} color={colors.primary} />
      </View>
      <Text className="mt-5 text-center text-2xl font-extrabold text-ink">Henüz bir odan yok</Text>
      <Text className="mt-2 max-w-[300px] text-center text-sm text-muted">
        Arkadaşlarınla bir oda kur, kodunu paylaş; haftalık ve sezon sıralamasında yarışın. Bir arkadaşın
        oda kurduysa koduyla katıl.
      </Text>
      <View className="mt-7 w-full max-w-[320px] gap-3">
        <Button label="Oda Kur" icon="plus" onPress={onCreate} />
        <Button label="Koda Katıl" variant="secondary" onPress={onJoin} />
      </View>
    </View>
  );
}
