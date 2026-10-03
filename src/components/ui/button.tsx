import { type StyleProp, Text, View, type ViewStyle } from 'react-native';

import { PressableOpacity } from '@/components/ui/pressable-opacity';

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({ label, onPress, variant = 'primary', disabled = false, style }: ButtonProps) {
  const isPrimary = variant === 'primary';

  return (
    <PressableOpacity onPress={onPress} disabled={disabled} style={style}>
      <View
        className={
          isPrimary
            ? 'h-12 items-center justify-center rounded-xl bg-primary px-5'
            : 'h-12 items-center justify-center rounded-xl border border-border bg-surface px-5'
        }>
        <Text
          className={
            isPrimary
              ? 'text-base font-semibold text-on-primary'
              : 'text-base font-semibold text-ink'
          }>
          {label}
        </Text>
      </View>
    </PressableOpacity>
  );
}
