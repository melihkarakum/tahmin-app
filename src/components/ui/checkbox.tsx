import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { PressableOpacity } from '@/components/ui/pressable-opacity';
import { colors } from '@/constants/theme';

type CheckboxProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  accessibilityLabel: string;
  children: ReactNode;
};

export function Checkbox({ checked, onChange, accessibilityLabel, children }: CheckboxProps) {
  return (
    <PressableOpacity
      onPress={() => onChange(!checked)}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={accessibilityLabel}>
      <View className="flex-row items-start gap-3">
        <View
          className={
            checked
              ? 'mt-0.5 h-5 w-5 items-center justify-center rounded-md bg-primary'
              : 'mt-0.5 h-5 w-5 items-center justify-center rounded-md border border-border bg-surface'
          }>
          {checked ? <Icon name="checkmark" size={12} color={colors.onPrimary} /> : null}
        </View>
        <View className="flex-1">{children}</View>
      </View>
    </PressableOpacity>
  );
}
