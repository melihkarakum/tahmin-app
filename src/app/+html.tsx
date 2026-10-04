import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

import { colors } from '@/constants/theme';

// Yalnızca web: her sayfanın HTML iskeleti (sayfalar önceden üretilirken Node'da çalışır).
// Yayındaki web sitesi yalnızca davet sayfasıdır; WhatsApp bağlantı önizlemesi buradaki
// og: etiketlerini okur (WhatsApp sayfadaki JavaScript'i çalıştırmaz).
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="tr">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <title>Tahmin odasına davet</title>
        <meta name="description" content="Arkadaşın seni Süper Lig skor tahmini odasına davet etti." />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Tahmin odasına davet" />
        <meta
          property="og:description"
          content="Arkadaşın seni Süper Lig skor tahmini odasına davet etti. Kodu uygulamada gir, aynı odada yarışın."
        />
        <meta name="theme-color" content={colors.background} />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: `body { background-color: ${colors.background}; }` }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
