import type { ResultType } from '@/types/domain';

const weekdayFormatter = new Intl.DateTimeFormat('tr-TR', { weekday: 'short' });
const dayMonthFormatter = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short' });
const timeFormatter = new Intl.DateTimeFormat('tr-TR', { hour: '2-digit', minute: '2-digit' });
const numberFormatter = new Intl.NumberFormat('tr-TR');

/** Örnek: "Cmt 3 Eki · 19:00" */
export function formatKickoff(iso: string): string {
  const date = new Date(iso);
  return `${weekdayFormatter.format(date)} ${dayMonthFormatter.format(date)} · ${timeFormatter.format(date)}`;
}

/** Örnek: 1842 -> "1.842" */
export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

/** Örnek: "2 sa 14 dk", "14 dk", "1 gün 3 sa" */
export function formatCountdown(msLeft: number): string {
  const totalMinutes = Math.max(1, Math.ceil(msLeft / 60_000));
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return hours > 0 ? `${days} gün ${hours} sa` : `${days} gün`;
  if (hours > 0) return minutes > 0 ? `${hours} sa ${minutes} dk` : `${hours} sa`;
  return `${minutes} dk`;
}

export const resultLabels: Record<ResultType, string> = {
  exact: 'Tam skor',
  outcome_diff: 'Sonuç + gol farkı',
  outcome: 'Doğru sonuç',
  miss: 'Tutmadı',
};
