import { View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { PressableOpacity } from '@/components/ui/pressable-opacity';
import { Text } from '@/components/ui/text';
import { colors, tabularNums } from '@/constants/theme';

const MAX_GOALS = 20;

type ScoreStepperProps = {
  value: number;
  onChange: (value: number) => void;
  teamName: string;
};

/** Klavye açmadan, tek elle skor girmek için eksi/artı düğmeleri. */
export function ScoreStepper({ value, onChange, teamName }: ScoreStepperProps) {
  return (
    <View className="flex-row items-center">
      <PressableOpacity
        onPress={() => onChange(Math.max(0, value - 1))}
        disabled={value === 0}
        hitSlop={6}
        accessibilityLabel={`${teamName} golünü azalt`}>
        <View className="h-9 w-9 items-center justify-center rounded-full border border-border bg-surface">
          <Icon name="minus" size={14} color={colors.ink} />
        </View>
      </PressableOpacity>

      <Text className="w-10 text-center text-3xl font-black text-ink" style={tabularNums}>
        {value}
      </Text>

      <PressableOpacity
        onPress={() => onChange(Math.min(MAX_GOALS, value + 1))}
        disabled={value === MAX_GOALS}
        hitSlop={6}
        accessibilityLabel={`${teamName} golünü artır`}>
        <View className="h-9 w-9 items-center justify-center rounded-full border border-border bg-surface">
          <Icon name="plus" size={14} color={colors.ink} />
        </View>
      </PressableOpacity>
    </View>
  );
}
