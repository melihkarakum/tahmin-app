// Paylaşılan metinler (görselin yanında "metin olarak paylaş" için). Başka dosyaya bağımlı değildir.
// Uygulamada ve mağaza metinlerinde "bahis, kupon, oran" kelimeleri geçmez.
import type { HistoryItem, ProfileStats } from '@/types/domain';

export function profileShareText(
  stats: Pick<ProfileStats, 'seasonPoints' | 'exactCount' | 'seasonRank' | 'seasonTotal'>,
  seasonLabel: string | undefined,
  websiteUrl: string,
): string {
  const season = seasonLabel ? `${seasonLabel} sezonunda` : 'Bu sezon';
  const rank =
    stats.seasonRank && stats.seasonTotal
      ? ` Türkiye sıralamasında ${stats.seasonTotal} kişi arasında ${stats.seasonRank}. sıradayım!`
      : '';
  return `${season} ${stats.seasonPoints} puan topladım, ${stats.exactCount} maçı tam skor bildim.${rank} Sen de tahmin et: ${websiteUrl}`;
}

type ShareableItem = Pick<
  HistoryItem,
  'round' | 'status' | 'home' | 'away' | 'homeScore' | 'awayScore' | 'predictedHome' | 'predictedAway' | 'points' | 'resultType'
>;

export function predictionShareText(item: ShareableItem, websiteUrl: string): string {
  const match = `${item.home.name} - ${item.away.name}`;
  const guess = `${item.predictedHome}-${item.predictedAway}`;
  const finalScore = `${item.homeScore}-${item.awayScore}`;
  const invite = `Sen de tahmin et: ${websiteUrl}`;

  if (item.points !== null && item.resultType === 'exact') {
    return `${item.round}. hafta ${match} maçını ${finalScore} tam skor bildim! (+${item.points} puan) ${invite}`;
  }
  if (item.points !== null && item.resultType && item.resultType !== 'miss') {
    return `${item.round}. hafta ${match} maçının sonucunu doğru bildim! Tahminim ${guess}, maç ${finalScore} bitti. (+${item.points} puan) ${invite}`;
  }
  if (item.points !== null && item.resultType === 'miss') {
    return `${match} maçında tahminim ${guess} idi, maç ${finalScore} bitti. Bu sefer olmadı! ${invite}`;
  }
  return `${item.round}. hafta ${match} maçı için tahminim: ${guess}. ${invite}`;
}
