// src/global.css içindeki renklerin aynısı. Yalnızca className kullanamayan yerlerde
// (ikon rengi, sekme çubuğu, başlık çubuğu) kullanılır. Bir renk değişirse iki dosya da güncellenir.
export const colors = {
  background: '#F7F7F5',
  surface: '#FFFFFF',
  surfaceMuted: '#F0F0ED',
  border: '#E5E5E0',
  ink: '#111815',
  muted: '#6B726E',
  primary: '#15803D',
  primarySoft: '#E9F5ED',
  onPrimary: '#FFFFFF',
  danger: '#B91C1C',
} as const;

// Skor ve puanlarda rakamların eşit genişlikte durması için.
export const tabularNums = { fontVariant: ['tabular-nums' as const] };
