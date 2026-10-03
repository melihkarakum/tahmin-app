-- FAZ 5: Kayıt kuralları.
-- 1) Kullanım koşulları kabul edilmeden hesap açılamaz; kabul zamanı sunucuda kaydedilir.
-- 2) Kayıt ekranı, kullanıcı adının uygunluğunu giriş yapmadan sorabilir.

alter table public.profiles add column terms_accepted_at timestamptz;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_username text := lower(btrim(coalesce(new.raw_user_meta_data ->> 'username', '')));
  requested_display_name text := btrim(coalesce(new.raw_user_meta_data ->> 'display_name', ''));
  accepted_terms boolean := coalesce((new.raw_user_meta_data ->> 'accepted_terms')::boolean, false);
begin
  if not accepted_terms then
    raise exception 'Kayıt için kullanım koşulları kabul edilmelidir.';
  end if;

  insert into public.profiles (id, username, display_name, terms_accepted_at)
  values (
    new.id,
    requested_username,
    coalesce(nullif(requested_display_name, ''), requested_username),
    now()
  );
  return new;
end;
$$;

-- Kullanıcı adı uygun mu? Yalnızca evet/hayır döner; profil listesini açmaz.
-- Giriş yapmamış kullanıcı (kayıt ekranı) da çağırabilsin diye security definer'dır.
create or replace function public.is_username_available(candidate text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select lower(btrim(candidate)) ~ '^[a-z0-9_]{3,20}$'
    and not exists (
      select 1
      from public.profiles p
      where p.username = lower(btrim(candidate))
    );
$$;

revoke execute on function public.is_username_available(text) from public;
grant execute on function public.is_username_available(text) to anon, authenticated;
