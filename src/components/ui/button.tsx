import { Animated, Pressable, type StyleProp, View, type ViewStyle } from 'react-native';

import { Icon, type IconName } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { colors } from '@/constants/theme';
import { usePressScale } from '@/hooks/use-press-scale';

type ButtonVariant = 'primary' | 'secondary' | 'danger';
type ButtonSize = 'md' | 'sm';

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  /** sm: profil üstündeki gibi küçük düğmeler. */
  size?: ButtonSize;
  /** Yazının solunda küçük ikon. */
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
};

const containerClass: Record<ButtonVariant, string> = {
  primary: 'h-[52px] items-center justify-center rounded-2xl bg-primary px-5',
  secondary: 'h-[52px] items-center justify-center rounded-2xl border border-border bg-surface px-5',
  danger: 'h-[52px] items-center justify-center rounded-2xl border border-danger bg-surface px-5',
};

const labelClass: Record<ButtonVariant, string> = {
  primary: 'text-base font-bold text-on-primary',
  secondary: 'text-base font-bold text-ink',
  danger: 'text-base font-bold text-danger',
};

const iconColor: Record<ButtonVariant, string> = {
  primary: colors.onPrimary,
  secondary: colors.ink,
  danger: colors.danger,
};

const smallContainerClass: Record<ButtonVariant, string> = {
  primary: 'h-10 items-center justify-center rounded-xl bg-primary px-4',
  secondary: 'h-10 items-center justify-center rounded-xl border border-border bg-surface px-4',
  danger: 'h-10 items-center justify-center rounded-xl border border-danger bg-surface px-4',
};

const smallLabelClass: Record<ButtonVariant, string> = {
  primary: 'text-sm font-bold text-on-primary',
  secondary: 'text-sm font-bold text-ink',
  danger: 'text-sm font-bold text-danger',
};

// Basınca hafif küçülür (düzeni kaydırmaz). Basılma ve devre dışı görünümü inline style ile verilir;
// opaklık className ile değiştirilmez.
export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  size = 'md',
  icon,
  style,
}: ButtonProps) {
  const { scale, onPressIn, onPressOut } = usePressScale();

  return (
    <Pressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={style}>
      {({ pressed }) => (
        <Animated.View style={{ transform: [{ scale }], opacity: disabled ? 0.35 : pressed ? 0.88 : 1 }}>
          <View
            className={size === 'sm' ? smallContainerClass[variant] : containerClass[variant]}
            style={icon ? { flexDirection: 'row', gap: 8 } : undefined}>
            {icon ? <Icon name={icon} size={size === 'sm' ? 15 : 18} color={iconColor[variant]} /> : null}
            <Text numberOfLines={1} className={size === 'sm' ? smallLabelClass[variant] : labelClass[variant]}>
              {label}
            </Text>
          </View>
        </Animated.View>
      )}
    </Pressable>
  );
}
