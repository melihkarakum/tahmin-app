import { Text, View } from 'react-native';

import { PressableOpacity } from '@/components/ui/pressable-opacity';

type Option<T extends string> = {
  value: T;
  label: string;
};

type SegmentedControlProps<T extends string> = {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
};

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <View className="flex-row rounded-xl bg-surface-muted p-1">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <PressableOpacity
            key={option.value}
            onPress={() => onChange(option.value)}
            style={{ flex: 1 }}>
            <View
              className={
                selected
                  ? 'h-9 items-center justify-center rounded-lg bg-surface'
                  : 'h-9 items-center justify-center rounded-lg'
              }>
              <Text
                className={
                  selected ? 'text-sm font-semibold text-ink' : 'text-sm font-medium text-muted'
                }>
                {option.label}
              </Text>
            </View>
          </PressableOpacity>
        );
      })}
    </View>
  );
}
