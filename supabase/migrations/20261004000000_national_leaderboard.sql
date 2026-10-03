-- FAZ 11: Türkiye geneli sıralama (haftalık ve sezon).
-- Basit ve adil kural: toplam puan; eşitlikte tam skor sayısı, sonra doğru sonuç sayısı.
-- Yalnızca o dönemde en az bir tahmini puanlanmış kullanıcılar sıralamaya girer
-- (hiç tahmin yapmamış biri "son sırada" görünmez). Banlı ve silinmiş hesaplar sayılmaz.
-- Az tahminle üste çıkma sorunu toplam puanda oluşmaz; geç katılan için haftalık sıralama vardır.

create or replace function public.get_national_leaderboard(
  p_round integer default null,
  p_limit integer default 50
)
returns table (
  user_id uuid,
  username text,
  display_name text,
  points integer,
  exact_count integer,
  outcome_count integer,
  scored_count integer,
  rank integer,
  total_count integer,
  is_me boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  with season as (
    select s.id from public.seasons s where s.is_current order by s.id limit 1
  ),
  scored as (
    select p.user_id, p.points, p.result_type
    from public.predictions p
    join public.matches m on m.id = p.match_id
    where m.season_id = (select season.id from season)
      and (p_round is null or m.round = p_round)
      and p.points is not null
  ),
  totals as (
    select
      s.user_id,
      sum(s.points)::integer as points,
      (count(*) filter (where s.result_type = 'exact'))::integer as exact_count,
      (count(*) filter (where s.result_type in ('exact', 'outcome_diff', 'outcome')))::integer as outcome_count,
      count(*)::integer as scored_count
    from scored s
    join public.profiles pr on pr.id = s.user_id
    where not pr.is_banned and pr.deleted_at is null
    group by s.user_id
  ),
  ranked as (
    select
      t.user_id,
      t.points,
      t.exact_count,
      t.outcome_count,
      t.scored_count,
      (rank() over (order by t.points desc, t.exact_count desc, t.outcome_count desc))::integer as position,
      (count(*) over ())::integer as total_count
    from totals t
  )
  select
    r.user_id,
    pr.username,
    pr.display_name,
    r.points,
    r.exact_count,
    r.outcome_count,
    r.scored_count,
    r.position,
    r.total_count,
    r.user_id = (select auth.uid())
  from ranked r
  join public.profiles pr on pr.id = r.user_id
  where r.position <= greatest(1, least(coalesce(p_limit, 50), 100))
     or r.user_id = (select auth.uid())
  order by r.position, pr.display_name;
$$;

revoke execute on function public.get_national_leaderboard(integer, integer) from public, anon;
grant execute on function public.get_national_leaderboard(integer, integer) to authenticated;
