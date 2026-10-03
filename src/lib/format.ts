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

/** Örnek: "Cmt 3 Eki" */
export function formatDay(iso: string): string {
  const date = new Date(iso);
  return `${weekdayFormatter.format(date)} ${dayMonthFormatter.format(date)}`;
}

/** Örnek: "19:00" */
export function formatTime(iso: string): string {
  return timeFormatter.format(new Date(iso));
}

const dayOnlyFormatter = new Intl.DateTimeFormat('tr-TR', { day: 'numeric' });
const monthOnlyFormatter = new Intl.DateTimeFormat('tr-TR', { month: 'short' });

/** Örnek: "17–20 Eyl", "29 Eyl – 2 Eki", tek günse "3 Eki" */
export function formatDateRange(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const startMonth = monthOnlyFormatter.format(start);
  const endMonth = monthOnlyFormatter.format(end);

  if (startMonth !== endMonth) {
    return `${dayMonthFormatter.format(start)} – ${dayMonthFormatter.format(end)}`;
  }
  const startDay = dayOnlyFormatter.format(start);
  const endDay = dayOnlyFormatter.format(end);
  return startDay === endDay ? `${startDay} ${startMonth}` : `${startDay}–${endDay} ${startMonth}`;
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
