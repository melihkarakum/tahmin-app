// src/global.css içindeki renklerin aynısı. Yalnızca className kullanamayan yerlerde
// (ikon rengi, sekme çubuğu, başlık çubuğu, gradyan) kullanılır. Bir renk değişirse iki dosya da güncellenir.
export const colors = {
  background: '#0B0E11',
  surface: '#151A1F',
  surfaceMuted: '#1F262D',
  border: '#262E36',
  ink: '#F2F5F7',
  muted: '#8B97A1',
  primary: '#22C55E',
  primarySoft: '#143423',
  onPrimary: '#06120B',
  danger: '#F87171',
  gold: '#F5B700',
  live: '#FF4D4F',
} as const;

// Ana sayfadaki özet kartının arka planı: koyu yeşilden yüzey rengine.
export const heroGradient = ['#14462B', '#151A1F'] as const;

// Sıralamada ilk üç.
export const medalColors = {
  1: '#F5B700',
  2: '#C9D1D9',
  3: '#D08C4F',
} as const;

// Skor ve puanlarda rakamların eşit genişlikte durması için.
export const tabularNums = { fontVariant: ['tabular-nums' as const] };
