import { Image } from 'expo-image';
import { useState } from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui/text';
import { fonts } from '@/constants/fonts';
import { getTeamColors, readableTextColor } from '@/constants/team-colors';

type TeamCrestProps = {
  name: string;
  shortName: string;
  logoUrl?: string | null;
  size?: 'sm' | 'lg' | 'xl';
};

/**
 * Takım logosu. Logo yoksa ya da yüklenemezse (örn. logolar sunucudan kapatıldıysa)
 * kulüp renklerinde yuvarlak rozet gösterilir.
 */
export function TeamCrest({ name, shortName, logoUrl, size = 'lg' }: TeamCrestProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const dimension = size === 'xl' ? 76 : size === 'lg' ? 52 : 30;

  if (logoUrl && failedUrl !== logoUrl) {
    return (
      <Image
        source={logoUrl}
        style={{ width: dimension, height: dimension }}
        contentFit="contain"
        cachePolicy="memory-disk"
        transition={150}
        recyclingKey={logoUrl}
        accessible={false}
        onError={() => setFailedUrl(logoUrl)}
      />
    );
  }

  const { primary, secondary } = getTeamColors(name);
  return (
    <View
      style={{
        width: dimension,
        height: dimension,
        borderRadius: dimension / 2,
        backgroundColor: primary,
        borderWidth: size === 'sm' ? 2 : 3,
        borderColor: secondary,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Text
        style={{
          color: readableTextColor(primary),
          fontFamily: fonts.extrabold,
          fontSize: size === 'xl' ? 18 : size === 'lg' ? 13 : 9,
          letterSpacing: 0.5,
        }}>
        {shortName}
      </Text>
    </View>
  );
}
