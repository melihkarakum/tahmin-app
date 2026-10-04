# Güvenlik denetimi (FAZ 17)

Tarih: 2026-10-04. Bu belge ne denetlendiğini, ne düzeltildiğini, hangi riskin bilerek kabul
edildiğini ve proje sahibinin yapması gerekenleri anlatır. Denetim, aşağıdaki komutlarla
istenildiği zaman tekrarlanabilir.

## Nasıl tekrarlanır

| Ne | Komut |
|---|---|
| Veritabanı yapısı (RLS, izinler, fonksiyonlar, depolar) — yalnızca okur | `supabase db query --linked -f supabase/tests/security-audit.sql` |
| Gerçek projede kural denemeleri (23 kontrol, veri bırakmaz) | `supabase db query --linked -f supabase/tests/remote-smoke.sql` |
| Supabase'in kendi denetimi | `supabase db advisors --linked --type security --level warn` |
| Tüm otomatik testler (veritabanı, yardımcılar, arayüz) | `npm test` |
| Bağımlılık açıkları | `npm audit --omit=dev` |

## Sonuçlar

| Alan | Sonuç |
|---|---|
| Satır güvenliği (RLS) | `public` şemasındaki tüm tablolarda açık. |
| Giriş yapmamış kullanıcı (anon) | Hiçbir tabloya izni yok; çalıştırabildiği tek fonksiyon `is_username_available` (kayıt ekranı, yalnızca evet/hayır döner). |
| Uygulama kullanıcısının yazma izinleri | Tahmin, puan, maç, sıralama yazılamaz. Tablo düzeyinde yalnızca oda silme ve üyelikten çıkma/çıkarma (kurallar RLS'te); sütun düzeyinde görünen ad, oda adı (yalnızca kurucu) ve bildirim tercihleri. |
| Sunucu yetkisiyle çalışan fonksiyonlar (SECURITY DEFINER) | Hepsinde `search_path` sabit; hepsi kimliği oturumdan (`auth.uid()`) alır, başkası adına işlem yapılamaz. Sunucu işleri (bildirim toplayıcıları, puanlama) uygulama kullanıcısına kapalı. |
| Tahmin kilidi | Maç başlayınca tahmin sunucu saatiyle reddedilir (tetikleyici + fonksiyon). |
| Gizli anahtarlar | Futbol API anahtarı, Supabase sunucu anahtarı ve senkron parolası yalnızca Supabase'te (Edge Function sırları ve Vault). Git'te ve uygulama/web paketinde gizli anahtar yok; pakette yalnızca zaten herkese açık olması gereken "publishable" anahtar var. `.env` ve `supabase/.temp` git'e girmez. |
| Edge Function'lar | Uygulama çağırmaz; zamanlayıcı `x-sync-secret` ile çağırır. Parola **sabit sürede** karşılaştırılır (bu denetimde düzeltildi). Parolasız/yanlış parolalı istek 403. |
| Depolama | Tek herkese açık depo `team-logos` (yalnızca okuma, 256 KB sınırı, listeleme kapalı); kullanıcı yükleyemez. |
| Bildirim adresleri | Tablo uygulamaya kapalı; yalnızca kendi cihazını fonksiyonla ekler/siler; hesap silinince silinir. |
| Davet bağlantısı | Kod biçimi denetlenir (`^[A-Z0-9]{6}$`); bağlantı odaya kendiliğinden katmaz, onay ister; yanlış kod denemeleri sınırlı (15 dakikada 10). |
| Hesap silme | Giriş bilgileri silinir, profil anonimleşir, cihaz adresleri ve tercihler silinir. |

## Bu denetimde yapılan düzeltmeler

- Edge Function'larda gizli parola karşılaştırması sabit süreli hale getirildi (`supabase/functions/_shared/security.ts`, testli).
- Yerel Supabase ayarında en kısa şifre 8 yapıldı (gerçek projede aşağıdaki adım gerekir).
- Yinelenebilir veritabanı denetim sorgusu eklendi (`supabase/tests/security-audit.sql`).

## Bilerek kabul edilen riskler

| Risk | Neden kabul edildi / ne zaman bakılacak |
|---|---|
| `npm audit`: 65 uyarı (çoğu yüksek) | Neredeyse tamamı geliştirme araçlarında (Expo derleyicisi, Metro, Jest, Tailwind); telefona giden koda girmez. Düzeltmeler büyük sürüm değişikliği ister, `npm audit fix --force` SDK'yı bozar. Expo SDK güncellemeleriyle kapanır. |
| `decode-uri-component` (orta) | Expo Router'ın bağlantı çözümlemesinde kullanılıyor; kötü niyetle hazırlanmış bir bağlantı açan kişinin kendi ekranını dondurabilir (veri sızıntısı yok). Düzeltilmiş sürüm Expo Router'ın kullandığı paketle uyumsuz; Expo güncellemesi beklenir. |
| Sızdırılmış şifre kontrolü kapalı | Supabase'te yalnızca Pro planda var. Pro'ya geçilirse açılmalı. |
| Kullanıcı adının alınmış olup olmadığı herkese açık | Kayıt ekranı için gerekli; yalnızca evet/hayır döner. |
| Oturum telefonda şifresiz SQLite dosyasında | Supabase'in Expo önerisi; dosya uygulamanın kendi alanında, iOS cihaz kilitliyken diski şifreler. |
| Expo bildirimlerinde "gelişmiş güvenlik" kapalı | Bildirim adresleri yalnızca sunucuda tutulduğu için risk düşük. Beta öncesi açılmalı (aşağıda). |

## Proje sahibinin yapması gerekenler

1. **Şimdi:** Supabase panelinde en kısa şifre uzunluğunu 8 yap (uygulama zaten 8 istiyor, sunucu 6'ya izin veriyor):
   Supabase → proje `tahminet` → Authentication → Sign In / Providers → Email → *Minimum password length* = 8 → Save.
2. **Beta öncesi:** Expo bildirimlerinde gelişmiş güvenlik: expo.dev → hesap → Access tokens → yeni token; proje ayarlarında *Enhanced Security for Push Notifications* açılır; token Supabase'e sır olarak eklenir:
   `supabase secrets set EXPO_ACCESS_TOKEN=...` (fonksiyon hazır, token varsa kullanır).
3. **Bir anahtar sızarsa:** Supabase panelinden ilgili anahtarı yenile (API Keys), `SYNC_SECRET` için yeni değer üretip hem `supabase secrets set` hem Vault'taki `sync_secret` güncellenir.
