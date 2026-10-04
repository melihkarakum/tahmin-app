import { View } from 'react-native';

import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { PressableOpacity } from '@/components/ui/pressable-opacity';
import { Text } from '@/components/ui/text';
import { colors, tabularNums } from '@/constants/theme';
import { formatNumber } from '@/lib/format';
import type { ProfileStats } from '@/types/domain';

type ProfileHeaderProps = {
  username: string;
  displayName: string;
  /** Örnek: "2026-27 sezonu". */
  seasonLabel?: string;
  stats?: ProfileStats;
  onOpenSettings: () => void;
  onEditProfile: () => void;
  onShareProfile: () => void;
};

/**
 * Instagram düzeninde profil başı: üstte kullanıcı adı ve ayarlar; avatarın yanında üç sayı;
 * altında ad, kısa bilgi ve iki düğme.
 */
export function ProfileHeader({
  username,
  displayName,
  seasonLabel,
  stats,
  onOpenSettings,
  onEditProfile,
  onShareProfile,
}: ProfileHeaderProps) {
  const rank = stats?.seasonRank ? `#${formatNumber(stats.seasonRank)}` : '–';
  const bio = stats?.seasonRank && stats.seasonTotal
    ? `${seasonLabel ? `${seasonLabel} · ` : ''}Türkiye'de ${formatNumber(stats.seasonTotal)} kişi arasında`
    : seasonLabel
      ? `${seasonLabel} · Tahminlerin puanlandıkça sıralamaya girersin`
      : ' ';

  return (
    <View>
      <View className="flex-row items-center justify-between">
        <Text className="flex-1 pr-3 text-2xl font-extrabold text-ink" numberOfLines={1}>
          {username}
        </Text>
        <PressableOpacity onPress={onOpenSettings} hitSlop={10} accessibilityLabel="Ayarlar">
          <Icon name="settings" size={24} color={colors.ink} />
        </PressableOpacity>
      </View>

      <View className="mt-5 flex-row items-center">
        <Avatar name={displayName || username || '?'} size="lg" />
        <View className="ml-4 flex-1 flex-row justify-around">
          <HeaderStat value={stats ? formatNumber(stats.seasonPoints) : '–'} label="Puan" />
          <HeaderStat value={stats ? formatNumber(stats.predictionCount) : '–'} label="Tahmin" />
          <HeaderStat value={rank} label="Sıra" />
        </View>
      </View>

      <Text className="mt-3 text-base font-bold text-ink" numberOfLines={1}>
        {displayName || ' '}
      </Text>
      <Text className="mt-0.5 text-sm text-muted" numberOfLines={2}>
        {bio}
      </Text>

      <View className="mt-4 flex-row gap-2">
        <Button label="Profili Düzenle" variant="secondary" size="sm" onPress={onEditProfile} style={{ flex: 1 }} />
        <Button label="Profili Paylaş" variant="secondary" size="sm" onPress={onShareProfile} style={{ flex: 1 }} />
      </View>
    </View>
  );
}

function HeaderStat({ value, label }: { value: string; label: string }) {
  return (
    <View className="items-center">
      <Text className="text-xl font-extrabold text-ink" style={tabularNums}>
        {value}
      </Text>
      <Text className="text-xs font-medium text-muted">{label}</Text>
    </View>
  );
}

/** Profil başının altında dört küçük istatistik (Instagram'daki öne çıkanlar gibi tek satır). */
export function ProfileHighlights({ stats }: { stats: ProfileStats }) {
  const items = [
    { label: 'Tam skor', value: formatNumber(stats.exactCount) },
    { label: 'Doğru sonuç', value: formatNumber(stats.outcomeCount) },
    { label: 'Doğruluk', value: stats.accuracyPercent === null ? '–' : `%${stats.accuracyPercent}` },
    { label: 'Son 5 hafta', value: `+${formatNumber(stats.lastFiveRoundsPoints)}` },
  ];

  return (
    <View className="flex-row rounded-3xl border border-border bg-surface py-3.5">
      {items.map((item, index) => (
        <View
          key={item.label}
          className={index === 0 ? 'flex-1 items-center px-1' : 'flex-1 items-center border-l border-border px-1'}>
          <Text className="text-lg font-extrabold text-ink" style={tabularNums}>
            {item.value}
          </Text>
          <Text className="mt-0.5 text-[11px] font-medium text-muted" numberOfLines={1}>
            {item.label}
          </Text>
        </View>
      ))}
    </View>
  );
}
