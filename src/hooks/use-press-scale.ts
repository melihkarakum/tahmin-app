import { useState } from 'react';
import { Animated, Platform } from 'react-native';

const useNativeDriver = Platform.OS !== 'web';

/**
 * Basınca hafifçe küçülüp bırakınca yaylanarak geri gelen ölçek. Yalnızca görünümü değiştirir
 * (transform); düzeni etkilemez, yani yanındaki öğeler kaymaz.
 */
export function usePressScale(pressedScale = 0.97) {
  const [scale] = useState(() => new Animated.Value(1));

  const onPressIn = () => {
    Animated.spring(scale, { toValue: pressedScale, speed: 50, bounciness: 0, useNativeDriver }).start();
  };

  const onPressOut = () => {
    Animated.spring(scale, { toValue: 1, speed: 24, bounciness: 8, useNativeDriver }).start();
  };

  return { scale, onPressIn, onPressOut };
}
