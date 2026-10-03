import { type StyleProp, View, type ViewStyle } from 'react-native';

import { PressableOpacity } from '@/components/ui/pressable-opacity';
import { Text } from '@/components/ui/text';

type ButtonVariant = 'primary' | 'secondary' | 'danger';

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

const containerClass: Record<ButtonVariant, string> = {
  primary: 'h-[52px] items-center justify-center rounded-2xl bg-primary px-5',
  secondary: 'h-[52px] items-center justify-center rounded-2xl border border-border bg-surface px-5',
  danger: 'h-[52px] items-center justify-center rounded-2xl border border-danger bg-surface px-5',
};

const labelClass: Record<ButtonVariant, string> = {
  primary: 'text-base font-bold text-on-primary',
  secondary: 'text-base font-bold text-ink',
  danger: 'text-base font-bold text-danger',
};

export function Button({ label, onPress, variant = 'primary', disabled = false, style }: ButtonProps) {
  return (
    <PressableOpacity onPress={onPress} disabled={disabled} style={style}>
      <View className={containerClass[variant]}>
        <Text numberOfLines={1} className={labelClass[variant]}>
          {label}
        </Text>
      </View>
    </PressableOpacity>
  );
}
