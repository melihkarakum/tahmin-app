// Maç verisi senkronu. Yalnızca zamanlayıcı (pg_cron) ve geliştirici çağırır; uygulama çağırmaz.
//   ?mode=full  : güncel sezonun tüm fikstürünü ve takımlarını günceller (günde bir kez)
//   ?mode=live  : başlamak üzere olan ya da oynanan maçların durumunu ve skorunu günceller (10 dakikada bir)
//   ?mode=probe : yalnızca API hesabını ve sezon erişimini kontrol eder, veritabanına yazmaz
//   ?mode=logos : logosu henüz kopyalanmamış takımların logosunu depoya kopyalar (full da yapar)
// Her çağrı x-sync-secret başlığında SYNC_SECRET değerini taşımalıdır.

import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';

import { isAuthorizedCall, json, serviceClient } from '../_shared/supabase.ts';
import {
  type ApiFixture,
  hasApiErrors,
  isProviderLogoUrl,
  logoPath,
  resolveResult,
  seasonName,
  shortName,
  toMatchRow,
} from '../_shared/api-football.ts';

const API_BASE = 'https://v3.football.api-sports.io';
const PROVIDER = 'api-football';
const LEAGUE_ID = Deno.env.get('API_FOOTBALL_LEAGUE_ID') ?? '203';
const LOGO_BUCKET = 'team-logos';

type ApiLeague = {
  league: { id: number; name: string; type: string };
  country: { name: string };
  seasons: { year: number; current: boolean }[];
};

type ApiTeamEntry = { team: { id: number; name: string; code: string | null } };

type ApiStatus = {
  subscription?: { plan?: string; end?: string; active?: boolean };
  requests?: { current?: number; limit_day?: number };
};

async function apiGet<T>(path: string, params: Record<string, string | number> = {}): Promise<T> {
  const apiKey = Deno.env.get('API_FOOTBALL_KEY');
  if (!apiKey) throw new Error('API_FOOTBALL_KEY tanımlı değil.');

  const url = new URL(API_BASE + path);
  for (const [name, value] of Object.entries(params)) url.searchParams.set(name, String(value));

  const response = await fetch(url, { headers: { 'x-apisports-key': apiKey } });
  if (!response.ok) throw new Error(`API-Football ${path}: HTTP ${response.status}`);

  const body = await response.json();
  if (hasApiErrors(body.errors)) {
    throw new Error(`API-Football ${path}: ${JSON.stringify(body.errors)}`);
  }
  return body.response as T;
}

async function currentSeason(): Promise<{ entry: ApiLeague; year: number }> {
  const leagues = await apiGet<ApiLeague[]>('/leagues', { id: LEAGUE_ID, current: 'true' });
  const entry = leagues[0];
  const year = entry?.seasons.find((season) => season.current)?.year ?? entry?.seasons[0]?.year;
  if (!entry || !year) throw new Error(`Lig ${LEAGUE_ID} için güncel sezon bulunamadı.`);
  return { entry, year };
}

async function probe() {
  const status = await apiGet<ApiStatus>('/status');
  const turkishLeagues = await apiGet<ApiLeague[]>('/leagues', { country: 'Turkey', type: 'league' });
  const configured = turkishLeagues.find((item) => String(item.league.id) === LEAGUE_ID);
  const year = configured?.seasons.find((season) => season.current)?.year;

  let fixtures: unknown;
  try {
    const list = year ? await apiGet<ApiFixture[]>('/fixtures', { league: LEAGUE_ID, season: year }) : [];
    fixtures = {
      ok: true,
      count: list.length,
      sample: list.slice(0, 2).map((item) => ({
        date: item.fixture.date,
        round: item.league.round,
        status: item.fixture.status.short,
        home: item.teams.home.name,
        away: item.teams.away.name,
      })),
    };
  } catch (error) {
    fixtures = { ok: false, error: String(error) };
  }

  return {
    mode: 'probe',
    plan: status.subscription,
    requests: status.requests,
    configuredLeague: configured ? { id: configured.league.id, name: configured.league.name } : null,
    currentSeason: year ?? null,
    turkishLeagues: turkishLeagues.map((item) => ({ id: item.league.id, name: item.league.name })),
    fixtures,
  };
}

