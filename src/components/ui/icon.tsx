import { SymbolView } from 'expo-symbols';
import type { ColorValue } from 'react-native';

// Uygulamadaki tüm ikonlar buradan geçer; ikon kütüphanesi değişirse yalnızca bu dosya değişir.
const symbols = {
  home: { ios: 'house.fill', android: 'home', web: 'home' },
  rooms: { ios: 'person.3.fill', android: 'groups', web: 'groups' },
  leaderboard: { ios: 'trophy.fill', android: 'trophy', web: 'trophy' },
  profile: { ios: 'person.crop.circle.fill', android: 'account_circle', web: 'account_circle' },
  plus: { ios: 'plus', android: 'add', web: 'add' },
  minus: { ios: 'minus', android: 'remove', web: 'remove' },
  lock: { ios: 'lock.fill', android: 'lock', web: 'lock' },
  chevronRight: { ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' },
  chevronLeft: { ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' },
  chevronDown: { ios: 'chevron.down', android: 'expand_more', web: 'expand_more' },
  close: { ios: 'xmark', android: 'close', web: 'close' },
  share: { ios: 'square.and.arrow.up', android: 'share', web: 'share' },
  check: { ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' },
  checkmark: { ios: 'checkmark', android: 'check', web: 'check' },
  ball: { ios: 'soccerball', android: 'sports_soccer', web: 'sports_soccer' },
  clock: { ios: 'clock.fill', android: 'schedule', web: 'schedule' },
} as const;

export type IconName = keyof typeof symbols;

type IconProps = {
  name: IconName;
  color: ColorValue;
  size?: number;
};

export function Icon({ name, color, size = 20 }: IconProps) {
  return <SymbolView name={symbols[name]} tintColor={color} size={size} />;
}
