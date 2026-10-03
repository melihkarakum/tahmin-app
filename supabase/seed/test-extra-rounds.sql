-- GELİŞTİRME VERİSİ: hafta hafta gezinmeyi denemek için test haftaları.
--   6. ve 7. hafta: geçmiş, skorlu maçlar
--   9. hafta: gelecek hafta, tahmine açık maçlar
-- 8. haftaya (test-round.sql) ve ona yapılmış tahminlere dokunmaz.
-- Tekrar çalıştırılabilir: zaten var olan test maçlarını değiştirmez.
-- Çalıştırma: supabase db query --linked -f supabase/seed/test-extra-rounds.sql
-- Gerçek veriye geçmeden önce test maçları silinmeli (komut test-round.sql dosyasının başında).

do $seed$
declare
  v_season bigint;
  v_today timestamp := date_trunc('day', now() at time zone 'Europe/Istanbul');
begin
  select s.id into v_season
  from public.seasons s
  join public.leagues l on l.id = s.league_id
  where l.provider = 'api-football' and l.provider_id = '203' and s.provider_season = '2026';
  if v_season is null then
    raise exception '2026-27 sezonu yok: önce supabase/seed/test-round.sql çalışmalı.';
  end if;

  insert into public.matches
    (season_id, round, home_team_id, away_team_id, kickoff_at, status, home_score, away_score, provider, provider_id)
  select
    v_season,
    fixture.round,
    home.id,
    away.id,
    (v_today + fixture.local_offset) at time zone 'Europe/Istanbul',
    fixture.status,
    fixture.home_score,
    fixture.away_score,
    'test',
    fixture.provider_id
  from (
    values
      -- 6. hafta (iki hafta önce, oynandı)
      ('test-6-1', 6, 'Galatasaray', 'Konyaspor', interval '-16 days 20 hours', 'finished', 3, 1),
      ('test-6-2', 6, 'Fenerbahçe', 'Kasımpaşa', interval '-15 days 17 hours', 'finished', 2, 0),
      ('test-6-3', 6, 'Beşiktaş', 'Göztepe', interval '-15 days 20 hours', 'finished', 1, 1),
      ('test-6-4', 6, 'Trabzonspor', 'Rizespor', interval '-14 days 17 hours', 'finished', 2, 2),
      ('test-6-5', 6, 'Başakşehir', 'Antalyaspor', interval '-14 days 20 hours', 'finished', 1, 0),
      ('test-6-6', 6, 'Samsunspor', 'Kayserispor', interval '-14 days 14 hours', 'finished', 2, 1),
      ('test-6-7', 6, 'Alanyaspor', 'Gaziantep FK', interval '-13 days 17 hours', 'finished', 0, 0),
      ('test-6-8', 6, 'Sivasspor', 'Eyüpspor', interval '-13 days 20 hours', 'finished', 1, 3),
      ('test-6-9', 6, 'Hatayspor', 'Bodrum FK', interval '-16 days 17 hours', 'finished', 0, 1),
      -- 7. hafta (geçen hafta, oynandı)
      ('test-7-1', 7, 'Fenerbahçe', 'Trabzonspor', interval '-9 days 20 hours', 'finished', 2, 1),
      ('test-7-2', 7, 'Göztepe', 'Galatasaray', interval '-8 days 20 hours', 'finished', 1, 2),
      ('test-7-3', 7, 'Konyaspor', 'Beşiktaş', interval '-8 days 17 hours', 'finished', 0, 2),
      ('test-7-4', 7, 'Kasımpaşa', 'Samsunspor', interval '-7 days 14 hours', 'finished', 1, 1),
      ('test-7-5', 7, 'Antalyaspor', 'Alanyaspor', interval '-7 days 17 hours', 'finished', 2, 0),
      ('test-7-6', 7, 'Rizespor', 'Başakşehir', interval '-7 days 20 hours', 'finished', 1, 1),
      ('test-7-7', 7, 'Kayserispor', 'Sivasspor', interval '-6 days 17 hours', 'finished', 3, 2),
      ('test-7-8', 7, 'Gaziantep FK', 'Hatayspor', interval '-6 days 20 hours', 'finished', 2, 0),
      ('test-7-9', 7, 'Eyüpspor', 'Bodrum FK', interval '-9 days 17 hours', 'finished', 1, 0),
      -- 9. hafta (gelecek hafta, tahmine açık)
      ('test-9-1', 9, 'Fenerbahçe', 'Göztepe', interval '5 days 20 hours', 'scheduled', null, null),
      ('test-9-2', 9, 'Galatasaray', 'Beşiktaş', interval '6 days 20 hours', 'scheduled', null, null),
      ('test-9-3', 9, 'Trabzonspor', 'Başakşehir', interval '6 days 17 hours', 'scheduled', null, null),
      ('test-9-4', 9, 'Konyaspor', 'Samsunspor', interval '6 days 14 hours', 'scheduled', null, null),
      ('test-9-5', 9, 'Kasımpaşa', 'Antalyaspor', interval '7 days 17 hours', 'scheduled', null, null),
      ('test-9-6', 9, 'Alanyaspor', 'Rizespor', interval '7 days 20 hours', 'scheduled', null, null),
      ('test-9-7', 9, 'Kayserispor', 'Eyüpspor', interval '8 days 17 hours', 'scheduled', null, null),
      ('test-9-8', 9, 'Sivasspor', 'Gaziantep FK', interval '8 days 20 hours', 'scheduled', null, null),
      ('test-9-9', 9, 'Bodrum FK', 'Adana Demirspor', interval '5 days 17 hours', 'scheduled', null, null)
  ) as fixture (provider_id, round, home_name, away_name, local_offset, status, home_score, away_score)
  join public.teams home on home.name = fixture.home_name and home.provider = 'api-football'
  join public.teams away on away.name = fixture.away_name and away.provider = 'api-football'
  on conflict (provider, provider_id) do nothing;
end
$seed$;
