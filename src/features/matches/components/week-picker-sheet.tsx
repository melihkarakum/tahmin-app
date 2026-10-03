import { useWindowDimensions, View } from 'react-native';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { PressableOpacity } from '@/components/ui/pressable-opacity';
import { Text } from '@/components/ui/text';
import { tabularNums } from '@/constants/theme';
import { trUpper } from '@/lib/text';

const COLUMNS = 6;
const GAP = 8;
const SIDE_PADDING = 20;

type WeekPickerSheetProps = {
  visible: boolean;
  rounds: number[];
  selected: number;
  current: number;
  onSelect: (round: number) => void;
  onClose: () => void;
};

/** "Hafta seç" paneli: sezonun tüm haftaları tek ekranda. */
export function WeekPickerSheet({
  visible,
  rounds,
  selected,
  current,
  onSelect,
  onClose,
}: WeekPickerSheetProps) {
  const { width } = useWindowDimensions();
  const cellSize = Math.floor((width - SIDE_PADDING * 2 - GAP * (COLUMNS - 1)) / COLUMNS);

  return (
    <BottomSheet
      visible={visible}
      title="Hafta seç"
      onClose={onClose}
      subtitle={
        <View className="flex-row items-center gap-1.5">
          <View className="h-2 w-2 rounded-full bg-primary" />
          <Text className="text-xs text-muted">Bu hafta</Text>
        </View>
      }>
      <View className="flex-row flex-wrap" style={{ gap: GAP }}>
        {rounds.map((round) => {
          const isSelected = round === selected;
          const isCurrent = round === current;
          const isPast = round < current;
          return (
            <PressableOpacity
              key={round}
              onPress={() => {
                onSelect(round);
                onClose();
              }}
              accessibilityLabel={`${round}. hafta`}
              accessibilityState={{ selected: isSelected }}>
              <View
                className={
                  isSelected
                    ? 'items-center justify-center rounded-2xl bg-primary'
                    : isCurrent
                      ? 'items-center justify-center rounded-2xl border border-primary bg-surface-muted'
                      : 'items-center justify-center rounded-2xl bg-surface-muted'
                }
                style={{ width: cellSize, height: cellSize }}>
                <Text
                  className={
                    isSelected
                      ? 'text-base font-extrabold text-on-primary'
                      : isPast
                        ? 'text-base font-bold text-muted'
                        : 'text-base font-bold text-ink'
                  }
                  style={tabularNums}>
                  {round}
                </Text>
                {isCurrent && !isSelected ? (
                  <View className="mt-0.5 h-1 w-1 rounded-full bg-primary" />
                ) : null}
              </View>
            </PressableOpacity>
          );
        })}
      </View>

      <Text className="mt-4 text-center text-[10px] font-semibold tracking-wider text-muted">
        {trUpper(`${rounds.length} hafta`)}
      </Text>
    </BottomSheet>
  );
}
