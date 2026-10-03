import type { ReactNode } from 'react';
import { Pressable, type StyleProp, type ViewStyle } from 'react-native';

type PressableOpacityProps = {
  children: ReactNode;
  onPress: () => void;
  disabled?: boolean;
  hitSlop?: number;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

// Basılma ve devre dışı görünümü inline style ile verilir; opaklık className ile değiştirilmez.
export function PressableOpacity({
  children,
  onPress,
  disabled = false,
  hitSlop,
  accessibilityLabel,
  style,
}: PressableOpacityProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={hitSlop}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [{ opacity: disabled ? 0.35 : pressed ? 0.6 : 1 }, style]}>
      {children}
    </Pressable>
  );
}
