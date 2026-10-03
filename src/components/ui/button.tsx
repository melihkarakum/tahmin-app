import { type StyleProp, View, type ViewStyle } from 'react-native';

import { PressableOpacity } from '@/components/ui/pressable-opacity';
import { Text } from '@/components/ui/text';

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
            ? 'h-[52px] items-center justify-center rounded-2xl bg-primary px-5'
            : 'h-[52px] items-center justify-center rounded-2xl border border-border bg-surface px-5'
        }>
        <Text
          numberOfLines={1}
          className={isPrimary ? 'text-base font-bold text-on-primary' : 'text-base font-bold text-ink'}>
          {label}
        </Text>
      </View>
    </PressableOpacity>
  );
}
