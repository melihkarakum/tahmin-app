-- FAZ 13: Bildirimler.
--   notification_settings : kullanıcının bildirim tercihleri (satırı yoksa ikisi de açık sayılır)
--   push_tokens           : cihazların Expo bildirim adresleri; uygulama yalnızca fonksiyonla yazar
--   push_tickets          : gönderilen bildirimlerin Expo bilet kimlikleri (silinmiş cihazları ayıklamak için)
--   notification_log      : gönderilen bildirimler; aynı bildirim aynı kişiye iki kez gitmez
-- Gönderim: send-notifications Edge Function'ı 10 dakikada bir (pg_cron) çağrılır. Fonksiyon
-- aşağıdaki collect_* fonksiyonlarıyla kime ne gideceğini öğrenir ve Expo bildirim servisine yollar.
-- Hesap silinince (auth.users satırı silinir) bu tablolardaki satırlar da kendiliğinden silinir.

-- Tercihler ---------------------------------------------------------------------------------

create table public.notification_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  match_reminders boolean not null default true,
  round_results boolean not null default true,
  updated_at timestamptz not null default now()
);

create trigger notification_settings_set_updated_at
  before update on public.notification_settings
  for each row execute function public.set_updated_at();

alter table public.notification_settings enable row level security;
revoke all on table public.notification_settings from anon, authenticated;
grant select on public.notification_settings to authenticated;
grant insert (user_id, match_reminders, round_results) on public.notification_settings to authenticated;
grant update (match_reminders, round_results) on public.notification_settings to authenticated;

create policy "notification_settings_select_own"
  on public.notification_settings for select to authenticated
  using (user_id = (select auth.uid()));

create policy "notification_settings_insert_own"
  on public.notification_settings for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "notification_settings_update_own"
  on public.notification_settings for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

/** Kendi bildirim tercihlerim (kayıt yoksa varsayılan: ikisi de açık). */
create or replace function public.get_my_notification_settings()
returns table (match_reminders boolean, round_results boolean)
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(s.match_reminders, true), coalesce(s.round_results, true)
  from (select 1) as one
  left join public.notification_settings s on s.user_id = (select auth.uid());
$$;

create or replace function public.set_notification_settings(p_match_reminders boolean, p_round_results boolean)
returns void
language plpgsql
volatile
security invoker
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'Giriş yapmalısın.' using errcode = '42501';
  end if;
  if p_match_reminders is null or p_round_results is null then
    raise exception 'Tercih boş olamaz.' using errcode = '22004';
  end if;

  insert into public.notification_settings (user_id, match_reminders, round_results)
  values ((select auth.uid()), p_match_reminders, p_round_results)
  on conflict (user_id) do update
    set match_reminders = excluded.match_reminders,
        round_results = excluded.round_results;
end;
$$;

-- Cihaz adresleri -------------------------------------------------------------------------------

create table public.push_tokens (
  token text primary key
    check (token ~ '^Expo(nent)?PushToken\[[A-Za-z0-9_-]{10,200}\]$'),
  user_id uuid not null references auth.users (id) on delete cascade,
  platform text not null check (platform in ('ios', 'android')),
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create index push_tokens_user_id_idx on public.push_tokens (user_id);

alter table public.push_tokens enable row level security;
revoke all on table public.push_tokens from anon, authenticated;

/**
 * Bu cihazın bildirim adresini giriş yapan kullanıcıya bağlar. Aynı cihazda başka hesaba
 * geçildiyse adres yeni hesaba taşınır. Bir hesapta en fazla 10 cihaz tutulur.
 */
create or replace function public.register_push_token(p_token text, p_platform text)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
begin
  if v_user_id is null then
    raise exception 'Giriş yapmalısın.' using errcode = '42501';
  end if;
  if p_token is null or p_token !~ '^Expo(nent)?PushToken\[[A-Za-z0-9_-]{10,200}\]$' then
    raise exception 'Geçersiz bildirim adresi.' using errcode = '22023';
  end if;
  if p_platform is null or p_platform not in ('ios', 'android') then
    raise exception 'Geçersiz platform.' using errcode = '22023';
  end if;

  insert into public.push_tokens (token, user_id, platform)
  values (p_token, v_user_id, p_platform)
  on conflict (token) do update
    set user_id = excluded.user_id,
        platform = excluded.platform,
        last_seen_at = now();

  delete from public.push_tokens t
  where t.user_id = v_user_id
    and t.token not in (
      select k.token
      from public.push_tokens k
      where k.user_id = v_user_id
      order by k.last_seen_at desc
      limit 10
    );
end;
$$;

/** Çıkış yaparken bu cihazın adresini siler (yalnızca kendi adresini silebilir). */
create or replace function public.unregister_push_token(p_token text)
returns void
language sql
volatile
security definer
set search_path = ''
as $$
  delete from public.push_tokens
  where token = p_token and user_id = (select auth.uid());
$$;

-- Gönderim kayıtları (yalnızca sunucu) -----------------------------------------------------------

create table public.push_tickets (
  id text primary key,
  token text not null references public.push_tokens (token) on delete cascade,
  created_at timestamptz not null default now()
);

create index push_tickets_token_idx on public.push_tickets (token);
create index push_tickets_created_at_idx on public.push_tickets (created_at);

alter table public.push_tickets enable row level security;
revoke all on table public.push_tickets from anon, authenticated;

create table public.notification_log (
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('match_reminder', 'round_result')),
  ref text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, kind, ref)
);

