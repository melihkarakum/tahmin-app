import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// Dokunuş titreşimi. Web'de kapalı; telefon desteklemiyorsa ya da ayarlardan/düşük güç
// modunda kapalıysa sessizce geçilir (titreşim hiçbir zaman bir işlemi engellemez).
const enabled = Platform.OS !== 'web';

function run(effect: () => Promise<void>) {
  if (!enabled) return;
  effect().catch(() => {});
}

export const haptics = {
  /** Seçim değişti: skor artır/azalt, sekme, hafta, Bu Hafta/Sezon. */
  selection: () => run(() => Haptics.selectionAsync()),
  /** İşlem başarılı: tahmin kaydedildi, oda kuruldu, odaya katıldın. */
  success: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  /** İşlem reddedildi: maç başladı, kod hatalı. */
  warning: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
};
