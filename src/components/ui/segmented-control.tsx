import { View } from 'react-native';

import { PressableOpacity } from '@/components/ui/pressable-opacity';
import { Text } from '@/components/ui/text';
import { haptics } from '@/lib/haptics';

type Option<T extends string> = {
  value: T;
  label: string;
};

type SegmentedControlProps<T extends string> = {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
};

/** Aralarında boşluk olan, ayrı ayrı seçilebilir düğmeler (örn. Bu Hafta / Sezon). */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <View className="flex-row gap-3" accessibilityRole="tablist">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <PressableOpacity
            key={option.value}
            onPress={() => {
              if (selected) return;
              haptics.selection();
              onChange(option.value);
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            style={{ flex: 1 }}>
            <View
              className={
                selected
                  ? 'h-11 items-center justify-center rounded-2xl border border-primary bg-primary-soft px-3'
                  : 'h-11 items-center justify-center rounded-2xl border border-border bg-surface px-3'
              }>
              <Text
                numberOfLines={1}
                className={selected ? 'text-sm font-bold text-primary' : 'text-sm font-semibold text-muted'}>
                {option.label}
              </Text>
            </View>
          </PressableOpacity>
        );
      })}
    </View>
  );
}
