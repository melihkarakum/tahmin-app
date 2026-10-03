import { LinearGradient } from 'expo-linear-gradient';
import { View } from 'react-native';

import { Text } from '@/components/ui/text';
import { heroGradient, tabularNums } from '@/constants/theme';
import { trUpper } from '@/lib/text';

type WeekSummaryCardProps = {
  points: number;
  predicted: number;
  total: number;
  /** Haftalık sıra henüz hesaplanmıyorsa boş bırakılır. */
  rank?: number;
};

/** Ana sayfanın üstündeki "Bu hafta" özeti. */
export function WeekSummaryCard({ points, predicted, total, rank }: WeekSummaryCardProps) {
  const progress = total > 0 ? predicted / total : 0;
  const remaining = total - predicted;

  return (
    <View className="overflow-hidden rounded-3xl border border-border">
      <LinearGradient
        colors={heroGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ padding: 20 }}>
        <Text className="text-xs font-bold tracking-widest text-primary">{trUpper('Bu hafta')}</Text>
        <View className="mt-3 flex-row">
          <Stat label="Puan" value={String(points)} />
          <Stat label="Tahmin" value={`${predicted}/${total}`} />
          <Stat label="Sıran" value={rank ? `#${rank}` : '–'} />
        </View>
        <View className="mt-4 h-1.5 overflow-hidden rounded-full bg-surface-muted">
          <View className="h-full rounded-full bg-primary" style={{ width: `${progress * 100}%` }} />
        </View>
        <Text className="mt-2 text-xs text-muted">
          {total === 0
            ? 'Bu hafta için maç yok.'
            : remaining === 0
              ? 'Haftanın tüm tahminlerini yaptın.'
              : `${remaining} maç tahminini bekliyor.`}
        </Text>
      </LinearGradient>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1">
      <Text className="text-xs font-medium text-muted">{label}</Text>
      <Text className="mt-1 text-4xl font-black text-ink" style={tabularNums}>
        {value}
      </Text>
    </View>
  );
}
