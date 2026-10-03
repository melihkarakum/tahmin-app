import { useState } from 'react';
import { View } from 'react-native';

import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { SectionTitle } from '@/components/ui/section-title';
import { Text } from '@/components/ui/text';
import { tabularNums } from '@/constants/theme';
import { signOut, toAuthMessage } from '@/features/auth/api';
import { FormError } from '@/features/auth/components/auth-screen';
import { PointsChip } from '@/features/matches/components/points-chip';
import { useMyProfile } from '@/features/profile/use-my-profile';
import { formatNumber, resultLabels } from '@/lib/format';
import { history, profileStats } from '@/mocks/data';
import type { HistoryItem } from '@/types/domain';

export default function ProfileScreen() {
  // İsim gerçek profilden gelir; istatistikler FAZ 12'ye kadar örnek veridir.
  const { data: profile } = useMyProfile();
  const stats = profileStats;
  const [signOutError, setSignOutError] = useState<string | null>(null);

  const handleSignOut = async () => {
    setSignOutError(null);
    try {
      await signOut();
    } catch (error) {
      setSignOutError(toAuthMessage(error));
    }
  };

  const displayName = profile?.display_name ?? '';

  return (
    <Screen>
      <View className="items-center pt-4">
        <Avatar name={displayName || '?'} size="lg" />
        <Text className="mt-3 text-2xl font-bold text-ink">{displayName}</Text>
        <Text className="text-sm text-muted">{profile ? `@${profile.username}` : ' '}</Text>
      </View>

      <View className="mt-6 gap-3">
        <View className="flex-row gap-3">
          <StatTile label="Sezon puanı" value={formatNumber(stats.seasonPoints)} />
          <StatTile label="Tahmin" value={formatNumber(stats.predictionCount)} />
        </View>
        <View className="flex-row gap-3">
          <StatTile label="Tam skor" value={formatNumber(stats.exactCount)} />
          <StatTile label="Doğru sonuç" value={formatNumber(stats.outcomeCount)} />
        </View>
        <View className="flex-row gap-3">
          <StatTile label="Doğruluk" value={`%${stats.accuracyPercent}`} />
          <StatTile label="Son 5 hafta" value={`+${stats.lastFiveRoundsPoints}`} />
        </View>
      </View>

      <SectionTitle title="Son Tahminler" />
      <View className="overflow-hidden rounded-2xl border border-border bg-surface">
        {history.map((item, index) => (
          <HistoryRow key={item.id} item={item} isLast={index === history.length - 1} />
        ))}
      </View>

      <View className="mt-8 gap-3">
        {signOutError ? <FormError message={signOutError} /> : null}
        <Button label="Çıkış Yap" variant="secondary" onPress={handleSignOut} />
      </View>
    </Screen>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 rounded-2xl border border-border bg-surface p-4">
      <Text className="text-xs font-medium text-muted">{label}</Text>
      <Text className="mt-1 text-2xl font-bold text-ink" style={tabularNums}>
        {value}
      </Text>
    </View>
  );
}

function HistoryRow({ item, isLast }: { item: HistoryItem; isLast: boolean }) {
  return (
    <View
      className={
        isLast
          ? 'flex-row items-center px-4 py-3'
          : 'flex-row items-center border-b border-border px-4 py-3'
      }>
      <View className="flex-1 pr-3">
        <Text className="text-sm font-semibold text-ink" numberOfLines={1} style={tabularNums}>
          {item.home.name} {item.homeScore} – {item.awayScore} {item.away.name}
        </Text>
        <Text className="mt-0.5 text-xs text-muted" style={tabularNums}>
          Tahminin {item.predictedHome} – {item.predictedAway} · {resultLabels[item.resultType]} ·{' '}
          {item.round}. Hafta
        </Text>
      </View>
      <PointsChip points={item.points} resultType={item.resultType} />
    </View>
  );
}
