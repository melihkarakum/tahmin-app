import { Text, View } from 'react-native';

import { tabularNums } from '@/constants/theme';
import type { ResultType } from '@/types/domain';

type PointsChipProps = {
  points: number;
  resultType: ResultType;
};

export function PointsChip({ points, resultType }: PointsChipProps) {
  const label = points > 0 ? `+${points} puan` : '0 puan';

  if (resultType === 'exact') {
    return (
      <View className="rounded-full bg-primary px-3 py-1">
        <Text className="text-sm font-bold text-on-primary" style={tabularNums}>
          {label}
        </Text>
      </View>
    );
  }

  if (resultType === 'miss') {
    return (
      <View className="rounded-full bg-surface-muted px-3 py-1">
        <Text className="text-sm font-bold text-muted" style={tabularNums}>
          {label}
        </Text>
      </View>
    );
  }

  return (
    <View className="rounded-full bg-primary-soft px-3 py-1">
      <Text className="text-sm font-bold text-primary" style={tabularNums}>
        {label}
      </Text>
    </View>
  );
}
