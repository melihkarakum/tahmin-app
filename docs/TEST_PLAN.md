# Telefonda test listesi

Otomatik testler (`npm test`) veritabanı kurallarını, yardımcı fonksiyonları ve önemli arayüz
parçalarını her değişiklikte dener. Bu liste ise yalnızca telefonda görülebilecek şeyler içindir:
dokunma, klavye, bildirim, paylaşma penceresi, gerçek ağ.

Nasıl: bilgisayarda `npx expo start`, iPhone'da Expo Go ile aç. Her maddeyi dene, sorun varsa
ekran kaydı al (en hızlı çözüm yolu budur).

## 1. Kayıt, giriş, çıkış

- [ ] Yeni hesap: kullanıcı adı alınmışsa uyarı çıkıyor; koşullar işaretlenmeden kayıt olmuyor.
- [ ] Yanlış şifreyle giriş: anlaşılır hata mesajı.
- [ ] Uygulamayı kapatıp aç: oturum hatırlanıyor, giriş ekranı bir an bile görünmüyor.
- [ ] Ayarlar → Çıkış Yap: giriş ekranına dönüyor; başka hesapla girince önceki hesabın verisi görünmüyor.

## 2. Ana sayfa ve tahmin

- [ ] Hafta kartında ‹ › ile hafta değişiyor; hafta adına dokununca seçici açılıyor.
- [ ] Açık maçta skoru artır/azalt: her dokunuşta hafif titreşim; 0'ın altına, 20'nin üstüne çıkmıyor.
- [ ] "Tahmini Kaydet" → "Kaydediliyor" → onay işaretiyle "Kaydedildi · saat"; kart büyüyüp küçülmüyor, altındaki maçlar kaymıyor.
- [ ] Kayıtlı tahminde skoru değiştir: düğme "Tahmini Güncelle" oluyor; eski skora dönünce yine "Kaydedildi".
- [ ] İnterneti kapatıp kaydet: düğme sallanıyor, "Bağlantı yok · Tekrar dene" yazıyor; internet açılınca dokununca kaydediyor.
- [ ] Başlamış maçta skor paneli yok, "Kilitlendi" yazıyor.
- [ ] Bitmiş maçta tahmin ve kazanılan puan görünüyor (tam skor altın).
- [ ] İlk tahminden sonra "Maçları kaçırma" sorusu bir kez çıkıyor.

## 3. Odalar

- [ ] Oda Kur / Koda Katıl panelleri düzgün açılıyor, klavye alanı kapatmıyor.
- [ ] Odada davet alanı kapalı başlıyor (tek başınaysan açık); dokununca WhatsApp ve Paylaş çıkıyor.
- [ ] WhatsApp: mesajda bağlantı tıklanabilir; bağlantı tarayıcıda kodu gösteren sayfayı açıyor.
- [ ] Kurucu: adın yanındaki kalemle oda adı değişiyor; odalar listesinde de yeni ad görünüyor.
- [ ] Bu Hafta / Sezon: ayrı düğmeler, geçişte liste zıplamıyor; puan varsa ilk üç kürsüde.
- [ ] Kurucu bir üyenin adına dokununca çıkarma sorusu; üye "Odadan Ayrıl" ile çıkabiliyor.
- [ ] Yanlış kodla 10'dan fazla deneme: 15 dakika bekleme uyarısı.

## 4. Sıralama

- [ ] Türkiye sıralamasında Bu Hafta / Sezon geçişi; altta kendi sıran.

## 5. Profil ve paylaşma

- [ ] Profil: kullanıcı adı, dişli, Puan/Tahmin/Sıra, "Profili Düzenle" ile görünen ad değişiyor.
- [ ] Skor Tahminlerim: süzgeçler (Tümü, Doğru, Tam Skor, Yanlış, Bekleyen) doğru sayıları gösteriyor; en fazla 6 kare, fazlası için "Tüm tahminlerini gör".
- [ ] Bir kareye dokun: paylaşma ekranı açılıyor, sağ üstte X var.
- [ ] "Görsel Olarak Paylaş": paylaşma penceresi açılıyor; Instagram hikâyesine ve WhatsApp'a gönder, görsel net (1080x1920) ve logolar görünüyor.
- [ ] "Metin Olarak Paylaş": mesajda tahmin ve bağlantı var.
- [ ] Profili Paylaş: sezon özeti kartı.

## 6. Bildirimler (iPhone)

- [ ] Ayarlar → Bildirimler → "Bildirimleri Aç" → izin ver.
- [ ] Deneme bildirimi geliyor (geliştirici gönderir: `send-notifications?mode=test&username=…`); dokununca uygulama açılıyor.
- [ ] Anahtarlar kapatılınca o tür bildirim gelmiyor.

## 7. Hesap silme (en son, deneme hesabıyla)

- [ ] Ayarlar → Hesabımı Sil → onay: giriş ekranına dönüyor; aynı e-postayla giriş yapılamıyor.

## Bilinen sınırlar

- Android'de Expo Go bildirim alamaz (mağaza sürümünde çalışır).
- Davet bağlantısı şimdilik tarayıcıda açılır; uygulamayı doğrudan açması mağaza sürümüyle gelecek.
