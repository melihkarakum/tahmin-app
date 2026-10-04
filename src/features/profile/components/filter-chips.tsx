import { ScrollView, View } from 'react-native';

import { PressableOpacity } from '@/components/ui/pressable-opacity';
import { Text } from '@/components/ui/text';
import { tabularNums } from '@/constants/theme';
import {
  filterLabels,
  PREDICTION_FILTERS,
  type PredictionFilter,
} from '@/features/profile/prediction-filters';
import { haptics } from '@/lib/haptics';

type FilterChipsProps = {
  value: PredictionFilter;
  counts: Record<PredictionFilter, number>;
  onChange: (filter: PredictionFilter) => void;
};

/** Tümü / Doğru / Tam Skor / Yanlış / Bekleyen — yanlarında kaç tahmin olduğu. Yana kaydırılabilir. */
export function FilterChips({ value, counts, onChange }: FilterChipsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      // Ekran kenarına kadar kaysın diye kenar boşluğu içeride.
      style={{ marginHorizontal: -20 }}
      contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
      {PREDICTION_FILTERS.map((filter) => {
        const selected = filter === value;
        return (
          <PressableOpacity
            key={filter}
            onPress={() => {
              if (selected) return;
              haptics.selection();
              onChange(filter);
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={`${filterLabels[filter]}, ${counts[filter]} tahmin`}>
            <View
              className={
                selected
                  ? 'h-9 flex-row items-center gap-1.5 rounded-full border border-primary bg-primary-soft px-3.5'
                  : 'h-9 flex-row items-center gap-1.5 rounded-full border border-border bg-surface px-3.5'
              }>
              <Text className={selected ? 'text-sm font-bold text-primary' : 'text-sm font-semibold text-ink'}>
                {filterLabels[filter]}
              </Text>
              <Text
                className={selected ? 'text-xs font-bold text-primary' : 'text-xs font-semibold text-muted'}
                style={tabularNums}>
                {counts[filter]}
              </Text>
            </View>
          </PressableOpacity>
        );
      })}
    </ScrollView>
  );
}
