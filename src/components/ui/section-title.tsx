import { View } from 'react-native';

import { PressableOpacity } from '@/components/ui/pressable-opacity';
import { Text } from '@/components/ui/text';

type SectionTitleProps = {
  title: string;
  actionLabel?: string;
  onActionPress?: () => void;
};

export function SectionTitle({ title, actionLabel, onActionPress }: SectionTitleProps) {
  return (
    <View className="mb-3 mt-8 flex-row items-end justify-between">
      <Text className="text-xl font-bold text-ink">{title}</Text>
      {actionLabel && onActionPress ? (
        <PressableOpacity onPress={onActionPress} hitSlop={8}>
          <Text className="text-sm font-semibold text-primary">{actionLabel}</Text>
        </PressableOpacity>
      ) : null}
    </View>
  );
}
