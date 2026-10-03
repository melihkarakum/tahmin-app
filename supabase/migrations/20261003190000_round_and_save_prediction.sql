-- FAZ 7-8: Haftanın maçları ve tahmin kaydetme.

-- Güncel hafta: oynanan maç varsa onun haftası; yoksa sıradaki maçın haftası; o da yoksa son hafta.
-- Ertelenen maçlar hesaba katılmaz; böylece eski haftada ertelenen bir maç ekranı geride bırakmaz.
create or replace function public.current_round()
returns table (season_id bigint, season_name text, round integer)
language sql
stable
set search_path = ''
as $$
  with season as (
    select s.id, s.name
    from public.seasons s
    where s.is_current
    order by s.id
    limit 1
  )
  select
    season.id,
    season.name,
    coalesce(
      (
        select m.round
        from public.matches m
        where m.season_id = season.id and m.status = 'live'
        order by m.kickoff_at
        limit 1
      ),
      (
        select m.round
        from public.matches m
        where m.season_id = season.id
          and m.status = 'scheduled'
          and m.kickoff_at > now() - interval '3 hours'
        order by m.kickoff_at
        limit 1
      ),
      (select max(m.round) from public.matches m where m.season_id = season.id)
    )
  from season;
$$;

revoke execute on function public.current_round() from public, anon;
grant execute on function public.current_round() to authenticated;

-- Tahmin kaydetme: uygulamanın tahmin yazabildiği tek yol.
-- Kimlik oturumdan alınır (başkası adına tahmin yapılamaz); banlı hesap tahmin yapamaz.
-- Maç başladıysa tahmin tablosundaki kilit tetikleyicisi kaydı reddeder.
create or replace function public.save_prediction(
  p_match_id bigint,
  p_home_goals integer,
  p_away_goals integer
)
returns public.predictions
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_is_banned boolean;
  v_saved public.predictions;
begin
  if v_user_id is null then
    raise exception 'Tahmin için giriş yapmalısın.' using errcode = '42501';
  end if;

  select p.is_banned into v_is_banned from public.profiles p where p.id = v_user_id;
  if v_is_banned is null or v_is_banned then
    raise exception 'Bu hesapla tahmin yapılamaz.' using errcode = '42501';
  end if;

  insert into public.predictions (user_id, match_id, home_goals, away_goals)
  values (v_user_id, p_match_id, p_home_goals, p_away_goals)
  on conflict (user_id, match_id) do update
    set home_goals = excluded.home_goals,
        away_goals = excluded.away_goals
  returning * into v_saved;

  return v_saved;
end;
$$;

revoke execute on function public.save_prediction(bigint, integer, integer) from public, anon;
grant execute on function public.save_prediction(bigint, integer, integer) to authenticated;
