-- FAZ 4: Temel tablolar, kısıtlar ve tahmin kilidi.

-- Satır her güncellendiğinde updated_at alanını yeniler.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Profiller ---------------------------------------------------------------
-- id, auth.users.id ile aynıdır. Hesap silindiğinde profil silinmez, anonimleştirilir;
-- tahmin geçmişi ve oda sıralamaları bozulmasın diye auth.users'a yabancı anahtar yoktur.
create table public.profiles (
  id uuid primary key,
  username text not null,
  display_name text not null,
  role text not null default 'user',
  is_banned boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_unique unique (username),
  constraint profiles_username_format check (username ~ '^[a-z0-9_]{3,20}$'),
  constraint profiles_display_name_length check (char_length(btrim(display_name)) between 1 and 30),
  constraint profiles_role_valid check (role in ('user', 'admin'))
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Lig, sezon, takım --------------------------------------------------------
-- provider + provider_id: verinin hangi futbol API'sinden ve hangi kimlikle geldiği.
create table public.leagues (
  id bigint generated always as identity primary key,
  name text not null,
  country text not null,
  provider text not null,
  provider_id text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint leagues_provider_unique unique (provider, provider_id)
);

create table public.seasons (
  id bigint generated always as identity primary key,
  league_id bigint not null references public.leagues (id),
  name text not null,
  provider_season text not null,
  is_current boolean not null default false,
  created_at timestamptz not null default now(),
  constraint seasons_provider_unique unique (league_id, provider_season)
);

-- Bir ligin aynı anda yalnızca bir güncel sezonu olabilir.
create unique index seasons_one_current_per_league on public.seasons (league_id) where is_current;

create table public.teams (
  id bigint generated always as identity primary key,
  name text not null,
  short_name text not null,
  logo_url text,
  provider text not null,
  provider_id text not null,
  created_at timestamptz not null default now(),
  constraint teams_provider_unique unique (provider, provider_id)
);

-- Maçlar -------------------------------------------------------------------
create table public.matches (
  id bigint generated always as identity primary key,
  season_id bigint not null references public.seasons (id),
  round integer not null,
  home_team_id bigint not null references public.teams (id),
  away_team_id bigint not null references public.teams (id),
  kickoff_at timestamptz not null,
  status text not null default 'scheduled',
  home_score smallint,
  away_score smallint,
  provider text not null,
  provider_id text not null,
  scored_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint matches_provider_unique unique (provider, provider_id),
  constraint matches_round_positive check (round > 0),
  constraint matches_teams_differ check (home_team_id <> away_team_id),
  constraint matches_status_valid check (
    status in ('scheduled', 'live', 'finished', 'postponed', 'cancelled')
  ),
  constraint matches_scores_non_negative check (home_score >= 0 and away_score >= 0),
  constraint matches_finished_has_score check (
    status <> 'finished' or (home_score is not null and away_score is not null)
  )
);

create index matches_season_round_idx on public.matches (season_id, round);
create index matches_kickoff_idx on public.matches (kickoff_at);

create trigger matches_set_updated_at
  before update on public.matches
  for each row execute function public.set_updated_at();

-- Puan ayarları ----------------------------------------------------------------
-- Tek satırlık tablo. Değerler değişirse yalnızca sonradan puanlanan maçlar etkilenir;
-- kazanılmış puanlar tahmin satırında saklandığı için geçmiş değişmez.
create table public.scoring_config (
  id smallint primary key default 1,
  exact_points smallint not null default 5,
  outcome_points smallint not null default 3,
  goal_diff_bonus smallint not null default 1,
  updated_at timestamptz not null default now(),
  constraint scoring_config_singleton check (id = 1),
  constraint scoring_config_non_negative check (
    exact_points >= 0 and outcome_points >= 0 and goal_diff_bonus >= 0
  )
);

insert into public.scoring_config (id) values (1);

create trigger scoring_config_set_updated_at
  before update on public.scoring_config
  for each row execute function public.set_updated_at();

-- Tahminler ------------------------------------------------------------------
-- updated_at: kullanıcının tahmini en son değiştirdiği an (puanlama bu alanı değiştirmez).
create table public.predictions (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id),
  match_id bigint not null references public.matches (id),
  home_goals smallint not null,
  away_goals smallint not null,
  points smallint,
  result_type text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint predictions_one_per_match unique (user_id, match_id),
  constraint predictions_goals_range check (
    home_goals between 0 and 20 and away_goals between 0 and 20
  ),
  constraint predictions_result_type_valid check (
    result_type in ('exact', 'outcome_diff', 'outcome', 'miss')
  ),
  constraint predictions_points_non_negative check (points >= 0),
  constraint predictions_scored_together check ((points is null) = (result_type is null))
);

create index predictions_match_idx on public.predictions (match_id);

-- Tahmin kilidi: maç başladıktan sonra tahmin oluşturulamaz, skoru değiştirilemez.
-- Saat olarak sunucu saati (now()) kullanılır; telefonun saati hiçbir şeyi etkilemez.
-- Bu tetikleyici, tahmini hangi yoldan yazılırsa yazılsın çalışır.
create or replace function public.enforce_prediction_window()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  match_kickoff timestamptz;
  match_status text;
begin
  if tg_op = 'UPDATE' and (new.user_id <> old.user_id or new.match_id <> old.match_id) then
    raise exception 'Tahminin sahibi ya da maçı değiştirilemez.';
  end if;

  select m.kickoff_at, m.status
    into match_kickoff, match_status
  from public.matches m
  where m.id = new.match_id;

  if match_status is distinct from 'scheduled' or now() >= match_kickoff then
    raise exception 'Bu maç için tahmin süresi doldu.';
  end if;

  if tg_op = 'INSERT' then
    new.created_at := now();
    new.points := null;
    new.result_type := null;
  else
    new.created_at := old.created_at;
  end if;

  new.updated_at := now();
  return new;
end;
$$;

create trigger predictions_enforce_window
  before insert or update of home_goals, away_goals, user_id, match_id on public.predictions
  for each row execute function public.enforce_prediction_window();

-- Odalar -----------------------------------------------------------------------
create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null,
  owner_id uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  constraint rooms_code_unique unique (code),
  constraint rooms_code_format check (code ~ '^[A-Z0-9]{6}$'),
  constraint rooms_name_length check (char_length(btrim(name)) between 2 and 40)
);

create index rooms_owner_idx on public.rooms (owner_id);

-- Oda sahibi de üye olarak eklenir. Bir kullanıcı aynı odaya bir kez eklenebilir.
create table public.room_members (
  room_id uuid not null references public.rooms (id) on delete cascade,
  user_id uuid not null references public.profiles (id),
  joined_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

create index room_members_user_idx on public.room_members (user_id);
