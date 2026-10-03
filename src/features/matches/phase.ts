import type { Match } from '@/types/domain';

/** Bir maçın tahmin açısından durumu: açık, kilitli (başladı) ya da bitti. */
export type MatchPhase = 'open' | 'locked' | 'finished';

// Not: Bu yalnızca ekranda ne gösterileceğini belirler. Asıl kilit sunucudadır (FAZ 8).
export function getMatchPhase(match: Match, now: number): MatchPhase {
  if (match.status === 'finished') return 'finished';
  return now >= new Date(match.kickoffAt).getTime() ? 'locked' : 'open';
}

const phaseOrder: Record<MatchPhase, number> = { open: 0, locked: 1, finished: 2 };

/** Tahmin yapılabilen maçlar üstte, sonra oynananlar, en altta bitenler. */
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
