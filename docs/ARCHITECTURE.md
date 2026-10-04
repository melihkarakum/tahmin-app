# Teknik Mimari

FAZ 1'de alınan kararlar. Bir karar değişirse önce bu dosya güncellenir.

## Teknolojiler

| Katman | Seçim |
|---|---|
| Mobil çatı | Expo SDK 57 (React Native 0.86, React 19.2) |
| Dil | TypeScript |
| Sayfa geçişleri | Expo Router; ekranlar `src/app/` içinde |
| Stil | NativeWind 4.2.7 + Tailwind CSS 3.4 |
| Sunucu verisi | TanStack Query |
| Backend | Supabase: Auth, PostgreSQL, RLS, Edge Functions, `pg_cron` |
| Oturum saklama | `expo-sqlite` localStorage |
| Bildirim | `expo-notifications` + Expo push servisi |
| Derleme | EAS Build |

MVP'de kullanılmayanlar: Realtime, Zustand, react-hook-form, i18n kütüphanesi, sosyal giriş.

## Sistem şeması

```
Telefon (Expo uygulaması)
   │  yalnızca Supabase ile konuşur
   ▼
Supabase
   ├─ Auth              kayıt, giriş
   ├─ PostgreSQL + RLS  tüm veri ve kurallar
   ├─ DB fonksiyonları  tahmin kaydet, puanla, sıralama getir
   ├─ pg_cron           zamanlayıcı
   └─ Edge Functions    sync-matches, send-push
          │                     │
          ▼                     ▼
     Futbol API'si        Expo push servisi → telefon
```

## Oturum

- Giriş yapılmamışsa yalnızca `(auth)` ekranları (giriş, kayıt) açılabilir; giriş yapılmışsa yalnızca uygulama ekranları. Bunu `src/app/_layout.tsx` içindeki `Stack.Protected` sağlar; giriş ya da çıkış olunca yönlendirme kendiliğinden olur.
- Kayıtlı oturum okunana kadar açılış ekranı (splash) açık kalır.
- Kullanıcı değişince (çıkış ya da başka hesap) TanStack Query önbelleği temizlenir (`src/features/auth/auth-provider.tsx`).
- Oturum telefonda `expo-sqlite` localStorage'da, web önizlemesinde tarayıcının localStorage'ında saklanır (`src/lib/auth-storage.ts` ve `.web.ts`).
- Kayıtta kullanıcı adı, görünen ad ve kullanım koşulu onayı Supabase'e kullanıcı bilgisi olarak gider; profil sunucuda tetikleyiciyle oluşur. Onay yoksa kayıt sunucuda reddedilir.

## Temel akışlar

**Tahmin kaydetme.** Uygulama tabloya doğrudan yazmaz; `save_prediction(maç, ev, deplasman)` fonksiyonunu çağırır. Fonksiyon kullanıcının giriş yaptığını ve banlı olmadığını, sunucu saatine göre maçın başlamadığını ve skorların 0–20 arasında olduğunu doğrular. Kayıt varsa günceller, yoksa oluşturur.

**Maç senkronu.** Zamanlayıcı 10 dakikada bir `sync-matches` fonksiyonunu çalıştırır. Fonksiyon önce veritabanına oynanan maç olup olmadığını sorar; yoksa futbol API'sini çağırmaz. Günde bir kez tüm fikstür tazelenir.

**Puanlama.** Maç "bitti" olduğunda ya da bitmiş maçın skoru değiştiğinde veritabanı o maçın tahminlerini puanlar. Aynı maç tekrar puanlanırsa sonuç değişmez.

**Sıralama.** Oda, hafta ve Türkiye sıralamaları okuma anında tahminlerden hesaplanır. Fonksiyonlar yalnızca toplamları döndürür. "Hafta" takvim haftası değil, lig haftasıdır.

## Puanlama

| Durum | Puan |
|---|---|
| Tam skor | 5 |
| Doğru sonuç ve doğru gol farkı | 4 |
| Yalnızca doğru sonuç | 3 |
| Yanlış sonuç | 0 |

