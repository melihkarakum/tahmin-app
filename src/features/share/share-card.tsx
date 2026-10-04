import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode, Ref } from 'react';
import { StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { colors, heroGradient, tabularNums } from '@/constants/theme';
import { TeamCrest } from '@/features/matches/components/team-crest';
import { type PredictionOutcome, predictionOutcome } from '@/features/profile/prediction-filters';
import { withAlpha } from '@/lib/color';
import { formatDay, formatLeadTime, formatLongDate, formatNumber, formatTime } from '@/lib/format';
import { trUpper } from '@/lib/text';
import type { HistoryItem, ProfileStats } from '@/types/domain';

// Kart 360x640 tasarlanır (9:16); ekranda verilen genişliğe ölçeklenir, paylaşılırken 1080x1920 yakalanır.
export const CARD_WIDTH = 360;
export const CARD_HEIGHT = 640;

const BRAND_NAME = 'tahminet';
const WEBSITE_HOST = 'tahminet.expo.app';
const PITCH_LINE = withAlpha(colors.ink, 0.05);
const PITCH_CENTER_Y = 455;

type ShareCardFrameProps = {
  /** Ekranda görünecek genişlik; yükseklik 16:9 oranından hesaplanır. */
  width: number;
  /** Üstteki ışığın rengi (tam skor altın, doğru yeşil...). */
  accent?: string;
  ref?: Ref<View>;
  children: ReactNode;
};

/**
 * Hikâye kartının çerçevesi: koyu yeşil zemin, üstte sonuca göre renkli ışık, arkada silik saha
 * çizgileri. Yakalanan görünüm budur (köşeler düz; hikâye tam ekran).
 */
export function ShareCardFrame({ width, accent = colors.primary, ref, children }: ShareCardFrameProps) {
  const scale = width / CARD_WIDTH;
  return (
    <View
      ref={ref}
      collapsable={false}
      style={{ width, height: (width * CARD_HEIGHT) / CARD_WIDTH, overflow: 'hidden', backgroundColor: colors.background }}>
      <View style={{ width: CARD_WIDTH, height: CARD_HEIGHT, transform: [{ scale }], transformOrigin: 'top left' }}>
        <LinearGradient
          colors={[heroGradient[0], colors.background, colors.background]}
          locations={[0, 0.6, 1]}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={[withAlpha(accent, 0.3), withAlpha(accent, 0)]}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 320 }}
        />
        <PitchLines />
        <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 26, paddingBottom: 22 }}>{children}</View>
      </View>
    </View>
  );
}

/** Silik orta saha çizgisi ve orta yuvarlak (süs). */
function PitchLines() {
  const radius = 120;
  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}>
      <View style={{ position: 'absolute', left: 0, right: 0, top: PITCH_CENTER_Y, height: 1.5, backgroundColor: PITCH_LINE }} />
      <View
        style={{
          position: 'absolute',
          left: CARD_WIDTH / 2 - radius,
          top: PITCH_CENTER_Y - radius,
          width: radius * 2,
          height: radius * 2,
          borderRadius: radius,
          borderWidth: 1.5,
          borderColor: PITCH_LINE,
        }}
      />
      <View
        style={{
          position: 'absolute',
          left: CARD_WIDTH / 2 - 4,
          top: PITCH_CENTER_Y - 3.25,
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: PITCH_LINE,
        }}
      />
    </View>
  );
}

function TopRow({ tag }: { tag: string }) {
  return (
    <View className="flex-row items-center justify-between">
      <View className="flex-row items-center gap-2">
        <View className="h-7 w-7 items-center justify-center rounded-full bg-primary">
          <Icon name="ball" size={16} color={colors.onPrimary} />
        </View>
        <Text className="text-lg font-black text-ink">{BRAND_NAME}</Text>
      </View>
      <View
        className="rounded-full px-3 py-1"
        style={{ borderWidth: 1, borderColor: withAlpha(colors.ink, 0.15), backgroundColor: withAlpha(colors.ink, 0.06) }}>
        <Text className="text-[11px] font-bold tracking-wider text-ink">{trUpper(tag)}</Text>
      </View>
    </View>
  );
}

