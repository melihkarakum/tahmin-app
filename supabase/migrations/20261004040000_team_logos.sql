-- Takım logoları. Futbol API'sinin verdiği logo, senkron fonksiyonu tarafından bir kez kendi
-- depomuza (Supabase Storage, "team-logos") kopyalanır; uygulama logoyu oradan yükler.
-- Böylece kullanıcıların cihazı futbol API'sinin sunucusuna hiç bağlanmaz (IP adresi üçüncü
-- tarafa gitmez) ve API'nin görsel sunucusundaki hız sınırına takılınmaz.
--
-- Logoların hakları kulüplere aittir; yayından önce izin/avukat görüşü gerekir (ROADMAP).
-- Logoları herkes için kapatmak gerekirse (yeni uygulama sürümü gerekmez):
--   update storage.buckets set public = false where id = 'team-logos';
-- Uygulama logoyu yükleyemeyince kendiliğinden renkli rozete döner.

alter table public.teams add column logo_path text;

comment on column public.teams.logo_url is
  'Futbol API''sinin verdiği özgün logo adresi. Yalnızca kopyalamak için; uygulama kullanmaz.';
comment on column public.teams.logo_path is
  'team-logos deposundaki kopyanın yolu (örn. api-football/645.png). Uygulama bunu kullanır.';

do $bucket$
begin
  -- Yerel testlerde (PGlite) storage şeması yoktur.
  if to_regclass('storage.buckets') is null then
    raise notice 'storage şeması yok: team-logos deposu oluşturulmadı.';
    return;
  end if;

  -- Herkese açık okuma (logolar zaten herkese açık görseller). Yazma izni hiçbir role verilmez;
  -- yalnızca sunucu anahtarıyla çalışan senkron fonksiyonu yükleyebilir. Listeleme kapalı.
  insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values ('team-logos', 'team-logos', true, 262144, array['image/png', 'image/jpeg', 'image/webp'])
  on conflict (id) do nothing;
end
$bucket$;