Puan değerleri `scoring_config` tablosunda durur. Kazanılan puan tahmin satırına yazılır; kural sonradan değişse de geçmiş değişmez. İptal edilen maç puanlanmaz. Eşitlikte sıra: toplam puan, tam skor sayısı, doğru sonuç sayısı.

Nasıl çalışır (FAZ 9): `matches` tablosunda durum ya da skor değişince bir tetikleyici `score_match()` fonksiyonunu çalıştırır. Maç bittiyse o maçın tüm tahminleri `calculate_points()` ile puanlanır; skor düzeltilirse yeniden hesaplanır; maç bitmiş durumdan çıkarsa (iptal, erteleme) puanlar geri alınır. Senkron, yönetici düzeltmesi ya da elle güncelleme fark etmez. Uygulama puanlamayı tetikleyemez.

## Güvenlik modeli

| Veri | Kullanıcı ne okur | Kullanıcı ne yazar |
|---|---|---|
| Profiller | Herkesin açık alanları | Yalnızca kendi adı ve bildirim tercihleri |
| Lig, takım, maç, puan ayarı | Hepsini | Hiçbirini |
| Tahminler | Kendininkini her zaman; başkasınınkini maç başladıktan sonra | Yalnızca `save_prediction` üzerinden |
| Odalar ve üyeler | Yalnızca üyesi olduğu odalar | Oluşturma ve katılma fonksiyonla; yönetim oda sahibinde |
| Bildirim adresleri | Yalnızca kendininki | Yalnızca kendininki |

Anahtarlar:

- Uygulamada yalnızca Supabase "publishable" anahtarı bulunur.
- Supabase gizli anahtarı ve futbol API anahtarı yalnızca Edge Function'larda durur.
- Zamanlayıcının Edge Function çağrıları ayrı bir gizli değerle doğrulanır.
- Eski `anon` ve `service_role` anahtarları kullanılmaz.

## Veritabanı tabloları

`profiles`, `leagues`, `seasons`, `teams`, `matches`, `predictions`, `rooms`, `room_members`, `scoring_config`. Şema `supabase/migrations/` içindedir. `push_tokens` bildirim fazında (FAZ 13) eklenecek.

Bilinçli olarak olmayanlar:

- Sıralama tabloları: sıralama tahminlerden hesaplanır.
- `room_predictions`: tahmin kullanıcıya aittir, odaya değil.
- `badges`, `user_badges`, `notifications`: MVP sonrası.

Silinen kullanıcının satırı silinmez; kişisel verileri temizlenip anonimleştirilir. Bu yüzden `profiles` tablosunun `auth.users`'a yabancı anahtarı yoktur; profil, kayıt anında bir tetikleyiciyle oluşur.

Uygulamanın bilmesi gerekenler:

- `profiles` tablosunda yalnızca `id`, `username`, `display_name`, `created_at` okunabilir; sorgular `select('*')` değil, bu sütunları tek tek seçmelidir.
- Tahmin, puan, maç, oda oluşturma ve odaya katılma için uygulamanın doğrudan yazma izni yoktur; bunlar sunucu fonksiyonlarıyla yapılır.
- Tahmin kilidi tabloya bağlı bir tetikleyicidir: tahmin hangi yoldan yazılırsa yazılsın, maç başladıysa (sunucu saatine göre) reddedilir.

## Maç verisi (FAZ 6)

