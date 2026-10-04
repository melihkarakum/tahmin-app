-- Güvenlik denetimi (yalnızca okur, hiçbir şeyi değiştirmez).
-- Çalıştırma: supabase db query --linked -f supabase/tests/security-audit.sql
-- Her satır bir bulgudur; boş sonuç = sorun yok.

-- 1) public şemasında RLS kapalı tablo
select 'RLS kapalı tablo' as bulgu, c.relname as nesne, '' as ayrinti
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity

union all

-- 2) Giriş yapmamış kullanıcıya (anon) verilmiş tablo izni
select 'anon tablo izni', table_name, string_agg(privilege_type, ',')
from information_schema.role_table_grants
where table_schema = 'public' and grantee = 'anon'
group by table_name

union all

-- 3) Uygulama kullanıcısına (authenticated) verilmiş yazma izni (tablo düzeyi)
select 'authenticated tablo yazma izni', table_name, string_agg(privilege_type, ',')
from information_schema.role_table_grants
where table_schema = 'public' and grantee = 'authenticated'
  and privilege_type in ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE')
group by table_name

union all

-- 4) search_path sabitlenmemiş SECURITY DEFINER fonksiyon
select 'search_path yok (definer)', p.proname, pg_get_function_identity_arguments(p.oid)
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname in ('public', 'private') and p.prosecdef
  and not exists (select 1 from unnest(coalesce(p.proconfig, '{}')) cfg where cfg like 'search_path=%')

union all

-- 5) anon'un çalıştırabildiği public fonksiyonlar (yalnızca kullanıcı adı kontrolü beklenir)
select 'anon çalıştırabilir', p.proname, pg_get_function_identity_arguments(p.oid)
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.prokind = 'f'
  and has_function_privilege('anon', p.oid, 'EXECUTE')
  and p.proname not in ('set_updated_at')

union all

-- 6) authenticated'ın çalıştırabildiği SECURITY DEFINER fonksiyonlar (liste incelenir)
select 'authenticated definer', p.proname, pg_get_function_identity_arguments(p.oid)
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.prosecdef
  and has_function_privilege('authenticated', p.oid, 'EXECUTE')

union all

-- 7) Depolama: herkese açık depolar ve storage.objects üzerindeki kurallar
select 'herkese açık depo', b.id, coalesce(b.file_size_limit::text, 'sınırsız')
from storage.buckets b
where b.public

union all

select 'storage kuralı', pol.policyname, pol.cmd || ' ' || array_to_string(pol.roles, ',')
from pg_policies pol
where pol.schemaname = 'storage' and pol.tablename = 'objects'

order by 1, 2;
