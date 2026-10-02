import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Geçici kurulum kontrol ekranı. FAZ 5'te giriş akışıyla değişecek.
export default function Index() {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex-1 bg-background px-6"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <View className="flex-1 justify-center">
        <View className="rounded-2xl border border-border bg-surface p-6">
          <Text className="text-sm font-semibold text-primary">FAZ 2</Text>
          <Text className="mt-1 text-2xl font-bold text-ink">Kurulum çalışıyor</Text>
          <Text className="mt-2 text-base text-muted">
            Bu kartı açık zemin üzerinde, yeşil etiketle görüyorsan Expo, Expo Router ve NativeWind
            doğru kurulmuş demektir.
          </Text>
        </View>
      </View>
    </View>
  );
}
