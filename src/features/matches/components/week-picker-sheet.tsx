import { Modal, Pressable, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/ui/icon';
import { PressableOpacity } from '@/components/ui/pressable-opacity';
import { Text } from '@/components/ui/text';
import { colors, overlayColor, tabularNums } from '@/constants/theme';
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

/** Alttan açılan "Hafta seç" paneli: sezonun tüm haftaları tek ekranda. */
export function WeekPickerSheet({
  visible,
  rounds,
  selected,
  current,
  onSelect,
  onClose,
}: WeekPickerSheetProps) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const cellSize = Math.floor((width - SIDE_PADDING * 2 - GAP * (COLUMNS - 1)) / COLUMNS);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View entering={FadeIn.duration(180)} style={{ flex: 1, backgroundColor: overlayColor }}>
        <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityLabel="Kapat" />
      </Animated.View>

      <Animated.View
        entering={SlideInDown.duration(260)}
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}>
        <View
          className="rounded-t-3xl border-t border-border bg-surface pt-3"
          style={{ paddingHorizontal: SIDE_PADDING, paddingBottom: insets.bottom + 20 }}>
          <View className="items-center">
            <View className="h-1 w-10 rounded-full bg-border" />
          </View>

          <View className="mt-4 flex-row items-center justify-between">
            <View>
              <Text className="text-lg font-extrabold text-ink">Hafta seç</Text>
              <View className="mt-1 flex-row items-center gap-1.5">
                <View className="h-2 w-2 rounded-full bg-primary" />
                <Text className="text-xs text-muted">Bu hafta</Text>
              </View>
            </View>
            <PressableOpacity onPress={onClose} hitSlop={8} accessibilityLabel="Kapat">
              <View className="h-9 w-9 items-center justify-center rounded-full bg-surface-muted">
                <Icon name="close" size={13} color={colors.ink} />
              </View>
            </PressableOpacity>
          </View>

          <View className="mt-5 flex-row flex-wrap" style={{ gap: GAP }}>
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
        </View>
      </Animated.View>
    </Modal>
  );
}
