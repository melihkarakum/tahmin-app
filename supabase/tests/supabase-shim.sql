-- YALNIZCA YEREL TESTLER İÇİN. Gerçek Supabase'e yüklenmez.
-- Supabase'in her projede hazır sunduğu rolleri, auth şemasını ve varsayılan izinleri taklit eder;
-- böylece migration dosyaları Docker olmadan, bilgisayarda test edilebilir.

create role anon nologin noinherit;
create role authenticated nologin noinherit;
create role service_role nologin noinherit bypassrls;

create schema auth;
grant usage on schema auth to anon, authenticated, service_role;

create table auth.users (
  id uuid primary key default gen_random_uuid(),
  email text,
  raw_user_meta_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Supabase'teki auth.uid() ile aynı mantık: giriş yapan kullanıcının kimliği JWT'den okunur.
create function auth.uid()
returns uuid
language sql
stable
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub'
  )::uuid
$$;

grant execute on function auth.uid() to anon, authenticated, service_role;

-- Supabase, public şemasındaki yeni nesneler için bu rollere varsayılan olarak tüm izinleri verir.
grant usage on schema public to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
