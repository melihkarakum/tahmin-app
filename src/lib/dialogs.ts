import { Alert, Platform } from 'react-native';

// Onay ve bilgi pencereleri. Telefonda sistemin penceresi (Alert); web'de Alert çalışmadığı için
// tarayıcının kendi penceresi (confirm/alert) kullanılır.

type ConfirmOptions = {
  title: string;
  message: string;
  /** Onay düğmesinin yazısı (örn. "Odayı sil"). */
  confirmLabel: string;
  onConfirm: () => void;
};

/** Geri alınamayan işlemden önce onay ister (Vazgeç / onay). */
export function confirmDestructive({ title, message, confirmLabel, onConfirm }: ConfirmOptions) {
  if (Platform.OS === 'web') {
    if (globalThis.confirm?.(`${title}\n\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Vazgeç', style: 'cancel' },
    { text: confirmLabel, style: 'destructive', onPress: onConfirm },
  ]);
}

/** Tek düğmeli bilgi penceresi (örn. işlem tamamlanamadı). */
export function showMessage(title: string, message: string) {
  if (Platform.OS === 'web') {
    globalThis.alert?.(`${title}\n\n${message}`);
    return;
  }
  Alert.alert(title, message);
}
