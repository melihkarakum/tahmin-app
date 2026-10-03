-- FAZ 4: Kayıt olan her kullanıcı için otomatik profil.
-- Uygulama kayıt sırasında kullanıcı adını (ve isteğe bağlı görünen adı) gönderir:
--   supabase.auth.signUp({ email, password, options: { data: { username, display_name } } })
-- Kullanıcı adı geçersizse ya da alınmışsa kayıt tamamen geri alınır.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_username text := lower(btrim(coalesce(new.raw_user_meta_data ->> 'username', '')));
  requested_display_name text := btrim(coalesce(new.raw_user_meta_data ->> 'display_name', ''));
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    requested_username,
    coalesce(nullif(requested_display_name, ''), requested_username)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
