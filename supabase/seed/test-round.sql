-- GELİŞTİRME VERİSİ: ücretli futbol API planı alınana kadar uygulamayı denemek için bir test haftası.
-- Çalıştırma: supabase db query --linked -f supabase/seed/test-round.sql
-- Tekrar çalıştırılabilir: önceki test maçlarını ve onlara yapılan tahminleri silip şu ana göre yenilerini ekler
-- (3 bitmiş, 1 oynanıyor, 1 iki saat içinde, 4 önümüzdeki günlerde).
--
-- Gerçek veriye geçmeden ÖNCE test maçları silinmeli:
--   delete from public.predictions where match_id in (select id from public.matches where provider = 'test');
--   delete from public.matches where provider = 'test';

do $seed$
declare
  v_league bigint;
  v_season bigint;
  v_today timestamp := date_trunc('day', now() at time zone 'Europe/Istanbul');
  v_hour timestamptz := date_trunc('hour', now());
begin
  select id into v_league
  from public.leagues
  where provider = 'api-football' and provider_id = '203';
  if v_league is null then
    raise exception 'Süper Lig kaydı yok: önce sync-matches fonksiyonu bir kez çalışmalı.';
  end if;

  -- 2026-27 sezonu. Gerçek senkron da aynı satırı (lig + "2026") kullanır.
  update public.seasons set is_current = false where league_id = v_league and provider_season <> '2026';
  insert into public.seasons (league_id, name, provider_season, is_current)
  values (v_league, '2026-27', '2026', true)
  on conflict (league_id, provider_season) do update set is_current = true
  returning id into v_season;

  delete from public.predictions
  where match_id in (select id from public.matches where provider = 'test');
  delete from public.matches where provider = 'test';

  insert into public.matches
    (season_id, round, home_team_id, away_team_id, kickoff_at, status, home_score, away_score, provider, provider_id)
  select
    v_season,
    8,
    home.id,
    away.id,
    fixture.kickoff_at,
    fixture.status,
    fixture.home_score,
    fixture.away_score,
    'test',
    fixture.provider_id
  from (
    values
      ('test-1', 'Trabzonspor', 'Konyaspor', (v_today + interval '-1 day 17 hours') at time zone 'Europe/Istanbul', 'finished', 2, 0),
      ('test-2', 'Samsunspor', 'Göztepe', (v_today + interval '-1 day 20 hours') at time zone 'Europe/Istanbul', 'finished', 1, 1),
      ('test-3', 'Kasımpaşa', 'Alanyaspor', (v_today + interval '-2 days 20 hours') at time zone 'Europe/Istanbul', 'finished', 3, 1),
      ('test-4', 'Beşiktaş', 'Başakşehir', v_hour - interval '30 minutes', 'live', null, null),
      ('test-5', 'Galatasaray', 'Fenerbahçe', v_hour + interval '2 hours', 'scheduled', null, null),
      ('test-6', 'Antalyaspor', 'Rizespor', (v_today + interval '1 day 17 hours') at time zone 'Europe/Istanbul', 'scheduled', null, null),
      ('test-7', 'Gaziantep FK', 'Kayserispor', (v_today + interval '1 day 20 hours') at time zone 'Europe/Istanbul', 'scheduled', null, null),
      ('test-8', 'Eyüpspor', 'Sivasspor', (v_today + interval '2 days 17 hours') at time zone 'Europe/Istanbul', 'scheduled', null, null),
      ('test-9', 'Bodrum FK', 'Hatayspor', (v_today + interval '2 days 20 hours') at time zone 'Europe/Istanbul', 'scheduled', null, null)
  ) as fixture (provider_id, home_name, away_name, kickoff_at, status, home_score, away_score)
  join public.teams home on home.name = fixture.home_name and home.provider = 'api-football'
  join public.teams away on away.name = fixture.away_name and away.provider = 'api-football';
end
$seed$;