- Kaynak: API-Football v3, Süper Lig lig kimliği **203**. Sezon, başlangıç yılıyla anılır (2026 = 2026-27).
- `supabase/functions/sync-matches`: `?mode=full` tüm fikstür ve takımlar, `?mode=live` yalnızca başlamak üzere olan ya da oynanan maçlar, `?mode=probe` hesap ve sezon erişimi kontrolü. `?mode=full&season=2024` geçmiş bir sezonu "güncel" işaretlemeden çeker.
- Dönüşüm kuralları `supabase/functions/_shared/api-football.ts` içinde ve `npm run test:db` ile test edilir: biten maçta normal süre skoru; bitti denip skoru gelmeyen maç "oynanıyor" sayılır; ertelenen `postponed`, iptal/terk/hükmen `cancelled`.
- Zamanlama (`pg_cron`): `sync-matches-full` her gün 03:15 UTC, `sync-matches-live` 10 dakikada bir. Canlı kontrol, oynanacak maç yoksa futbol API'sini hiç çağırmaz.
- Fonksiyon yalnızca `x-sync-secret` başlığıyla çağrılabilir. Parola iki yerde durur: Edge Function sırrı `SYNC_SECRET` ve Vault kaydı `sync_secret`. Vault'ta ayrıca `project_url` vardır. Bunlar migration'da değil, bir kez elle oluşturulmuştur. Yeni bir ortamda: `supabase secrets set SYNC_SECRET=...` ve `select vault.create_secret('<değer>', 'sync_secret')`, `select vault.create_secret('https://<ref>.supabase.co', 'project_url')`.
- Futbol API anahtarı yalnızca Edge Function sırrı `API_FOOTBALL_KEY` olarak durur.
- Fonksiyon yükleme Docker'sız: `supabase functions deploy sync-matches --use-api --no-verify-jwt`.

## Tahmin ve hafta (FAZ 7-8)

- `current_round()`: güncel sezon ve hafta. Oynanan maç varsa onun haftası, yoksa sıradaki maçın haftası, o da yoksa son hafta; ertelenen maçlar sayılmaz.
- `save_prediction(maç, ev, deplasman)`: uygulamanın tahmin yazabildiği tek yol. Kimlik oturumdan alınır, banlı hesap reddedilir, maç başladıysa kilit tetikleyicisi reddeder.
- **Test haftaları:** `supabase/seed/test-extra-rounds.sql` 6., 7. (oynanmış) ve 9. (gelecek) haftayı ekler; var olan maçlara ve tahminlere dokunmaz.
- **Test haftası (8.):** ücretli API planı alınana kadar `supabase/seed/test-round.sql` 9 deneme maçı ekler (`provider = 'test'`, uygulamada "TEST" etiketiyle görünür). Tekrar çalıştırılabilir; maç saatleri çalıştırıldığı ana göre yeniden kurulur. **Gerçek veriye geçmeden önce silinmeli** (komut dosyanın başında).

## Odalar, sıralama, profil (FAZ 10-12)

- `create_room`, `join_room`: oda kodu `gen_random_uuid()` kaynaklı güçlü rastgelelikle, 32 karakterlik alfabeden (0/O, 1/I yok) 6 karakter. Yanlış kod denemeleri `room_join_failures` tablosunda tutulur; 15 dakikada 10 yanlıştan sonra katılma geçici durur. Sınırlar: 10 kurulan oda, 20 üyelik, oda başına 50 üye.
- `get_room_leaderboard(oda, hafta?)`, `get_national_leaderboard(hafta?, sayı?)`, `get_my_rooms()`: sıralamalar okuma anında hesaplanır; sıra = puan, sonra tam skor, sonra doğru sonuç; eşitlere aynı sıra. Türkiye sıralamasına yalnızca puanlanmış tahmini olanlar girer.
- **Oda puanı kuralı (kullanıcı kararı, 2026-10-04):** tahmin kullanıcıya aittir ve tüm odalarda geçerlidir; ancak bir odanın haftalık ve sezon sıralamasında yalnızca **oda kurulduktan sonra başlayan** maçlar sayılır. Herkes aynı çizgiden başlar; sonradan katılan üye, oda kurulduktan sonraki maçlara (katılmadan önce bile) yaptığı tahminlerin puanını alır. Türkiye sıralaması bu kuraldan etkilenmez.
- `get_my_stats()`, `get_my_prediction_history()`: kullanıcının kendi verisi (RLS ile).
- `delete_my_account()`: giriş bilgileri `auth.users`'tan silinir; profil "Silinmiş Kullanıcı" olarak anonimleşir; tahminler kalır ama sıralamada görünmez; kurulan odalar en eski üyeye devredilir, tek kişilikse silinir.