function Footer({ username, displayName }: { username: string; displayName: string }) {
  const initial = (displayName || username).trim().charAt(0).toLocaleUpperCase('tr-TR');
  return (
    <View className="flex-row items-center justify-between pt-4" style={{ borderTopWidth: 1, borderTopColor: withAlpha(colors.ink, 0.1) }}>
      <View className="flex-1 flex-row items-center gap-2.5 pr-3">
        <View className="h-9 w-9 items-center justify-center rounded-full border-2 border-primary bg-primary-soft">
          <Text className="text-sm font-black text-primary">{initial}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-sm font-bold text-ink" numberOfLines={1}>
            {displayName}
          </Text>
          <Text className="text-xs text-muted" numberOfLines={1}>
            @{username}
          </Text>
        </View>
      </View>
      <View className="items-end">
        <Text className="text-xs font-bold text-primary">Sen de tahmin et</Text>
        <Text className="text-[11px] text-muted">{WEBSITE_HOST}</Text>
      </View>
    </View>
  );
}

const headlines: Record<PredictionOutcome, string> = {
  exact: 'Tam skor!',
  outcome: 'Doğru bildim!',
  miss: 'Bu sefer olmadı',
  pending: 'Tahminim hazır',
};

/** Başlık uzunsa yazı küçülür; tek satıra sığar (her platformda, otomatik küçültmeye güvenmeden). */
function headlineSize(text: string) {
  if (text.length <= 10) return { fontSize: 44, lineHeight: 52 };
  if (text.length <= 13) return { fontSize: 36, lineHeight: 44 };
  return { fontSize: 31, lineHeight: 40 };
}

/** Kartın vurgu rengi: tam skor altın, doğru yeşil, tutmayan nötr, bekleyen yeşil. */
export function shareAccent(outcome: PredictionOutcome): string {
  if (outcome === 'exact') return colors.gold;
  if (outcome === 'miss') return colors.muted;
  return colors.primary;
}

type PredictionShareCardProps = {
  item: HistoryItem;
  username: string;
  displayName: string;
};

/** "Şu maçı şu gün tahmin ettim, doğru bildim" kartı (Instagram hikâyesi, WhatsApp, DM). */
export function PredictionShareCard({ item, username, displayName }: PredictionShareCardProps) {
  const outcome = predictionOutcome(item);
  const accent = shareAccent(outcome);
  const finished = item.status === 'finished';
  const leadTime = formatLeadTime(item.predictedAt, item.kickoffAt);

  return (
    <>
      <TopRow tag={`${item.round}. hafta`} />

      <View className="mt-8 items-center">
        <Text className="text-[11px] font-bold tracking-[3px] text-muted">
          {trUpper(formatLongDate(item.kickoffAt))}
        </Text>
        <Text
          className="mt-1.5 font-black"
          style={{ color: outcome === 'miss' ? colors.ink : accent, ...headlineSize(headlines[outcome]) }}
          numberOfLines={1}
          adjustsFontSizeToFit>
          {trUpper(headlines[outcome])}
        </Text>
        {item.points !== null && item.points > 0 ? (
          <View
            className="mt-2 rounded-full px-4 py-1.5"
            style={{ backgroundColor: outcome === 'exact' ? colors.gold : colors.primarySoft }}>
            <Text
              className="text-sm font-black"
              style={[tabularNums, { color: outcome === 'exact' ? colors.background : colors.primary }]}>
              +{item.points} puan
            </Text>
          </View>
        ) : (
          <Text className="mt-2 text-sm font-semibold text-muted">
            {outcome === 'miss' ? 'Bir dahaki sefere!' : `${formatDay(item.kickoffAt)} · ${formatTime(item.kickoffAt)}`}
          </Text>
        )}
      </View>

      <View
        className="mt-7 rounded-[28px] px-5 pb-5 pt-6"
        style={{ backgroundColor: withAlpha(colors.surface, 0.88), borderWidth: 1, borderColor: withAlpha(accent, 0.35) }}>
        <View className="flex-row items-start">
          <CardTeam name={item.home.name} shortName={item.home.shortName} logoUrl={item.home.logoUrl} />
          <View className="w-12 items-center pt-7">
            <Text className="text-xs font-black tracking-widest text-muted">VS</Text>
          </View>
          <CardTeam name={item.away.name} shortName={item.away.shortName} logoUrl={item.away.logoUrl} />
        </View>

        <View className="mt-5 flex-row pt-4" style={{ borderTopWidth: 1, borderTopColor: withAlpha(colors.ink, 0.1) }}>
          <ScoreColumn label="Tahminim" value={`${item.predictedHome}-${item.predictedAway}`} color={accent} />
          <View style={{ width: 1, backgroundColor: withAlpha(colors.ink, 0.1) }} />
          <ScoreColumn
            label={finished ? 'Maç sonucu' : 'Başlama'}
            value={finished ? `${item.homeScore}-${item.awayScore}` : formatTime(item.kickoffAt)}
            color={colors.ink}
          />
        </View>
      </View>

      {leadTime ? (
        <View className="mt-4 flex-row items-center justify-center gap-1.5">
          <Icon name="clock" size={12} color={colors.muted} />
          <Text className="text-xs font-medium text-muted">{leadTime} tahmin edildi</Text>
        </View>
      ) : null}

      <View className="flex-1" />
      <Footer username={username} displayName={displayName} />
    </>
  );
}

