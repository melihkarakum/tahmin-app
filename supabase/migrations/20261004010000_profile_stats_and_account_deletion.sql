-- FAZ 12: Profil istatistikleri, tahmin geçmişi ve hesap silme.

-- Profil istatistikleri (güncel sezon). Doğruluk: puanlanan tahminlerde doğru sonuç oranı.
-- "Son 5 hafta": içinde bitmiş maç olan son 5 haftada kazanılan puan.
create or replace function public.get_my_stats()
returns table (
  season_points integer,
  prediction_count integer,
  scored_count integer,
  exact_count integer,
  outcome_count integer,
  accuracy_percent integer,
  last_five_rounds_points integer,
  season_rank integer,
  season_total integer
)
language sql
stable
set search_path = ''
as $$
  with season as (
    select s.id from public.seasons s where s.is_current order by s.id limit 1
  ),
  mine as (
    select p.points, p.result_type, m.round
    from public.predictions p
    join public.matches m on m.id = p.match_id
    where p.user_id = (select auth.uid())
      and m.season_id = (select season.id from season)
  ),
  recent_rounds as (
    select distinct m.round
    from public.matches m
    where m.season_id = (select season.id from season) and m.status = 'finished'
    order by m.round desc
    limit 5
  ),
  rank_row as (
    select l.rank, l.total_count
    from public.get_national_leaderboard(null, 1) l
    where l.is_me
  )
  select
    coalesce(sum(mine.points), 0)::integer,
    count(*)::integer,
    count(mine.points)::integer,
    (count(*) filter (where mine.result_type = 'exact'))::integer,
    (count(*) filter (where mine.result_type in ('exact', 'outcome_diff', 'outcome')))::integer,
    case
      when count(mine.points) = 0 then null
      else round(
        100.0 * count(*) filter (where mine.result_type in ('exact', 'outcome_diff', 'outcome'))
        / count(mine.points)
      )::integer
    end,
    coalesce(
      sum(mine.points) filter (where mine.round in (select recent_rounds.round from recent_rounds)),
      0
    )::integer,
    (select rank_row.rank from rank_row),
    (select rank_row.total_count from rank_row)
  from mine;
$$;

-- Tahmin geçmişi: kullanıcının kendi tahminleri, en yeni maç önce.
-- predicted_at: tahminin en son kaydedildiği an (sunucu saati).
create or replace function public.get_my_prediction_history(p_limit integer default 50)
returns table (
  match_id bigint,
  round integer,
  kickoff_at timestamptz,
  status text,
  home_team_name text,
  home_team_short text,
  away_team_name text,
  away_team_short text,
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
    a.name,
    a.short_name,
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

-- Hesap silme (App Store kuralı: uygulama içinden silinebilmeli).
--   - Giriş bilgileri (e-posta, şifre, oturumlar) tamamen silinir.
--   - Profil silinmez, anonimleştirilir ("Silinmiş Kullanıcı"); tahmin geçmişi ve maç
--     istatistikleri bozulmaz, kişi Türkiye sıralamasında görünmez.
--   - Odalardan çıkarılır. Kurduğu odalar en eski üyeye devredilir; başka üye yoksa silinir.
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_room_id uuid;
  v_heir uuid;
begin
  if v_user_id is null then
    raise exception 'Giriş yapmalısın.' using errcode = '42501';
  end if;

  for v_room_id in select r.id from public.rooms r where r.owner_id = v_user_id loop
    select m.user_id into v_heir
    from public.room_members m
    where m.room_id = v_room_id and m.user_id <> v_user_id
    order by m.joined_at
    limit 1;

    if v_heir is null then
      delete from public.rooms where id = v_room_id;
    else
      update public.rooms set owner_id = v_heir where id = v_room_id;
    end if;
  end loop;

  delete from public.room_members where user_id = v_user_id;
  delete from public.room_join_failures where user_id = v_user_id;

  update public.profiles
  set username = 'silinmis_' || substr(md5(v_user_id::text), 1, 8),
      display_name = 'Silinmiş Kullanıcı',
      deleted_at = now(),
      terms_accepted_at = null
  where id = v_user_id;

  delete from auth.users where id = v_user_id;
end;
$$;

revoke execute on function public.get_my_stats() from public, anon;
revoke execute on function public.get_my_prediction_history(integer) from public, anon;
revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.get_my_stats() to authenticated;
grant execute on function public.get_my_prediction_history(integer) to authenticated;
grant execute on function public.delete_my_account() to authenticated;
