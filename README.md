# tahmin-app

Arkadaş gruplarıyla futbol skoru tahmin edilen sosyal uygulama. Bahis uygulaması değildir: para, ödül, kupon ve oran yoktur.

`tahmin-app` çalışma adıdır; uygulamanın gerçek adı FAZ 13'ten önce belirlenecek.

## Çalıştırma

```bash
npm install
```

```bash
npx expo start
```

Terminalde çıkan QR kodu iPhone kamerasıyla okut; proje Expo Go'da açılır.

iPhone'da Expo Go, projeyi yalnızca bilgisayardaki Expo CLI ile aynı Expo hesabına giriş yapılmışsa açar (SDK 57 kuralı). Bilgisayardaki hesabı `npx expo whoami` gösterir; Expo Go'da Home sekmesinde sağ üstteki hesap simgesinden aynı hesapla giriş yapılır.

## Kontroller

```bash
npx tsc --noEmit
```

```bash
npx expo lint
```

```bash
npx expo-doctor
```

## Dokümanlar

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): teknik mimari ve kararlar
- [docs/ROADMAP.md](docs/ROADMAP.md): fazlar, durum ve açık konular
