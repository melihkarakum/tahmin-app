import { View } from 'react-native';

import { Text } from '@/components/ui/text';

type AvatarProps = {
  name: string;
  size?: 'sm' | 'lg';
};

/** Fotoğraf yerine adın baş harfini gösteren yuvarlak. */
export function Avatar({ name, size = 'sm' }: AvatarProps) {
  const initial = name.trim().charAt(0).toLocaleUpperCase('tr-TR');

  if (size === 'lg') {
    return (
      <View className="h-20 w-20 items-center justify-center rounded-full border-2 border-primary bg-primary-soft">
        <Text className="text-3xl font-black text-primary">{initial}</Text>
      </View>
    );
  }

  return (
    <View className="h-9 w-9 items-center justify-center rounded-full bg-surface-muted">
      <Text className="text-sm font-bold text-ink">{initial}</Text>
    </View>
  );
}
