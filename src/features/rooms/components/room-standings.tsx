import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { PressableOpacity } from '@/components/ui/pressable-opacity';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { RowsSkeleton, SkeletonGroup } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { colors, medalColors, tabularNums } from '@/constants/theme';
import { RankRow } from '@/features/leaderboard/components/rank-row';
import { formatNumber } from '@/lib/format';
import { trUpper } from '@/lib/text';
import type { LeaderboardRow, LeaderboardScope } from '@/types/domain';

const scopeOptions: { value: LeaderboardScope; label: string }[] = [
  { value: 'week', label: 'Bu Hafta' },
  { value: 'season', label: 'Sezon' },
];

type RoomStandingsProps = {
  rows: LeaderboardRow[];
  scope: LeaderboardScope;
  onScopeChange: (scope: LeaderboardScope) => void;
  /** Başlığın sağında: "8. hafta" ya da "2026-27 sezonu". */
  context?: string;
  isLoading: boolean;
  /** Önceki seçimin listesi gösterilirken yenisi yükleniyor. */
  isSwitching?: boolean;
  hasError: boolean;
  onRetry: () => void;
  /** Oda sahibi için: üyeye dokununca seçenekler (kendisi hariç). */
  onMemberPress?: (row: LeaderboardRow) => void;
};

/** Oda sıralaması: Bu Hafta / Sezon seçimi, ilk üç için kürsü, kalanlar için liste. */
export function RoomStandings({
  rows,
  scope,
  onScopeChange,
  context,
  isLoading,
  isSwitching = false,
  hasError,
  onRetry,
  onMemberPress,
}: RoomStandingsProps) {
  const hasScores = rows.some((row) => (row.scoredCount ?? 0) > 0);
  // Kürsü yalnızca puan alan varken anlamlı: herkes 0 puandayken herkes "1." olur.
  const showPodium = rows.length >= 2 && rows[0].points > 0;
  const listRows = showPodium ? rows.slice(3) : rows;
  const pressHandler = (row: LeaderboardRow) =>
    onMemberPress && !row.isMe ? () => onMemberPress(row) : undefined;

  return (
    <View>
      <View className="flex-row items-end justify-between">
        <Text className="text-xl font-bold text-ink">Sıralama</Text>
        {context ? <Text className="text-xs font-semibold text-muted">{context}</Text> : null}
      </View>
      <View className="mt-3">
        <SegmentedControl options={scopeOptions} value={scope} onChange={onScopeChange} />
      </View>

      {isLoading ? (
        <SkeletonGroup className="mt-4">
          <RowsSkeleton count={4} />
        </SkeletonGroup>
      ) : hasError ? (
        <View className="mt-4 items-center gap-3 rounded-3xl border border-border bg-surface p-6">
          <Text className="text-center text-sm text-muted">Sıralama yüklenemedi.</Text>
          <Button label="Tekrar dene" variant="secondary" onPress={onRetry} />
        </View>
      ) : (
        <View className="mt-4 gap-3" style={{ opacity: isSwitching ? 0.5 : 1 }}>
          {hasScores ? null : <NoScoresNote scope={scope} />}
          {showPodium ? (
            <Podium rows={rows} pressHandler={pressHandler} />
          ) : null}
          {listRows.length > 0 ? (
            <View className="overflow-hidden rounded-3xl border border-border bg-surface">
              {listRows.map((row, index) => (
                <RankRow
                  key={row.userId}
                  row={row}
                  showRank={hasScores}
                  isLast={index === listRows.length - 1}
                  onPress={pressHandler(row)}
                />
              ))}
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
}

function NoScoresNote({ scope }: { scope: LeaderboardScope }) {
  return (
    <View className="flex-row items-center gap-3 rounded-3xl border border-border bg-surface p-4">
      <View className="h-10 w-10 items-center justify-center rounded-2xl bg-primary-soft">
        <Icon name="leaderboard" size={18} color={colors.primary} />
      </View>
      <View className="flex-1">
        <Text className="text-sm font-bold text-ink">Henüz puan yok</Text>
        <Text className="mt-0.5 text-xs text-muted">
          {scope === 'week'
            ? 'Bu haftanın maçları bittikçe puanlar burada görünür.'
            : 'Oda kurulduktan sonra başlayan maçlar bittikçe puanlar burada görünür.'}
        </Text>
      </View>
    </View>
  );
}

// Kürsü basamaklarının yüksekliği (birinci en yüksek).
const PEDESTAL_HEIGHTS = { 1: 70, 2: 52, 3: 40 } as const;

function Podium({
  rows,
  pressHandler,
}: {
  rows: LeaderboardRow[];
  pressHandler: (row: LeaderboardRow) => (() => void) | undefined;
}) {
  const top = rows.slice(0, 3);
  // Ortada birinci, solda ikinci, sağda üçüncü.
  const order = top.length === 2 ? [1, 0] : [1, 0, 2];

  return (
    <View className="flex-row items-end gap-2 overflow-hidden rounded-3xl border border-border bg-surface px-3 pt-5">
      {order.map((index) => {
        const row = top[index];
        return (
          <PodiumColumn
            key={row.userId}
            row={row}
            place={(index + 1) as 1 | 2 | 3}
            onPress={pressHandler(row)}
          />
        );
      })}
    </View>
  );
}

function PodiumColumn({
  row,
  place,
  onPress,
}: {
  row: LeaderboardRow;
  place: 1 | 2 | 3;
  onPress?: () => void;
}) {
  // Renk gerçek sıraya göre (eşitlikte iki altın olabilir), yükseklik kürsüdeki yere göre.
  const medal = medalColors[Math.min(row.rank, 3) as 1 | 2 | 3];
  const avatarSize = place === 1 ? 60 : 48;
  const initial = row.displayName.trim().charAt(0).toLocaleUpperCase('tr-TR');

  const content = (
    <View className="items-center">
      <View
        className="items-center justify-center bg-surface-muted"
        style={{
          width: avatarSize,
          height: avatarSize,
          borderRadius: avatarSize / 2,
          borderWidth: 3,
          borderColor: medal,
        }}>
        <Text className={place === 1 ? 'text-2xl font-black text-ink' : 'text-lg font-black text-ink'}>
          {initial}
        </Text>
      </View>
      <Text
        className={row.isMe ? 'mt-2 text-sm font-bold text-primary' : 'mt-2 text-sm font-bold text-ink'}
        numberOfLines={1}>
        {row.displayName}
      </Text>
      {row.isMe ? (
        <Text className="text-[10px] font-bold tracking-widest text-primary">{trUpper('sen')}</Text>
      ) : null}
      <View className="mt-1 flex-row items-baseline gap-1">
        <Text className="text-xl font-black text-ink" style={tabularNums}>
          {formatNumber(row.points)}
        </Text>
        <Text className="text-xs text-muted">puan</Text>
      </View>
      <View
        className="mt-2 w-full items-center justify-center rounded-t-2xl bg-surface-muted"
        style={{ height: PEDESTAL_HEIGHTS[place], borderTopWidth: 3, borderTopColor: medal }}>
        <Text className="text-2xl font-black" style={{ color: medal }}>
          {row.rank}
        </Text>
      </View>
    </View>
  );

  const label = `${row.rank}. ${row.displayName}, ${row.points} puan`;
  return (
    <View className="flex-1">
      {onPress ? (
        <PressableOpacity onPress={onPress} accessibilityLabel={`${label}. Seçenekler`}>
          {content}
        </PressableOpacity>
      ) : (
        <View accessible accessibilityLabel={label}>
          {content}
        </View>
      )}
    </View>
  );
}
