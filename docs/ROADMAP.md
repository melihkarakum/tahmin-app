# Yol Haritası

Her faz tamamlanınca onay alınır; onaysız sonraki faza geçilmez.

## Fazlar

| Faz | Konu | Durum |
|---|---|---|
| 0 | Ürün analizi | Tamamlandı (2026-10-02) |
| 1 | Teknik mimari | Tamamlandı (2026-10-02) |
| 2 | Proje kurulumu | Tamamlandı (2026-10-02) |
| 3 | Supabase kurulumu | Tamamlandı (2026-10-03): proje `tahminet` (`orkoxffobuwdljcdmltg`, Frankfurt), `.env` yazıldı, CLI bağlı |
| – | Arayüz önizlemesi (örnek veriyle) | Tamamlandı (2026-10-02); ekranlar `src/mocks/data.ts` ile çalışıyor, FAZ 7–12'de gerçek veriye bağlanacak |
| 4 | Veritabanı | Tamamlandı (2026-10-03): 4 migration yüklendi; 29 yerel test, gerçek projede 12 güvenlik kontrolü ve Supabase güvenlik/performans denetimi temiz |
| 5 | Giriş ve kayıt | Kod tamam (2026-10-03): kayıt, giriş, çıkış, oturum hatırlama, kullanım koşulu onayı; 32 yerel test + gerçek projede kontrol geçti. Telefonda gerçek kayıt testi bekleniyor |
| 6 | Futbol API entegrasyonu | Tamamlandı (2026-10-03): senkron fonksiyonu ve zamanlayıcı çalışıyor, 2024-25 sezonuyla uçtan uca doğrulandı (19 takım, 342 maç). Güncel sezon için ücretli API planı gerekiyor |
| 7 | Maçlar | Tamamlandı (2026-10-03): ana sayfa veritabanındaki güncel haftayı gösteriyor; test haftasıyla. Görsel tasarım koyu premium temaya geçti |
| 8 | Tahmin sistemi | Tamamlandı (2026-10-03, FAZ 7 ile birlikte): tahmin sunucuya kaydediliyor ve güncelleniyor; 47 yerel test + gerçek projede 14 kontrol geçti. Telefonda deneme bekleniyor |
| 9 | Puanlama | Tamamlandı (2026-10-03): maç bitince tahminler sunucuda otomatik puanlanıyor; skor düzeltmesinde yeniden, iptalde geri alınıyor. 55 yerel test + gerçek projede 16 kontrol geçti |
| 10 | Arkadaş odaları | Tamamlandı (2026-10-03): oda kurma (güçlü rastgele 6 karakterli kod), kodla katılma (yanlış deneme sınırı), haftalık/sezon oda sıralaması, üye çıkarma, odadan ayrılma, oda silme. 64 yerel test + gerçek projede 18 kontrol. 2026-10-04: odada yalnızca oda kurulduktan sonra başlayan maçlar sayılıyor (kullanıcı kararı) |
| 11 | Sıralama | Tamamlandı (2026-10-04): Türkiye geneli haftalık ve sezon sıralaması (ilk 50 + kendi sıran / toplam kişi), hafta kartında haftalık sıra. Yalnızca puanlanmış tahmini olanlar sıralamaya girer; banlı ve silinmiş hesaplar sayılmaz. 68 yerel test |
| 12 | Profil ve istatistikler | Tamamlandı (2026-10-04): gerçek istatistikler (sezon puanı, tahmin, tam skor, doğru sonuç, doğruluk, son 5 hafta, Türkiye sırası), tahmin geçmişi (tahmin zamanıyla), uygulama içinden hesap silme (giriş bilgisi silinir, profil anonimleşir). Örnek veri tamamen kaldırıldı. 74 yerel test + gerçek projede 19 kontrol |
| 13 | Bildirimler | Kod tamam (2026-10-04): maç hatırlatması (tahmin yapılmamış maç başlamadan 1 saat önce) ve hafta sonucu (puan + haftalık Türkiye sırası, 09:00-22:00 arası); Profil'de iki anahtar; ilk tahminden sonra uygulama içi "haber verelim mi?" sorusu; bildirime dokununca ilgili ekran açılır. Gönderim 10 dakikada bir sunucudan. 95 yerel test + gerçek projede 23 kontrol. iPhone'da deneme kullanıcı kararıyla sonraya bırakıldı; Android'de Expo Go bildirim almıyor, mağaza sürümünde çalışacak |
| 14 | WhatsApp daveti ve deep linking | Tamamlandı (2026-10-04): oda ekranında "WhatsApp" ve "Paylaş" düğmeleri; mesajda tıklanabilir davet bağlantısı (`https://tahminet.expo.app/davet?kod=…`, EAS Hosting ücretsiz). Bağlantı tarayıcıda kodu ve katılma adımlarını gösteren sayfayı açar; uygulamada `davet` ekranı onay alıp odaya katılır, girişsizse kodu saklayıp girişten sonra devam eder. Yayındaki web sitesinde uygulamanın geri kalanı kapalı. 98 yerel test. Bağlantının uygulamayı doğrudan açması (Universal Links / App Links) mağaza sürümüyle (FAZ 19, Apple hesabı gerekir) |
| 15 | Arayüz cilası | Tamamlandı (2026-10-04): oda ekranı yenilendi (katlanır davet alanı, kürsü, kurucu oda adını değiştirebilir); Bu Hafta/Sezon ayrı düğmeler; iskelet yükleme; dokunuş titreşimi. Kullanılabilirlik turu: maç kartında skor paneli hep açık, tahmin düğmesi durum değiştiren tek düğme (Kaydet → Kaydediliyor → Kaydedildi ✓, hata olursa sallanır), basınca küçülen düğmeler; kart büyüyüp küçülmediği için ekran kaymıyor. Profil Instagram düzeninde (ayarlar ayrı ekranda, profili düzenle), "Skor Tahminlerim" süzgeçli (Doğru/Tam Skor/Yanlış/Bekleyen), en fazla 6 tahmin + "Tüm tahminlerini gör" ekranı; her tahmin ve sezon özeti 9:16 görsel olarak (Instagram hikâye, WhatsApp, DM) ya da metin olarak paylaşılır. Alttan açılan ekranlarda her zaman kapat (X). Skor panelinde tek dokunuşla 0-0 "Sıfırla"; odalar ekranında boş durum ortada, oda varken "Oda Kur / Koda Katıl" altta. Uygulama simgesi ve açılış görseli marka adı belli olunca (FAZ 19) |
| 16 | Test | Tamamlandı (2026-10-04): `npm test` tek komutla 103 veritabanı/yardımcı testi (PGlite) ve 13 arayüz testini (Jest + React Native Testing Library: tahmin düğmesi, maç kartı, süzgeçler, oda sıralaması) çalıştırır; GitHub'da her push'ta tip denetimi + kod denetimi + testler (`.github/workflows/ci.yml`); gerçek projede 23 güvenlik kontrolü; telefonda adım adım deneme listesi `docs/TEST_PLAN.md`. Telefonda tam tur deneme kullanıcıda |
| 17 | Güvenlik denetimi | Tamamlandı (2026-10-04): RLS, izinler, sunucu fonksiyonları, depolar, gizli anahtarlar (git + uygulama paketi), Edge Function'lar ve bağımlılıklar denetlendi; gizli parola karşılaştırması sabit süreli yapıldı; tekrarlanabilir denetim sorgusu eklendi. Rapor ve kabul edilen riskler: `docs/SECURITY.md`. Proje sahibine kalan: Supabase panelinde en kısa şifreyi 8 yapmak |
| 18 | Beta | |
| 19 | App Store ve Google Play hazırlığı | |
| 20 | Yayın | |

