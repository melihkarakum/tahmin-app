import type { Match } from '@/types/domain';

/**
 * Bir maçın tahmin açısından durumu:
 * open (tahmin açık), locked (başladı), finished (bitti), off (ertelendi ya da iptal).
 */
export type MatchPhase = 'open' | 'locked' | 'finished' | 'off';

// Not: Bu yalnızca ekranda ne gösterileceğini belirler. Asıl kilit sunucudadır.
export function getMatchPhase(match: Match, now: number): MatchPhase {
  if (match.status === 'finished') return 'finished';
  if (match.status === 'postponed' || match.status === 'cancelled') return 'off';
  return now >= new Date(match.kickoffAt).getTime() ? 'locked' : 'open';
}

const phaseOrder: Record<MatchPhase, number> = { open: 0, locked: 1, finished: 2, off: 3 };

/** Tahmin yapılabilen maçlar üstte, sonra oynananlar, sonra bitenler, en altta ertelenenler. */
export function sortMatchesForHome(matches: Match[], now: number): Match[] {
  return [...matches].sort((a, b) => {
    const phaseA = getMatchPhase(a, now);
    const phaseB = getMatchPhase(b, now);
    if (phaseA !== phaseB) return phaseOrder[phaseA] - phaseOrder[phaseB];

    const timeA = new Date(a.kickoffAt).getTime();
    const timeB = new Date(b.kickoffAt).getTime();
    return phaseA === 'finished' ? timeB - timeA : timeA - timeB;
  });
}
