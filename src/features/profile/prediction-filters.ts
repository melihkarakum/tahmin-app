// "Skor Tahminlerim" süzgeçleri. Başka dosyaya bağımlı değildir (testlerde de çalışır).
import type { HistoryItem } from '@/types/domain';

/** Bir tahminin sonucu: tam skor, doğru sonuç (gol farkı dahil), tutmadı ya da henüz puanlanmadı. */
export type PredictionOutcome = 'exact' | 'outcome' | 'miss' | 'pending';

export type PredictionFilter = 'all' | 'correct' | 'exact' | 'miss' | 'pending';

export const PREDICTION_FILTERS: PredictionFilter[] = ['all', 'correct', 'exact', 'miss', 'pending'];

export const filterLabels: Record<PredictionFilter, string> = {
  all: 'Tümü',
  correct: 'Doğru',
  exact: 'Tam Skor',
  miss: 'Yanlış',
  pending: 'Bekleyen',
};

type Scored = Pick<HistoryItem, 'points' | 'resultType'>;

export function predictionOutcome(item: Scored): PredictionOutcome {
  if (item.points === null || item.resultType === null) return 'pending';
  if (item.resultType === 'exact') return 'exact';
  if (item.resultType === 'miss') return 'miss';
  return 'outcome';
}

/** "Doğru" süzgeci tam skorları da kapsar (puan alan her tahmin). */
export function matchesFilter(item: Scored, filter: PredictionFilter): boolean {
  const outcome = predictionOutcome(item);
  switch (filter) {
    case 'all':
      return true;
    case 'correct':
      return outcome === 'exact' || outcome === 'outcome';
    default:
      return outcome === filter;
  }
}

export function filterCounts(items: Scored[]): Record<PredictionFilter, number> {
  const counts: Record<PredictionFilter, number> = { all: 0, correct: 0, exact: 0, miss: 0, pending: 0 };
  for (const item of items) {
    for (const filter of PREDICTION_FILTERS) {
      if (matchesFilter(item, filter)) counts[filter] += 1;
    }
  }
  return counts;
}
