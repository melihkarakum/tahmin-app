-- FAZ 10: Arkadaş odaları — oda kurma, kodla katılma, oda sıralaması.
-- Odadan ayrılma, üye çıkarma, oda adını değiştirme ve silme FAZ 4'teki RLS kurallarıyla zaten mümkün.

-- Sınırlar ---------------------------------------------------------------------------
--   bir kullanıcı en fazla 10 oda kurabilir, en fazla 20 odada bulunabilir
--   bir odada en fazla 50 üye olabilir
--   15 dakikada 10 yanlış kod denemesinden sonra katılma geçici olarak durur

-- Yanlış kod denemeleri (kod tahminiyle başkasının odasına girmeyi zorlaştırmak için).
create table public.room_join_failures (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id),
  attempted_at timestamptz not null default now()
);

create index room_join_failures_user_time_idx on public.room_join_failures (user_id, attempted_at);

alter table public.room_join_failures enable row level security;
revoke all on table public.room_join_failures from anon, authenticated;

-- Yardımcılar (API'ye kapalı private şemasında) -----------------------------------------

-- Giriş yapmış ve banlı olmayan kullanıcının kimliği; değilse hata.
create or replace function private.current_active_user()
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_is_banned boolean;
begin
  if v_user_id is null then
    raise exception 'Giriş yapmalısın.' using errcode = '42501';
  end if;
  select p.is_banned into v_is_banned from public.profiles p where p.id = v_user_id;
  if v_is_banned is null or v_is_banned then
    raise exception 'Bu hesapla işlem yapılamaz.' using errcode = '42501';
  end if;
  return v_user_id;
end;
$$;

-- 6 karakterlik oda kodu. Rastgelelik gen_random_uuid()'den gelir (güçlü rastgele sayı üreteci).
-- Alfabe 32 karakter: birbirine karışan 0/O ve 1/I yok.
create or replace function private.generate_room_code()
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  random_bytes bytea := uuid_send(gen_random_uuid());
  code text := '';
begin
  for i in 0..5 loop
    code := code || substr(alphabet, (get_byte(random_bytes, i) % 32) + 1, 1);
  end loop;
  return code;
end;
$$;

revoke execute on function private.current_active_user() from public, anon, authenticated;
revoke execute on function private.generate_room_code() from public, anon, authenticated;

-- Oda kurma -----------------------------------------------------------------------------
create or replace function public.create_room(p_name text)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := private.current_active_user();
  v_name text := btrim(coalesce(p_name, ''));
  v_room public.rooms;
begin
  if char_length(v_name) < 2 or char_length(v_name) > 40 then
    raise exception 'Oda adı 2-40 karakter olmalı.' using errcode = '22023';
  end if;

  if (select count(*) from public.rooms r where r.owner_id = v_user_id) >= 10 then
    raise exception 'En fazla 10 oda kurabilirsin.';
  end if;

  if (select count(*) from public.room_members m where m.user_id = v_user_id) >= 20 then
    raise exception 'En fazla 20 odada bulunabilirsin.';
  end if;

  -- Aynı kod çok düşük ihtimalle denk gelirse yeni kodla tekrar denenir.
  for attempt in 1..5 loop
    begin
      insert into public.rooms (name, code, owner_id)
      values (v_name, private.generate_room_code(), v_user_id)
      returning * into v_room;
      exit;
    exception when unique_violation then
      if attempt = 5 then
        raise;
      end if;
    end;
  end loop;

  insert into public.room_members (room_id, user_id) values (v_room.id, v_user_id);
  return v_room;
end;
$$;

-- Kodla katılma -------------------------------------------------------------------------
-- Hata fırlatmak yerine durum döner; böylece yanlış kod denemesi kaydedilebilir.
--   joined | already_member | not_found | room_full | too_many_rooms | rate_limited
create or replace function public.join_room(p_code text)
returns table (status text, room_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_user_id uuid := private.current_active_user();
  v_code text := upper(btrim(coalesce(p_code, '')));
  v_room_id uuid;
begin
  if (
    select count(*)
    from public.room_join_failures f
    where f.user_id = v_user_id and f.attempted_at > now() - interval '15 minutes'
  ) >= 10 then
    return query select 'rate_limited'::text, null::uuid;
    return;
  end if;

  select r.id into v_room_id from public.rooms r where r.code = v_code;
  if v_room_id is null then
    insert into public.room_join_failures (user_id) values (v_user_id);
    return query select 'not_found'::text, null::uuid;
    return;
  end if;

  if exists (
    select 1 from public.room_members m where m.room_id = v_room_id and m.user_id = v_user_id
  ) then
    return query select 'already_member'::text, v_room_id;
    return;
  end if;

  if (select count(*) from public.room_members m where m.room_id = v_room_id) >= 50 then
    return query select 'room_full'::text, null::uuid;
    return;
  end if;

  if (select count(*) from public.room_members m where m.user_id = v_user_id) >= 20 then
    return query select 'too_many_rooms'::text, null::uuid;
    return;
  end if;

  insert into public.room_members (room_id, user_id) values (v_room_id, v_user_id);
  return query select 'joined'::text, v_room_id;
end;
$$;

-- Oda sıralaması ------------------------------------------------------------------------
-- p_round boşsa güncel sezonun tamamı, doluysa o hafta. Yalnızca odanın üyeleri görebilir.
-- Sıra: puan, sonra tam skor sayısı, sonra doğru sonuç sayısı. Eşitlerde aynı sıra numarası.
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

-- Odalarım ------------------------------------------------------------------------------
-- Her oda için üye sayısı, kullanıcının sezon sırası ve lider.
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
  season_matches as (
    select m.id
    from public.matches m
    where m.season_id = (select s.id from public.seasons s where s.is_current order by s.id limit 1)
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
      and p.match_id in (select season_matches.id from season_matches)
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

revoke execute on function public.create_room(text) from public, anon;
revoke execute on function public.join_room(text) from public, anon;
revoke execute on function public.get_room_leaderboard(uuid, integer) from public, anon;
revoke execute on function public.get_my_rooms() from public, anon;
grant execute on function public.create_room(text) to authenticated;
grant execute on function public.join_room(text) to authenticated;
grant execute on function public.get_room_leaderboard(uuid, integer) to authenticated;
grant execute on function public.get_my_rooms() to authenticated;
