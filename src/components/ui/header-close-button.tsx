import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { PressableOpacity } from '@/components/ui/pressable-opacity';
import { colors } from '@/constants/theme';

/**
 * Başlık çubuğunun sağındaki kapat (X) düğmesi: alttan açılan ekranlarda her zaman geri dönüş yolu olsun.
 * Ekran bir bağlantıyla doğrudan açıldıysa (geri gidilecek sayfa yoksa) ana sayfaya döner.
 */
export function HeaderCloseButton() {
  const router = useRouter();

  const close = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  return (
    <PressableOpacity onPress={close} hitSlop={10} accessibilityLabel="Kapat">
      <View className="h-8 w-8 items-center justify-center rounded-full bg-surface-muted">
        <Icon name="close" size={14} color={colors.ink} />
      </View>
    </PressableOpacity>
  );
}
