import { View } from 'react-native';

import { Text } from '@/components/ui/text';
import { tabularNums } from '@/constants/theme';
import type { ResultType } from '@/types/domain';

type PointsChipProps = {
  points: number;
  resultType: ResultType;
};

/** Kazanılan puan. Tam skor altın renkte öne çıkar. */
export function PointsChip({ points, resultType }: PointsChipProps) {
  const label = points > 0 ? `+${points}` : '0';

  if (resultType === 'exact') {
    return (
      <View className="rounded-full bg-gold px-3 py-1">
        <Text className="text-sm font-black text-background" style={tabularNums}>
          {label} puan
        </Text>
      </View>
    );
  }

  if (resultType === 'miss') {
    return (
      <View className="rounded-full bg-surface px-3 py-1">
        <Text className="text-sm font-bold text-muted" style={tabularNums}>
          {label} puan
        </Text>
      </View>
    );
  }

  return (
    <View className="rounded-full bg-primary-soft px-3 py-1">
      <Text className="text-sm font-black text-primary" style={tabularNums}>
        {label} puan
      </Text>
    </View>
  );
}