## Davet bağlantısı ve web sitesi (FAZ 14)

- **Bağlantı:** `https://tahminet.expo.app/davet?kod=ABC234` (`src/lib/invite.ts`). Kod sorgu parametresindedir; durağan (static) web çıktısında `/davet/[kod]` gibi dinamik yollar çalışmadığı için bu biçim seçildi. Adres değişirse eski davetler çalışmaz.
- **WhatsApp:** oda ekranındaki düğme `https://wa.me/?text=…` açar (WhatsApp'ın resmi biçimi; kişi seçilince mesaj hazır gelir). Mesajda bağlantı ve elle girmek için kod vardır. "Paylaş" telefonun paylaşma penceresini açar.
- **`src/app/davet.tsx`:** web'de bilgi sayfası (kod, kopyala, katılma adımları); uygulamada katılma ekranı (onaydan sonra `join_room`). Giriş yapılmamışsa kod cihazda saklanır (`pending-invite.ts`, en fazla 1 gün), girişten sonra ekran kendiliğinden açılır. Bağlantıdaki kod `^[A-Z0-9]{6}$` dışında ise reddedilir.
- **Web sitesi (EAS Hosting, ücretsiz plan: ayda 100 bin istek):** yayındaki web sürümünde (`Platform.OS === 'web' && !__DEV__`) yalnızca `davet` açılır, diğer tüm sayfalar ona yönlenir; uygulama telefon içindir. Geliştirirken web'de her şey açıktır (`/dev-gallery`). WhatsApp önizlemesi `src/app/+html.tsx`'teki `og:` etiketlerini okur. Site haritası kapalı (`expo-router` eklentisinde `sitemap: false`).
- **Yeniden yayınlama** (davet sayfası değişince): `npx expo export --platform web`, ardından `npx eas-cli@latest deploy --prod`.
- **Sonra (FAZ 19):** bağlantının uygulamayı doğrudan açması için iOS Universal Links (`public/.well-known/apple-app-site-association`, Apple Team ID + `ios.associatedDomains: ["applinks:tahminet.expo.app"]`) ve Android App Links (`assetlinks.json` + `intentFilters`). O zamana kadar bağlantı tarayıcıda sayfayı açar; uygulama içi `tahminapp://davet?kod=…` bağlantısı da aynı ekranı açar.

## Bildirimler (FAZ 13)

- **Akış:** uygulama izin alınca cihazın Expo bildirim adresini `register_push_token` ile kaydeder (çıkışta `unregister_push_token`). `send-notifications` Edge Function'ı pg_cron ile 10 dakikada bir (xx:05, xx:15, …) çalışır; `collect_match_reminders` ve `collect_round_results` fonksiyonlarından kime ne gideceğini alır, Expo bildirim servisine 100'erli gruplar halinde yollar.
- **Maç hatırlatması:** 60 dakika içinde başlayacak, tahmin yapılmamış maçlar; aynı anda birden fazlaysa tek bildirim. Her maç için kişi başına bir kez (`notification_log`).
- **Hafta sonucu:** güncel sezonda oynanacak/oynanan maçı kalmayan ve son 3 gün içinde biten hafta; o haftada puanlanmış tahmini olanlara puan ve haftalık Türkiye sırası. Yalnızca 09:00-22:00 (Türkiye saati); gece biten haftanın bildirimi sabah gider.
- **Tercihler:** `notification_settings` (satır yoksa ikisi de açık); Profil'deki anahtarlar `set_notification_settings` ile yazar.
- **İzin:** ilk tahmin kaydedilince, telefonun izin penceresi hiç açılmadıysa önce uygulama içinde sorulur ("Şimdi değil" denirse en erken bir hafta sonra). Profil > Bildirimler'de "Bildirimleri Aç" / "Ayarları Aç".
- **Cihaz temizliği:** Expo `DeviceNotRegistered` dönerse (uygulama silinmiş) adres silinir; gönderimden 15 dakika sonra makbuzlar da kontrol edilir (`push_tickets`). Hesap silinince adres, tercih ve kayıtlar `auth.users` silinmesiyle birlikte silinir.
- **Elle deneme:** `?dryRun=1` (göndermez, kime ne gideceğini özetler), `?mode=test&username=…` (o kişinin cihazlarına deneme bildirimi). Her çağrı `x-sync-secret` ister.
- **Sınır:** Android'de Expo Go uzaktan bildirim almıyor (SDK 53'ten beri); Android'de deneme için geliştirme ya da mağaza sürümü gerekir. iPhone'da Expo Go'da çalışır.
- Expo hesabında "gelişmiş bildirim güvenliği" açılırsa `EXPO_ACCESS_TOKEN` sırrı eklenmeli (fonksiyon varsa kullanır).