/**
 * seasonOverride: geçmiş bir sezonu denemek için (örn. ücretsiz planla 2024).
 * Güncel sezon dışındaki sezonlar "güncel" olarak işaretlenmez, uygulamada görünmez.
 */
async function fullSync(seasonOverride?: number) {
  const db = serviceClient();
  const { entry, year: currentYear } = await currentSeason();
  const year = seasonOverride ?? currentYear;
  const isCurrent = year === currentYear;

  const { data: league, error: leagueError } = await db
    .from('leagues')
    .upsert(
      {
        name: entry.league.name,
        country: entry.country.name,
        provider: PROVIDER,
        provider_id: String(entry.league.id),
      },
      { onConflict: 'provider,provider_id' },
    )
    .select('id')
    .single();
  if (leagueError) throw leagueError;

  // Bir ligin tek güncel sezonu olabilir: önce diğerlerinin işareti kaldırılır.
  if (isCurrent) {
    const { error: resetError } = await db
      .from('seasons')
      .update({ is_current: false })
      .eq('league_id', league.id)
      .neq('provider_season', String(year));
    if (resetError) throw resetError;
  }

  const { data: season, error: seasonError } = await db
    .from('seasons')
    .upsert(
      { league_id: league.id, name: seasonName(year), provider_season: String(year), is_current: isCurrent },
      { onConflict: 'league_id,provider_season' },
    )
    .select('id')
    .single();
  if (seasonError) throw seasonError;

  const [fixtures, teamEntries] = await Promise.all([
    apiGet<ApiFixture[]>('/fixtures', { league: LEAGUE_ID, season: year }),
    apiGet<ApiTeamEntry[]>('/teams', { league: LEAGUE_ID, season: year }),
  ]);

  const codeByTeamId = new Map(teamEntries.map((item) => [item.team.id, item.team.code]));
  const teamRows = new Map<number, Record<string, unknown>>();
  for (const fixture of fixtures) {
    for (const team of [fixture.teams.home, fixture.teams.away]) {
      teamRows.set(team.id, {
        name: team.name,
        short_name: shortName(codeByTeamId.get(team.id), team.name),
        logo_url: team.logo,
        provider: PROVIDER,
        provider_id: String(team.id),
      });
    }
  }

  const { data: savedTeams, error: teamError } = await db
    .from('teams')
    .upsert([...teamRows.values()], { onConflict: 'provider,provider_id' })
    .select('id, provider_id');
  if (teamError) throw teamError;

  const teamIdByProviderId = new Map<string, number>(
    savedTeams.map((team: { id: number; provider_id: string }) => [team.provider_id, team.id]),
  );

  const rows = [];
  const skipped: number[] = [];
  for (const fixture of fixtures) {
    const row = toMatchRow(fixture, season.id, teamIdByProviderId, PROVIDER);
    if (row) rows.push(row);
    else skipped.push(fixture.fixture.id);
  }

  const { error: matchError } = await db.from('matches').upsert(rows, { onConflict: 'provider,provider_id' });
  if (matchError) throw matchError;

  // Ligde yeni takım varsa (örn. yükselen) logosu kopyalanır. Hata maç senkronunu bozmaz.
  let logos: unknown;
  try {
    logos = await mirrorLogos(db);
  } catch (error) {
    logos = { error: error instanceof Error ? error.message : String(error) };
  }

  return { mode: 'full', season: year, isCurrent, teams: teamRows.size, matches: rows.length, skipped, logos };
}