## MVP kapsamı

1. Kayıt ve giriş
2. Kullanıcı profili
3. Süper Lig fikstürü
4. Maçları listeleme
5. Skor tahmini
6. Tahmin kilitleme
7. Gerçek maç sonucunu API'den alma
8. Otomatik puan hesaplama
9. Kullanıcı toplam puanı
10. Tahmin geçmişi
11. Arkadaş odası oluşturma
12. Odaya katılma
13. Oda sıralaması
14. Haftalık sıralama
15. Basit Türkiye sıralaması
16. Temel push bildirimi
17. WhatsApp üzerinden oda daveti

Listeye eklenen zorunlular: uygulama içinden hesap silme, kayıtta gizlilik ve KVKK onayı, ertelenen ve iptal edilen maçların işlenmesi, hatalı skorun elle düzeltilmesi.

## Doğrulanmamış bilgiler

- **API-Football ücretli plan fiyatı:** resmi fiyat sayfası okunamadı; ikincil kaynaklara göre en ucuz ücretli plan 19 $/ay. Satın almadan önce panelden kontrol edilmeli.

## Doğrulanan bilgiler

- **API-Football ücretsiz planı güncel sezonu vermiyor** (2026-10-03, gerçek anahtarla denendi): "Free plans do not have access to this season, try from 2022 to 2024." Günlük 100 istek. Süper Lig kimliği 203.
- **Edge Function yükleme Docker'sız çalışıyor:** `--use-api` seçeneğiyle.

