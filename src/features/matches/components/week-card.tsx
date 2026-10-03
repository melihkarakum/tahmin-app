import { LinearGradient } from 'expo-linear-gradient';
import { View } from 'react-native';

import { Icon, type IconName } from '@/components/ui/icon';
import { PressableOpacity } from '@/components/ui/pressable-opacity';
import { Text } from '@/components/ui/text';
import { colors, heroGradient, tabularNums } from '@/constants/theme';
import { trUpper } from '@/lib/text';

type WeekCardProps = {
  round: number;
  /** Örnek: "1–5 Eki" */
  dateRange?: string;
  isCurrent: boolean;
  canGoPrev: boolean;
  canGoNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onOpenPicker: () => void;
  points: number;
  predicted: number;
  total: number;
  /** Haftalık sıra henüz hesaplanmıyorsa boş bırakılır. */
  rank?: number;
  /** Kartın altındaki kısa açıklama. */
  note: string;
};

/** Ana sayfanın hafta kartı: üstte hafta geçişi (‹ 8. Hafta ›), altında o haftanın özeti. */
export function WeekCard({
  round,
  dateRange,
  isCurrent,
  canGoPrev,
  canGoNext,
  onPrev,
  onNext,
  onOpenPicker,
  points,
  predicted,
  total,
  rank,
  note,
}: WeekCardProps) {
  const progress = total > 0 ? predicted / total : 0;

  return (
    <View className="overflow-hidden rounded-3xl border border-border">
      <LinearGradient
        colors={heroGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 20 }}>
        <View className="flex-row items-center justify-between">
          <NavButton
            icon="chevronLeft"
            label="Önceki hafta"
            disabled={!canGoPrev}
            onPress={onPrev}
          />

          <PressableOpacity onPress={onOpenPicker} hitSlop={8} accessibilityLabel="Hafta seç">
            <View className="items-center px-2">
              <View className="flex-row items-center gap-1.5">
                <Text className="text-xl font-extrabold text-ink" style={tabularNums}>
                  {round}. Hafta
                </Text>
                <Icon name="chevronDown" size={12} color={colors.muted} />
              </View>
              <View className="mt-1 flex-row items-center gap-2">
                {dateRange ? (
                  <Text className="text-xs font-semibold text-muted">{dateRange}</Text>
                ) : null}
                {isCurrent ? (
                  <View className="rounded-full bg-primary-soft px-2 py-0.5">
                    <Text className="text-[10px] font-bold tracking-wider text-primary">
                      {trUpper('Bu hafta')}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
          </PressableOpacity>

          <NavButton icon="chevronRight" label="Sonraki hafta" disabled={!canGoNext} onPress={onNext} />
        </View>

        <View className="my-4 h-px bg-border" />

        <View className="flex-row px-1">
          <Stat label="Puan" value={String(points)} />
          <Stat label="Tahmin" value={`${predicted}/${total}`} />
          <Stat label="Sıran" value={rank ? `#${rank}` : '–'} />
        </View>
        <View className="mx-1 mt-4 h-1.5 overflow-hidden rounded-full bg-surface-muted">
          <View className="h-full rounded-full bg-primary" style={{ width: `${progress * 100}%` }} />
        </View>
        <Text className="mx-1 mt-2 text-xs text-muted">{note}</Text>
      </LinearGradient>
    </View>
  );
}

function NavButton({
  icon,
  label,
  disabled,
  onPress,
}: {
  icon: IconName;
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <PressableOpacity onPress={onPress} disabled={disabled} hitSlop={6} accessibilityLabel={label}>
      <View className="h-10 w-10 items-center justify-center rounded-full border border-border bg-surface">
        <Icon name={icon} size={15} color={colors.ink} />
      </View>
    </PressableOpacity>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1">
      <Text className="text-xs font-medium text-muted">{label}</Text>
      <Text className="mt-1 text-3xl font-black text-ink" style={tabularNums}>
        {value}
      </Text>
    </View>
  );
}