## Takım logoları

- Futbol API'si her takım için logo adresi verir (`teams.logo_url`). `sync-matches` fonksiyonu logoyu **bir kez** indirip Supabase Storage'daki herkese açık `team-logos` deposuna kopyalar (`teams.logo_path`). Uygulama logoyu yalnızca bu depodan yükler: kullanıcıların cihazı futbol API'sinin sunucusuna bağlanmaz ve görsel sunucusunun hız sınırına takılınmaz.
- Kopyalama `full` senkronunda kendiliğinden yapılır (yükselen yeni takımlar için). Elle çalıştırmak için: `?mode=logos`. Yalnızca `https://media.api-sports.io` adresinden, en fazla 256 KB'lık png/jpeg/webp kabul edilir.
- Cihazda logolar diskte önbelleğe alınır (`expo-image`). Logo yoksa ya da yüklenemezse kulüp renklerinde rozet gösterilir.
- **Logoları herkes için kapatmak** (hak sahibi itirazı ya da mağaza reddi): `update storage.buckets set public = false where id = 'team-logos';` Yeni uygulama sürümü gerekmez; uygulama logoyu yükleyemeyince rozete döner.
- Logoların hakları kulüplere aittir. Futbol API'si logoları yalnızca tanıtım amacıyla verdiğini, hakların sahibi olmadığını ve kullanım için hak sahibinden izin gerekebileceğini belirtir. Yayından önce avukat görüşü şart (ROADMAP).

## Supabase güvenlik denetiminde bilinçli kabul edilen uyarılar

- `is_username_available`: giriş yapmamış kullanıcı da çağırabilir; kayıt ekranının kullanıcı adı kontrolü için. Yalnızca evet/hayır döner.
- `save_prediction`: giriş yapan kullanıcı çağırabilir; tahmin yazmanın tek yolu budur.
- `create_room`, `join_room`, `get_room_leaderboard`, `get_my_rooms`, `get_national_leaderboard`, `delete_my_account`, `register_push_token`, `unregister_push_token`: giriş yapan kullanıcının çağırması için tasarlandı; her biri kimliği oturumdan alır ve yetkiyi kendi içinde denetler.
- `room_join_failures`, `push_tokens`, `push_tickets`, `notification_log` tablolarında RLS açık ama kural yok ("RLS enabled, no policy" bilgisi): bilinçli; uygulama bu tablolara hiç erişemez, yalnızca sunucu fonksiyonları yazar.
- Sızdırılmış şifre kontrolü (HaveIBeenPwned) kapalı: FAZ 17'de değerlendirilecek.

## Veritabanı testleri

`npm run test:db` komutu, migration dosyalarını bilgisayarda çalışan geçici bir Postgres'e (PGlite) kurar ve güvenlik kurallarını dener. Docker gerekmez. Supabase'e özgü roller ve `auth.uid()` için `supabase/tests/supabase-shim.sql` kullanılır; bu dosya yalnızca testler içindir, Supabase'e yüklenmez. Testler gerçek Supabase'in yerini tutmaz; her migration ayrıca gerçek projede de denenir.

## Klasör yapısı

