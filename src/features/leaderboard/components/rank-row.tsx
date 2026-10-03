import { View } from 'react-native';

import { Avatar } from '@/components/ui/avatar';
import { Text } from '@/components/ui/text';
import { medalColors, tabularNums } from '@/constants/theme';
import { formatNumber } from '@/lib/format';
import type { LeaderboardRow } from '@/types/domain';

type RankRowProps = {
  row: LeaderboardRow;
  isLast?: boolean;
};

export function RankRow({ row, isLast = false }: RankRowProps) {
  const borderClass = isLast ? '' : 'border-b border-border';
  const backgroundClass = row.isMe ? 'bg-primary-soft' : '';
  const medal = row.rank <= 3 ? medalColors[row.rank as 1 | 2 | 3] : null;

  return (
    <View className={`flex-row items-center px-4 py-3 ${borderClass} ${backgroundClass}`}>
      <View className="w-10">
        {medal ? (
          <View
            className="h-7 w-7 items-center justify-center rounded-full"
            style={{ backgroundColor: medal }}>
            <Text className="text-xs font-black text-background">{row.rank}</Text>
          </View>
        ) : (
          <Text className="w-7 text-center text-sm font-bold text-muted" style={tabularNums}>
            {row.rank}
          </Text>
        )}
      </View>

      <Avatar name={row.displayName} />

      <View className="ml-3 flex-1">
        <Text className="text-base font-bold text-ink" numberOfLines={1}>
          {row.isMe ? `${row.displayName} (sen)` : row.displayName}
        </Text>
        <Text className="text-xs text-muted">{row.exactCount} tam skor</Text>
      </View>

      <Text className="text-lg font-black text-ink" style={tabularNums}>
        {formatNumber(row.points)}
      </Text>
      <Text className="ml-1 text-xs text-muted">puan</Text>
    </View>
  );
}