create index notification_log_created_at_idx on public.notification_log (created_at);

alter table public.notification_log enable row level security;
revoke all on table public.notification_log from anon, authenticated;

-- Kime ne gidecek? (yalnızca sunucu anahtarı çağırabilir) ---------------------------------------

/**
 * Maç hatırlatması: 60 dakika içinde başlayacak maçlardan tahmin yapılmamış olanlar.
 * Kişi başına tek bildirimde toplanır. p_dry_run = true ise kayıt düşülmez (deneme).
 */
create or replace function public.collect_match_reminders(
  p_now timestamptz default now(),
  p_dry_run boolean default false
)
returns table (user_id uuid, tokens text[], title text, body text, url text)
language plpgsql
volatile
security definer
set search_path = ''
as $$
#variable_conflict use_column
begin
  if not p_dry_run then
    delete from public.notification_log l where l.created_at < p_now - interval '60 days';
  end if;

  return query
  with upcoming as (
    select m.id, h.name as home_name, a.name as away_name
    from public.matches m
    join public.seasons s on s.id = m.season_id and s.is_current
    join public.teams h on h.id = m.home_team_id
    join public.teams a on a.id = m.away_team_id
    where m.status = 'scheduled'
      and m.kickoff_at > p_now
      and m.kickoff_at <= p_now + interval '60 minutes'
  ),
  recipients as (
    select distinct t.user_id
    from public.push_tokens t
    join public.profiles pr on pr.id = t.user_id and not pr.is_banned and pr.deleted_at is null
    left join public.notification_settings ns on ns.user_id = t.user_id
    where coalesce(ns.match_reminders, true)
  ),
  due as (
    select r.user_id, u.id as match_id, u.home_name, u.away_name
    from recipients r
    cross join upcoming u
    where not exists (
        select 1 from public.predictions p where p.user_id = r.user_id and p.match_id = u.id
      )
      and not exists (
        select 1 from public.notification_log l
        where l.user_id = r.user_id and l.kind = 'match_reminder' and l.ref = u.id::text
      )
  ),
  logged as (
    insert into public.notification_log (user_id, kind, ref)
    select d.user_id, 'match_reminder', d.match_id::text
    from due d
    where not p_dry_run
    on conflict do nothing
    returning 1
  )
  select
    d.user_id,
    (select array_agg(t.token order by t.token) from public.push_tokens t where t.user_id = d.user_id),
    'Maç başlamak üzere'::text,
    case
      when count(*) = 1 then
        min(d.home_name || ' - ' || d.away_name) || ' 1 saat içinde başlıyor. Tahminini yapmayı unutma!'
      else
        count(*) || ' maç 1 saat içinde başlıyor. Tahminlerini yapmayı unutma!'
    end,
    '/'::text
  from due d
  group by d.user_id;
end;
$$;

/**
 * Hafta sonucu: güncel sezonda son 3 gün içinde tamamlanan (oynanacak ya da oynanan maçı kalmayan)
 * haftalar için o haftada puanlanmış tahmini olan kişilere puanı ve haftalık Türkiye sırası.
 * Gece rahatsız etmemek için yalnızca 09:00-22:00 (Türkiye saati) arasında gönderilir;
 * gece biten haftanın bildirimi sabah gider.
 */
