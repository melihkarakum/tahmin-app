-- Oda sıralaması kuralı: bir odada yalnızca oda KURULDUKTAN SONRA başlayan maçlar sayılır.
-- Herkes aynı başlangıç çizgisinden başlar. Sonradan katılan üye, oda kurulduktan sonraki
-- maçlara (katılmadan önce bile) yaptığı tahminlerin puanını alır; tahminler maç başlamadan
-- kilitlendiği için bunda haksızlık yoktur. Türkiye sıralaması bu kuraldan etkilenmez.

create or replace function public.get_room_leaderboard(p_room_id uuid, p_round integer default null)
returns table (
  user_id uuid,
  username text,
  display_name text,
  points integer,
  exact_count integer,
  outcome_count integer,
  scored_count integer,
  rank integer
)
language plpgsql
stable
security definer
set search_path = ''
as $$
#variable_conflict use_column
begin
  if not private.is_room_member(p_room_id) then
    raise exception 'Bu odanın üyesi değilsin.' using errcode = '42501';
  end if;

  return query
  with room as (
    select r.created_at from public.rooms r where r.id = p_room_id
  ),
  season as (
    select s.id from public.seasons s where s.is_current order by s.id limit 1
  ),
  scored as (
    select p.user_id, p.points, p.result_type
    from public.predictions p
    join public.matches m on m.id = p.match_id
    where m.season_id = (select season.id from season)
      and m.kickoff_at >= (select room.created_at from room)
      and (p_round is null or m.round = p_round)
      and p.points is not null
  ),
  totals as (
    select
      rm.user_id,
      coalesce(sum(s.points), 0)::integer as points,
      (count(*) filter (where s.result_type = 'exact'))::integer as exact_count,
      (count(*) filter (where s.result_type in ('exact', 'outcome_diff', 'outcome')))::integer as outcome_count,
      count(s.points)::integer as scored_count
    from public.room_members rm
    left join scored s on s.user_id = rm.user_id
    where rm.room_id = p_room_id
    group by rm.user_id
  )
  select
    t.user_id,
    pr.username,
    pr.display_name,
    t.points,
    t.exact_count,
    t.outcome_count,
    t.scored_count,
    (rank() over (order by t.points desc, t.exact_count desc, t.outcome_count desc))::integer
  from totals t
  join public.profiles pr on pr.id = t.user_id
  where not pr.is_banned
  order by 8, pr.display_name;
end;
$$;

create or replace function public.get_my_rooms()
returns table (
  id uuid,
  name text,
  code text,
  is_owner boolean,
  member_count integer,
  my_rank integer,
  leader_name text,
  leader_points integer
)
language sql
stable
security definer
set search_path = ''
as $$
  with me as (
    select (select auth.uid()) as uid
  ),
  my_rooms as (
    select r.id, r.name, r.code, r.owner_id, r.created_at
    from public.rooms r
    join public.room_members rm on rm.room_id = r.id
    where rm.user_id = (select me.uid from me)
  ),
  season as (
    select s.id from public.seasons s where s.is_current order by s.id limit 1
  ),
  totals as (
    select
      rm.room_id,
      rm.user_id,
      coalesce(sum(p.points), 0)::integer as points,
      count(*) filter (where p.result_type = 'exact') as exact_count,
      count(*) filter (where p.result_type in ('exact', 'outcome_diff', 'outcome')) as outcome_count
    from public.room_members rm
    join my_rooms r on r.id = rm.room_id
    join public.profiles pr on pr.id = rm.user_id and not pr.is_banned
    left join public.predictions p
      on p.user_id = rm.user_id
      and p.points is not null
      and exists (
        select 1
        from public.matches m
        where m.id = p.match_id
          and m.season_id = (select season.id from season)
          and m.kickoff_at >= r.created_at
      )
    group by rm.room_id, rm.user_id
  ),
  ranked as (
    select
      t.room_id,
      t.user_id,
      t.points,
      rank() over (partition by t.room_id order by t.points desc, t.exact_count desc, t.outcome_count desc) as position,
      row_number() over (partition by t.room_id order by t.points desc, t.exact_count desc, t.outcome_count desc) as row_number
    from totals t
  )
  select
    r.id,
    r.name,
    r.code,
    r.owner_id = (select me.uid from me),
    (select count(*) from public.room_members m where m.room_id = r.id)::integer,
    (select k.position from ranked k where k.room_id = r.id and k.user_id = (select me.uid from me))::integer,
    (
      select pr.display_name
      from ranked k
      join public.profiles pr on pr.id = k.user_id
      where k.room_id = r.id and k.row_number = 1
    ),
    (select k.points from ranked k where k.room_id = r.id and k.row_number = 1)::integer
  from my_rooms r
  order by r.created_at;
$$;