function CardTeam({ name, shortName, logoUrl }: { name: string; shortName: string; logoUrl?: string | null }) {
  return (
    <View className="flex-1 items-center">
      <TeamCrest name={name} shortName={shortName} logoUrl={logoUrl} size="xl" />
      <Text className="mt-2.5 text-center text-[15px] font-bold text-ink" numberOfLines={2}>
        {name}
      </Text>
    </View>
  );
}

function ScoreColumn({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View className="flex-1 items-center">
      <Text className="text-[10px] font-bold tracking-[2px] text-muted">{trUpper(label)}</Text>
      <Text
        className="mt-1 text-[40px] font-black"
        style={[tabularNums, { color, lineHeight: 48 }]}
        numberOfLines={1}
        adjustsFontSizeToFit>
        {value}
      </Text>
    </View>
  );
}

type ProfileShareCardProps = {
  username: string;
  displayName: string;
  seasonLabel?: string;
  stats: ProfileStats;
};

/** Sezon özeti kartı: Türkiye sırası, puan, tam skor, doğru sonuç, doğruluk. */
export function ProfileShareCard({ username, displayName, seasonLabel, stats }: ProfileShareCardProps) {
  const initial = (displayName || username).trim().charAt(0).toLocaleUpperCase('tr-TR');
  const accent = profileShareAccent(stats);
  const tiles = [
    { label: 'Puan', value: formatNumber(stats.seasonPoints) },
    { label: 'Tam skor', value: formatNumber(stats.exactCount) },
    { label: 'Doğru sonuç', value: formatNumber(stats.outcomeCount) },
    { label: 'Doğruluk', value: stats.accuracyPercent === null ? '–' : `%${stats.accuracyPercent}` },
  ];

  return (
    <>
      <TopRow tag={seasonLabel ? `${seasonLabel} sezonu` : 'Sezon özeti'} />

      <View className="mt-9 items-center">
        <View
          className="h-24 w-24 items-center justify-center rounded-full"
          style={{ borderWidth: 3, borderColor: accent, backgroundColor: withAlpha(accent, 0.15) }}>
          <Text className="text-4xl font-black" style={{ color: accent }}>
            {initial}
          </Text>
        </View>
        <Text className="mt-3 text-2xl font-black text-ink" numberOfLines={1}>
          {displayName}
        </Text>
        <Text className="text-sm text-muted">@{username}</Text>
      </View>

      <View
        className="mt-6 items-center rounded-[28px] px-5 py-5"
        style={{ backgroundColor: withAlpha(colors.surface, 0.88), borderWidth: 1, borderColor: withAlpha(accent, 0.35) }}>
        <Text className="text-[10px] font-bold tracking-[2px] text-muted">{trUpper('Türkiye sıralaması')}</Text>
        <Text className="text-[52px] font-black" style={[tabularNums, { color: accent, lineHeight: 60 }]} numberOfLines={1} adjustsFontSizeToFit>
          {stats.seasonRank ? `#${formatNumber(stats.seasonRank)}` : '–'}
        </Text>
        <Text className="text-xs font-semibold text-muted">
          {stats.seasonTotal ? `${formatNumber(stats.seasonTotal)} kişi arasında` : 'Tahminlerim puanlandıkça'}
        </Text>

        <View className="mt-4 w-full flex-row pt-4" style={{ borderTopWidth: 1, borderTopColor: withAlpha(colors.ink, 0.1) }}>
          {tiles.map((tile, index) => (
            <View
              key={tile.label}
              className="flex-1 items-center"
              style={index === 0 ? undefined : { borderLeftWidth: 1, borderLeftColor: withAlpha(colors.ink, 0.1) }}>
              <Text className="text-xl font-black text-ink" style={tabularNums}>
                {tile.value}
              </Text>
              <Text className="mt-0.5 text-[10px] font-semibold text-muted" numberOfLines={1}>
                {tile.label}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View className="flex-1" />
      <Footer username={username} displayName={displayName} />
    </>
  );
}

/** İlk üçteyse altın, değilse yeşil. */
export function profileShareAccent(stats: Pick<ProfileStats, 'seasonRank'>): string {
  return stats.seasonRank !== null && stats.seasonRank <= 3 ? colors.gold : colors.primary;
}
