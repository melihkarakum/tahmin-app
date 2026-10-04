import { type ReactNode, useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  type DimensionValue,
  Platform,
  type StyleProp,
  View,
  type ViewStyle,
} from 'react-native';

import { colors } from '@/constants/theme';

type SkeletonProps = {
  width?: DimensionValue;
  /** Satırda kalan genişliği paylaşır (genişlik verilmez). */
  flex?: boolean;
  height: number;
  /** Köşe yuvarlaklığı; daire için yüksekliğin yarısı. */
  radius?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * İçerik yüklenirken yerini tutan, yavaşça yanıp sönen gri kutu. "Hareketi azalt" açıksa yanıp sönmez.
 * Opaklık Animated ile verilir (className ile opaklık değiştirilmez).
 */
export function Skeleton({ width = '100%', flex = false, height, radius = 8, style }: SkeletonProps) {
  const [opacity] = useState(() => new Animated.Value(0.55));

  useEffect(() => {
    let loop: Animated.CompositeAnimation | null = null;
    let cancelled = false;
    const useNativeDriver = Platform.OS !== 'web';

    AccessibilityInfo.isReduceMotionEnabled()
      .then((reduceMotion) => {
        if (cancelled || reduceMotion) return;
        loop = Animated.loop(
          Animated.sequence([
            Animated.timing(opacity, { toValue: 1, duration: 750, useNativeDriver }),
            Animated.timing(opacity, { toValue: 0.55, duration: 750, useNativeDriver }),
          ]),
        );
        loop.start();
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      loop?.stop();
    };
  }, [opacity]);

  return (
    <Animated.View
      style={[
        flex ? { flex: 1 } : { width },
        { height, borderRadius: radius, backgroundColor: colors.surfaceMuted, opacity },
        style,
      ]}
    />
  );
}

/** Yüklenen alanı ekran okuyucuya "yükleniyor" olarak bildirir; içindeki kutular okunmaz. */
export function SkeletonGroup({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <View
      className={className}
      accessible
      accessibilityLabel="Yükleniyor"
      accessibilityRole="progressbar">
      {children}
    </View>
  );
}

/** Maç kartı biçiminde iskelet (ana sayfa). */
export function MatchCardSkeleton() {
  return (
    <View className="rounded-3xl border border-border bg-surface p-4">
      <View className="flex-row items-center justify-between">
        <Skeleton width={84} height={12} />
        <Skeleton width={72} height={22} radius={11} />
      </View>
      <View className="mt-5 flex-row items-center">
        <View className="flex-1 items-center gap-2">
          <Skeleton width={52} height={52} radius={26} />
          <Skeleton width={76} height={12} />
        </View>
        <Skeleton width={64} height={30} />
        <View className="flex-1 items-center gap-2">
          <Skeleton width={52} height={52} radius={26} />
          <Skeleton width={76} height={12} />
        </View>
      </View>
      <Skeleton height={88} radius={16} style={{ marginTop: 18 }} />
    </View>
  );
}

/** Kişi/oda satırları biçiminde iskelet (sıralama, odalar, geçmiş). bare: dış kart olmadan. */
export function RowsSkeleton({
  count = 5,
  avatar = true,
  bare = false,
}: {
  count?: number;
  avatar?: boolean;
  bare?: boolean;
}) {
  return (
    <View className={bare ? '' : 'overflow-hidden rounded-3xl border border-border bg-surface'}>
      {Array.from({ length: count }, (_, index) => (
        <View
          key={index}
          className={
            index === count - 1
              ? 'flex-row items-center gap-3 px-4 py-3.5'
              : 'flex-row items-center gap-3 border-b border-border px-4 py-3.5'
          }>
          {avatar ? <Skeleton width={36} height={36} radius={18} /> : null}
          <View className="flex-1 gap-2">
            <Skeleton width="55%" height={12} />
            <Skeleton width="35%" height={10} />
          </View>
          <Skeleton width={44} height={18} />
        </View>
      ))}
    </View>
  );
}
