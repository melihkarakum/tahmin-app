import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

import { colors } from '@/constants/theme';

// Yalnızca web: her sayfanın HTML iskeleti (sayfalar önceden üretilirken Node'da çalışır).
// Web sürümü (Safari beta) ve davet sayfası bunu kullanır; WhatsApp bağlantı önizlemesi buradaki
// og: etiketlerini okur (WhatsApp sayfadaki JavaScript'i çalıştırmaz).
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="tr">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <title>Tahminet</title>
        <meta
          name="description"
          content="Süper Lig maçlarının skorunu tahmin et, arkadaşlarınla odalarda yarış. Para yok, ödül yok; sadece eğlence."
        />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Tahminet · Arkadaşlarınla skor tahmini" />
        <meta
          property="og:description"
          content="Tahmin odasına davet edildin: Süper Lig maçlarının skorunu tahmin et, odanın sıralamasında yarışın."
        />
        <meta name="theme-color" content={colors.background} />
        {/* Ana ekrana eklenince uygulama gibi tam ekran açılsın (iPhone Safari ve Android Chrome). */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black" />
        <meta name="apple-mobile-web-app-title" content="Tahminet" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: `body { background-color: ${colors.background}; }` }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
