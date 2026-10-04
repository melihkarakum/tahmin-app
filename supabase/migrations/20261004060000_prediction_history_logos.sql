-- Profildeki "Skor Tahminlerim" ve paylaşılabilir tahmin kartı için tahmin geçmişine takım
-- logolarının depo yolu eklenir. Dönen sütunlar değiştiği için fonksiyon silinip yeniden kurulur.

drop function if exists public.get_my_prediction_history(integer);

create function public.get_my_prediction_history(p_limit integer default 50)
returns table (
  match_id bigint,
  round integer,
  kickoff_at timestamptz,
  status text,
  home_team_name text,
  home_team_short text,
  home_team_logo text,
  away_team_name text,
  away_team_short text,
  away_team_logo text,
  home_score smallint,
  away_score smallint,
  predicted_home smallint,
  predicted_away smallint,
  points smallint,
  result_type text,
  predicted_at timestamptz
)
language sql
stable
set search_path = ''
as $$
  select
    m.id,
    m.round,
    m.kickoff_at,
    m.status,
    h.name,
    h.short_name,
    h.logo_path,
    a.name,
    a.short_name,
    a.logo_path,
    m.home_score,
    m.away_score,
    p.home_goals,
    p.away_goals,
    p.points,
    p.result_type,
    p.updated_at
  from public.predictions p
  join public.matches m on m.id = p.match_id
  join public.teams h on h.id = m.home_team_id
  join public.teams a on a.id = m.away_team_id
  where p.user_id = (select auth.uid())
  order by m.kickoff_at desc
  limit greatest(1, least(coalesce(p_limit, 50), 200));
$$;

revoke execute on function public.get_my_prediction_history(integer) from public, anon;
grant execute on function public.get_my_prediction_history(integer) to authenticated;
