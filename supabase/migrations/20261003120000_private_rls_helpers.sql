-- FAZ 4: RLS yardımcı fonksiyonlarını API'ye açık olmayan "private" şemasına taşır.
-- public şemasındaki fonksiyonlar /rest/v1/rpc/... adresinden çağrılabiliyordu (Supabase
-- güvenlik denetimi uyarısı). Kurallar fonksiyonları kimliğiyle (OID) tuttuğu için taşıma
-- sonrası aynen çalışmaya devam eder; authenticated rolünün çalıştırma izni de korunur.

create schema if not exists private;

revoke all on schema private from public;
grant usage on schema private to authenticated;

alter function public.is_room_member(uuid) set schema private;
alter function public.is_room_owner(uuid) set schema private;
alter function public.shares_room_with(uuid) set schema private;
