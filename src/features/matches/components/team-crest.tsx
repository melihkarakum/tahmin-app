import { View } from 'react-native';

import { Text } from '@/components/ui/text';
import { fonts } from '@/constants/fonts';
import { getTeamColors, readableTextColor } from '@/constants/team-colors';

type TeamCrestProps = {
  name: string;
  shortName: string;
  size?: 'sm' | 'lg';
};

/** Logo yerine kulüp renklerinde yuvarlak rozet. Logo kullanım hakkı netleşene kadar böyle kalır. */
export function TeamCrest({ name, shortName, size = 'lg' }: TeamCrestProps) {
  const { primary, secondary } = getTeamColors(name);
  const dimension = size === 'lg' ? 52 : 30;

  return (
    <View
      style={{
        width: dimension,
        height: dimension,
        borderRadius: dimension / 2,
        backgroundColor: primary,
        borderWidth: size === 'lg' ? 3 : 2,
        borderColor: secondary,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Text
        style={{
          color: readableTextColor(primary),
          fontFamily: fonts.extrabold,
          fontSize: size === 'lg' ? 13 : 9,
          letterSpacing: 0.5,
        }}>
        {shortName}
      </Text>
    </View>
  );
}
