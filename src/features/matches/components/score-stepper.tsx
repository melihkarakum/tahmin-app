import { Text, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { PressableOpacity } from '@/components/ui/pressable-opacity';
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
        hitSlop={4}
        accessibilityLabel={`${teamName} golünü azalt`}>
        <View className="h-10 w-10 items-center justify-center rounded-full bg-surface-muted">
          <Icon name="minus" size={16} color={colors.ink} />
        </View>
      </PressableOpacity>

      <Text className="w-11 text-center text-2xl font-bold text-ink" style={tabularNums}>
        {value}
      </Text>

      <PressableOpacity
        onPress={() => onChange(Math.min(MAX_GOALS, value + 1))}
        disabled={value === MAX_GOALS}
        hitSlop={4}
        accessibilityLabel={`${teamName} golünü artır`}>
        <View className="h-10 w-10 items-center justify-center rounded-full bg-surface-muted">
          <Icon name="plus" size={16} color={colors.ink} />
        </View>
      </PressableOpacity>
    </View>
  );
}
