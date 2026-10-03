// API-Football (v3) verisini veritabanı satırlarına çeviren saf fonksiyonlar.
// Platforma özgü kod içermez: hem Edge Function'da (Deno) hem yerel testlerde (Node) çalışır.

export type ApiTeam = {
  id: number;
  name: string;
  logo: string | null;
};

export type ApiFixture = {
  fixture: { id: number; date: string; status: { short: string } };
  league: { id: number; season: number; round: string };
  teams: { home: ApiTeam; away: ApiTeam };
  goals: { home: number | null; away: number | null };
  score: { fulltime: { home: number | null; away: number | null } };
};

export type MatchStatus = 'scheduled' | 'live' | 'finished' | 'postponed' | 'cancelled';

export type MatchRow = {
  season_id: number;
  round: number;
  home_team_id: number;
  away_team_id: number;
  kickoff_at: string;
  status: MatchStatus;
  home_score: number | null;
  away_score: number | null;
  provider: string;
  provider_id: string;
};

// API-Football maç durum kodları -> uygulamanın durumları.
// Askıya alınan / yarıda kalan maçlar (SUSP, INT) bitmiş sayılmaz.
// Hükmen (AWD), hükmen galibiyet (WO), iptal (CANC) ve terk (ABD) maçlar puanlanmaz.
const STATUS_BY_CODE: Record<string, MatchStatus> = {
  TBD: 'scheduled',
  NS: 'scheduled',
  '1H': 'live',
  HT: 'live',
  '2H': 'live',
  ET: 'live',
  BT: 'live',
  P: 'live',
  SUSP: 'live',
  INT: 'live',
  LIVE: 'live',
  FT: 'finished',
  AET: 'finished',
  PEN: 'finished',
  PST: 'postponed',
  CANC: 'cancelled',
  ABD: 'cancelled',
  AWD: 'cancelled',
  WO: 'cancelled',
};

export function mapStatus(code: string): MatchStatus | null {
  return STATUS_BY_CODE[code] ?? null;
}

/** "Regular Season - 8" -> 8 */
export function parseRound(round: string): number | null {
  const match = /(\d+)\s*$/.exec(round);
  return match ? Number(match[1]) : null;
}

/** 2026 -> "2026-27" */
export function seasonName(year: number): string {
  return `${year}-${String((year + 1) % 100).padStart(2, '0')}`;
}

/** Takımın kısa adı: API'nin verdiği kod, yoksa adın ilk üç harfi. */
export function shortName(code: string | null | undefined, name: string): string {
  const source = code?.trim() || name.replace(/[^\p{L}\p{N}]/gu, '').slice(0, 3);
  return source.toLocaleUpperCase('tr-TR');
}

/**
 * Maçın kaydedilecek durumu ve skoru. Puanlamada normal süre skoru kullanılır (uzatmalar hariç).
 * API maçı bitti diye işaretleyip skoru henüz vermediyse maç "oynanıyor" sayılır;
 * böylece skorsuz bitmiş maç oluşmaz ve sonraki kontrolde tekrar denenir.
 */
export function resolveResult(fixture: ApiFixture): {
  status: MatchStatus;
  homeScore: number | null;
  awayScore: number | null;
} | null {
  const status = mapStatus(fixture.fixture.status.short);
  if (status === null) return null;
  if (status !== 'finished') return { status, homeScore: null, awayScore: null };

  const homeScore = fixture.score.fulltime.home ?? fixture.goals.home;
  const awayScore = fixture.score.fulltime.away ?? fixture.goals.away;
  if (homeScore === null || awayScore === null) {
    return { status: 'live', homeScore: null, awayScore: null };
  }
  return { status, homeScore, awayScore };
}

/** Bir API maçını veritabanı satırına çevirir; eksik/okunamayan veri varsa null döner. */
export function toMatchRow(
  fixture: ApiFixture,
  seasonId: number,
  teamIdByProviderId: Map<string, number>,
  provider: string,
): MatchRow | null {
  const result = resolveResult(fixture);
  const round = parseRound(fixture.league.round);
  const homeTeamId = teamIdByProviderId.get(String(fixture.teams.home.id));
  const awayTeamId = teamIdByProviderId.get(String(fixture.teams.away.id));

  if (!result || round === null || round < 1 || !homeTeamId || !awayTeamId) return null;

  return {
    season_id: seasonId,
    round,
    home_team_id: homeTeamId,
    away_team_id: awayTeamId,
    kickoff_at: fixture.fixture.date,
    status: result.status,
    home_score: result.homeScore,
    away_score: result.awayScore,
    provider,
    provider_id: String(fixture.fixture.id),
  };
}

/** API-Football yanıtında hata var mı? (errors alanı boş dizi ya da dolu nesne olabilir) */
export function hasApiErrors(errors: unknown): boolean {
  if (Array.isArray(errors)) return errors.length > 0;
  return typeof errors === 'object' && errors !== null && Object.keys(errors).length > 0;
}
