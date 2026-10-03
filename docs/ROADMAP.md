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
| 9 | Puanlama | |
| 10 | Arkadaş odaları | |
| 11 | Sıralama | |
| 12 | Profil ve istatistikler | |
| 13 | Bildirimler | |
| 14 | WhatsApp daveti ve deep linking | |
| 15 | Arayüz cilası | |
| 16 | Test | |
| 17 | Güvenlik denetimi | |
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
| Supabase'de en kısa şifre uzunluğunu 8'e çıkarmak (uygulama zaten 8 istiyor) | FAZ 17 |
| API-Football ücretli plana geçiş (güncel sezon için şart); ardından test maçlarını silmek | Gerçek maçlarla test ya da beta öncesi |
| Uygulamanın gerçek adı ve mağaza kimliği | FAZ 13 |
| Apple Developer hesabı (iPhone'da bildirim testi için) | FAZ 13 |
| Alan adı (davet linki, e-posta göndereni, gizlilik sayfası) | FAZ 14 |
| Takım logolarının kullanılıp kullanılmayacağı | FAZ 19 |

## Yayın öncesi kontrol listesi

- 7258 sayılı Kanun açısından avukat görüşü
- KVKK: aydınlatma metni, açık rıza, verinin yurt dışında tutulması
- Futbol API kullanım şartları: ticari kullanım ve veriyi saklama
- Takım logoları ve "Trendyol Süper Lig" adının kullanım hakkı
- Google Play ve App Store politikaları; arayüzde ve mağaza metninde "bahis, kupon, oran" kelimeleri yok
- Güncel mağaza hesap ücretleri ve test zorunlulukları