## Bilinen ayarlar

- **E-posta doğrulaması açık** (Supabase varsayılanı). Hazır e-posta servisi yalnızca ekip adreslerine, saatte 2 ileti gönderir. FAZ 5'te karar verilecek.
- **Veritabanı komutları şifresiz çalışıyor:** `supabase db push` ve `supabase db query --linked` geçici bir giriş rolü kullanıyor.
- **Gerçek projede güvenlik kontrolü:** `supabase db query --linked -f supabase/tests/remote-smoke.sql` (veri bırakmaz; sonuç "SMOKE geçen=… kalan=…" hata mesajı olarak döner).

## Zamanı gelince karar verilecekler

| Konu | En geç |
|---|---|
| Kendi e-posta servisi (hazır servis yalnızca ekip adreslerine gönderir) ve e-posta doğrulamasını yeniden açmak | Arkadaşlar kayıt olmadan önce |
| Şifre sıfırlama (e-posta servisi ve uygulamaya dönen bağlantı gerektirir) | Beta öncesi |
| Kullanım koşulları ve gizlilik politikası metinleri (kayıt ekranındaki onay kutusu bunlara bağlanacak) | Beta öncesi |
| Supabase'de en kısa şifre uzunluğunu 8'e çıkarmak (uygulama zaten 8 istiyor; adım `docs/SECURITY.md`'de) | Proje sahibi, şimdi |
| Expo bildirimlerinde gelişmiş güvenlik (`EXPO_ACCESS_TOKEN`) | Beta öncesi |
| API-Football ücretli plana geçiş (güncel sezon için şart); ardından test maçlarını silmek | Gerçek maçlarla test ya da beta öncesi |
| Uygulamanın gerçek adı ve mağaza kimliği | FAZ 13 |
| Apple Developer hesabı: yıllık 99 USD (bölgeye göre yerel para biriminde), iki adımlı doğrulamalı Apple hesabı ve yasal ad gerekir. App Store ve TestFlight için şart (Expo Go'da bildirim testi için gerekmiyor) | Beta öncesi |
| Alan adı (e-posta göndereni, gizlilik sayfası; davet linki şimdilik ücretsiz `tahminet.expo.app`). Kendi alan adını EAS Hosting'e bağlamak ücretli plan ister | Beta öncesi |
| Davet bağlantısının uygulamayı doğrudan açması: `public/.well-known/apple-app-site-association` (Apple Team ID gerekir) + `ios.associatedDomains`, Android için `assetlinks.json` + `intentFilters` | FAZ 19 |
| Takım logoları: kullanıcı kararıyla uygulamada açık (2026-10-04). Logoların hakları kulüplere ait; futbol API'si de kullanım izninin hak sahiplerinden alınması gerekebileceğini söylüyor. Mağazaya çıkmadan önce avukat görüşü ya da kulüp/lig izni şart. Gerekirse sunucudan tek komutla kapatılır (ARCHITECTURE.md) | FAZ 19 |

## Yayın öncesi kontrol listesi

- 7258 sayılı Kanun açısından avukat görüşü
- KVKK: aydınlatma metni, açık rıza, verinin yurt dışında tutulması
- Futbol API kullanım şartları: ticari kullanım ve veriyi saklama
- Takım logoları ve "Trendyol Süper Lig" adının kullanım hakkı
- Google Play ve App Store politikaları; arayüzde ve mağaza metninde "bahis, kupon, oran" kelimeleri yok
- Güncel mağaza hesap ücretleri ve test zorunlulukları
