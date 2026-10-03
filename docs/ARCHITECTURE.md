# Teknik Mimari

FAZ 1'de alınan kararlar. Bir karar değişirse önce bu dosya güncellenir.

## Teknolojiler

| Katman | Seçim |
|---|---|
| Mobil çatı | Expo SDK 57 (React Native 0.86, React 19.2) |
| Dil | TypeScript |
| Sayfa geçişleri | Expo Router; ekranlar `src/app/` içinde |
| Stil | NativeWind 4.2.7 + Tailwind CSS 3.4 |
| Sunucu verisi | TanStack Query (FAZ 5'te eklenecek) |
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

## Stil kuralları

- Renkler `src/global.css` içindeki değişkenlerde tanımlıdır; ekranlarda `bg-surface`, `text-ink` gibi adlarla kullanılır, renk kodu yazılmaz.
- Gölge ve opaklık koşullu `className` ile değiştirilmez; inline `style` ile verilir.
- Aynı `ScrollView` üzerinde `contentContainerClassName` ile `contentContainerStyle` birlikte kullanılmaz.

## Ortam

- Docker yok; buluttaki Supabase projesiyle çalışılır. Her şema değişikliği `supabase/migrations/` altında bir SQL dosyasıdır.
- Geliştirme iPhone'da Expo Go ile yapılır. Bildirimler Expo Go'da çalışmadığı için FAZ 13'te development build'e geçilir; iOS için ücretli Apple Developer hesabı gerekir.
