import { Text, View } from 'react-native';

type TeamBadgeProps = {
  shortName: string;
};

/** Takım logosu yerine kısa adı gösteren rozet. Logo kullanım hakkı netleşene kadar böyle kalır. */
export function TeamBadge({ shortName }: TeamBadgeProps) {
  return (
    <View className="h-9 w-9 items-center justify-center rounded-full border border-border bg-surface-muted">
      <Text className="text-[11px] font-bold text-ink">{shortName}</Text>
    </View>
  );
}