create or replace function public.collect_round_results(
  p_now timestamptz default now(),
  p_dry_run boolean default false
)
returns table (user_id uuid, tokens text[], title text, body text, url text)
language plpgsql
volatile
security definer
set search_path = ''
as $$
#variable_conflict use_column
begin
  if extract(hour from (p_now at time zone 'Europe/Istanbul')) not between 9 and 21 then
    return;
  end if;

  return query
  with season as (
    select s.id from public.seasons s where s.is_current order by s.id limit 1
  ),
  completed as (
    select m.round
    from public.matches m
    where m.season_id = (select season.id from season)
    group by m.round
    having count(*) filter (where m.status in ('scheduled', 'live')) = 0
      and count(*) filter (where m.status = 'finished') > 0
      and max(m.kickoff_at) filter (where m.status = 'finished') >= p_now - interval '3 days'
      and max(m.kickoff_at) filter (where m.status = 'finished') <= p_now
  ),
  totals as (
    select
      m.round,
      p.user_id,
      sum(p.points)::integer as points,
      count(*) filter (where p.result_type = 'exact') as exact_count,
      count(*) filter (where p.result_type in ('exact', 'outcome_diff', 'outcome')) as outcome_count
    from public.predictions p
    join public.matches m on m.id = p.match_id
    join completed c on c.round = m.round
    join public.profiles pr on pr.id = p.user_id and not pr.is_banned and pr.deleted_at is null
    where m.season_id = (select season.id from season)
      and p.points is not null
    group by m.round, p.user_id
  ),
  ranked as (
    select
      t.round,
      t.user_id,
      t.points,
      (rank() over (partition by t.round order by t.points desc, t.exact_count desc, t.outcome_count desc))::integer as position,
      (count(*) over (partition by t.round))::integer as total
    from totals t
  ),
  due as (
    select k.*
    from ranked k
    left join public.notification_settings ns on ns.user_id = k.user_id
    where coalesce(ns.round_results, true)
      and exists (select 1 from public.push_tokens t where t.user_id = k.user_id)
      and not exists (
        select 1 from public.notification_log l
        where l.user_id = k.user_id
          and l.kind = 'round_result'
          and l.ref = (select season.id from season) || ':' || k.round
      )
  ),
  logged as (
    insert into public.notification_log (user_id, kind, ref)
    select d.user_id, 'round_result', (select season.id from season) || ':' || d.round
    from due d
    where not p_dry_run
    on conflict do nothing
    returning 1
  )
  select
    d.user_id,
    (select array_agg(t.token order by t.token) from public.push_tokens t where t.user_id = d.user_id),
    d.round || '. Hafta tamamlandı',
    d.points || ' puan aldın. Haftanın Türkiye sıralamasında ' || d.position || '. sıradasın ('
      || d.total || ' kişi).',
    '/leaderboard'::text
  from due d;
end;
$$;

-- Yetkiler ---------------------------------------------------------------------------------------

-- Gönderim fonksiyonu (sunucu anahtarı) bu tablolara yazar. Supabase yeni tablolara bu izni
-- kendiliğinden vermeyi bırakacağı için açıkça verilir.
grant select, insert, update, delete
  on public.notification_settings, public.push_tokens, public.push_tickets, public.notification_log
  to service_role;

revoke execute on function public.get_my_notification_settings() from public, anon;
revoke execute on function public.set_notification_settings(boolean, boolean) from public, anon;
revoke execute on function public.register_push_token(text, text) from public, anon;
revoke execute on function public.unregister_push_token(text) from public, anon;
grant execute on function public.get_my_notification_settings() to authenticated;
grant execute on function public.set_notification_settings(boolean, boolean) to authenticated;
grant execute on function public.register_push_token(text, text) to authenticated;
grant execute on function public.unregister_push_token(text) to authenticated;

revoke execute on function public.collect_match_reminders(timestamptz, boolean) from public, anon, authenticated;
revoke execute on function public.collect_round_results(timestamptz, boolean) from public, anon, authenticated;
grant execute on function public.collect_match_reminders(timestamptz, boolean) to service_role;
grant execute on function public.collect_round_results(timestamptz, boolean) to service_role;

-- Zamanlama: 10 dakikada bir, maç senkronundan 5 dakika sonra (xx:05, xx:15, ...) ---------------

do $schedule$
begin
  if not exists (select 1 from pg_available_extensions where name = 'pg_cron')
     or not exists (select 1 from pg_available_extensions where name = 'pg_net') then
    raise notice 'pg_cron/pg_net yok; bildirim zamanlaması atlandı.';
    return;
  end if;

  perform cron.unschedule(jobname) from cron.job where jobname = 'send-notifications';

  perform cron.schedule(
    'send-notifications',
    '5-59/10 * * * *',
    $job$
      select net.http_post(
        url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url')
          || '/functions/v1/send-notifications',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-sync-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'sync_secret')
        ),
        body := '{}'::jsonb,
        timeout_milliseconds := 60000
      );
    $job$
  );
end
$schedule$;