```
tahmin-app/
├─ src/
│  ├─ app/                 ekranlar (Expo Router)
│  │  ├─ _layout.tsx
│  │  ├─ (auth)/           karşılama, giriş, kayıt, şifre sıfırlama
│  │  ├─ (tabs)/           ana sayfa, odalar, sıralama, profil
│  │  ├─ match/[id].tsx
│  │  ├─ room/[id].tsx
│  │  ├─ room/create.tsx
│  │  ├─ join/[code].tsx   davet linki buraya düşer
│  │  ├─ history.tsx
│  │  ├─ user/[id].tsx
│  │  └─ settings.tsx
│  ├─ lib/                 supabase.ts, queryClient.ts
│  ├─ features/            auth, matches, predictions, rooms, leaderboard, profile
│  ├─ components/ui/       ortak arayüz parçaları
│  ├─ types/               veritabanı tipleri
│  └─ global.css           renk değişkenleri
├─ supabase/
│  ├─ migrations/          numaralı SQL dosyaları
│  ├─ functions/           sync-matches, send-push
│  └─ tests/               puanlama ve RLS testleri
├─ docs/
├─ .env                    git'e girmez
└─ .env.example
```

Yalnızca ekran ve `_layout` dosyaları `src/app/` içinde durur; geri kalan kod `src/` altındaki diğer klasörlerdedir.

## Tasarım

- **Koyu "stadyum gecesi" teması** (FotMob, Maçkolik, Apple Sports çizgisi): neredeyse siyah zemin, koyu kartlar, canlı yeşil vurgu, tam skor için altın, canlı maç için kırmızı.
- **Takım rozetleri:** logo yerine kulüp renklerinde yuvarlak rozet ve kısa ad (`src/constants/team-colors.ts`). Logo kullanım hakkı netleşene kadar böyle kalır.
- **Maç kartı skorbord düzeninde:** ev sahibi solda, deplasman sağda, ortada saat ya da skor; tahmin düğmeleri her takımın altında.
- **Ana sayfa hafta hafta:** üstte yatay hafta seçici (içinde bulunulan hafta "BU HAFTA" etiketli ve açılışta seçili), altında yalnızca seçilen haftanın özeti ve maçları. Arkadaş ve Türkiye sıralaması ana sayfada değil, kendi sekmelerinde.
- **Tasarım vitrini:** `/dev-gallery` adresi kartların tüm durumlarını örnek veriyle gösterir; giriş gerektirmez ve yalnızca geliştirme modunda açılır.
- **Yazı tipi: Plus Jakarta Sans** (400, 500, 600, 700, 800). Rakamları eşit genişlikte olduğu için skorlar hizalı durur. Yazı tipleri uygulama açılırken yüklenir; yüklenene kadar açılış ekranı kalır. Kalınlık `font-bold` gibi sınıflarla seçilir; bu sınıflar doğrudan ilgili yazı tipi dosyasına bağlıdır (`tailwind.config.js`). Tüm metinler `src/components/ui/text.tsx` üzerinden geçer.
- En dar desteklenen ekran 375 px (iPhone SE); düzenler 360 px'te de taşmadan çalışır.

## Stil kuralları

- Renkler `src/global.css` içindeki değişkenlerde tanımlıdır; ekranlarda `bg-surface`, `text-ink` gibi adlarla kullanılır, renk kodu yazılmaz.
- Büyük harfli etiketler `uppercase` sınıfıyla değil `trUpper()` ile yazılır (`src/lib/text.ts`); aksi halde "Tahmin" → "TAHMIN" olur.
- Gölge ve opaklık koşullu `className` ile değiştirilmez; inline `style` ile verilir.
- Aynı `ScrollView` üzerinde `contentContainerClassName` ile `contentContainerStyle` birlikte kullanılmaz.

## Ortam

- Docker yok; buluttaki Supabase projesiyle çalışılır. Her şema değişikliği `supabase/migrations/` altında bir SQL dosyasıdır.
- Geliştirme iPhone'da Expo Go ile yapılır. Bildirimler Expo Go'da çalışmadığı için FAZ 13'te development build'e geçilir; iOS için ücretli Apple Developer hesabı gerekir.