/**
 * Logosu henüz kopyalanmamış takımların logosunu futbol API'sinin görsel sunucusundan indirip
 * team-logos deposuna yükler. Görsel istekleri günlük API hakkından düşmez; her logo bir kez indirilir.
 */
async function mirrorLogos(db: SupabaseClient) {
  const { data: teams, error } = await db
    .from('teams')
    .select('id, provider, provider_id, logo_url')
    .is('logo_path', null)
    .not('logo_url', 'is', null);
  if (error) throw error;

  let copied = 0;
  const failed: string[] = [];
  for (const team of teams as { id: number; provider: string; provider_id: string; logo_url: string }[]) {
    try {
      if (!isProviderLogoUrl(team.logo_url)) throw new Error('izin verilmeyen adres');
      const response = await fetch(team.logo_url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const contentType = (response.headers.get('content-type') ?? '').split(';')[0].trim();
      const path = logoPath(team.provider, team.provider_id, contentType);
      if (!path) throw new Error(`desteklenmeyen dosya türü: ${contentType || 'yok'}`);

      const { error: uploadError } = await db.storage
        .from(LOGO_BUCKET)
        .upload(path, await response.arrayBuffer(), { contentType, upsert: true, cacheControl: '604800' });
      if (uploadError) throw uploadError;

      const { error: updateError } = await db.from('teams').update({ logo_path: path }).eq('id', team.id);
      if (updateError) throw updateError;
      copied += 1;
    } catch (error) {
      failed.push(`${team.provider_id}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return { mode: 'logos', copied, failed };
}

async function liveSync() {
  const db = serviceClient();
  const now = Date.now();
  const soon = new Date(now + 5 * 60_000).toISOString();
  const earliest = new Date(now - 4 * 60 * 60_000).toISOString();

  // Yalnızca başlamak üzere olan, oynanan ya da sonucu beklenen maçlar sorulur;
  // yoksa futbol API'si hiç çağrılmaz (günlük istek hakkı korunur).
  const { data: due, error } = await db
    .from('matches')
    .select('provider_id')
    .eq('provider', PROVIDER)
    .or(`status.eq.live,and(status.eq.scheduled,kickoff_at.lte.${soon},kickoff_at.gte.${earliest})`);
  if (error) throw error;
  if (due.length === 0) return { mode: 'live', checked: 0, updated: 0, apiCalls: 0 };

  let updated = 0;
  let apiCalls = 0;
  for (let index = 0; index < due.length; index += 20) {
    const ids = due.slice(index, index + 20).map((match: { provider_id: string }) => match.provider_id);
    const fixtures = await apiGet<ApiFixture[]>('/fixtures', { ids: ids.join('-') });
    apiCalls += 1;

    for (const fixture of fixtures) {
      const result = resolveResult(fixture);
      if (!result) continue;
      const { error: updateError } = await db
        .from('matches')
        .update({
          status: result.status,
          kickoff_at: fixture.fixture.date,
          home_score: result.homeScore,
          away_score: result.awayScore,
        })
        .eq('provider', PROVIDER)
        .eq('provider_id', String(fixture.fixture.id));
      if (updateError) throw updateError;
      updated += 1;
    }
  }

  return { mode: 'live', checked: due.length, updated, apiCalls };
}

Deno.serve(async (request) => {
  if (!isAuthorizedCall(request)) return json({ error: 'forbidden' }, 403);

  const params = new URL(request.url).searchParams;
  const mode = params.get('mode') ?? 'live';
  const seasonParam = params.get('season');
  try {
    if (mode === 'probe') return json(await probe());
    if (mode === 'full') return json(await fullSync(seasonParam ? Number(seasonParam) : undefined));
    if (mode === 'live') return json(await liveSync());
    if (mode === 'logos') return json(await mirrorLogos(serviceClient()));
    return json({ error: `bilinmeyen mod: ${mode}` }, 400);
  } catch (error) {
    console.error(error);
    return json({ error: error instanceof Error ? error.message : String(error) }, 500);
  }
});
