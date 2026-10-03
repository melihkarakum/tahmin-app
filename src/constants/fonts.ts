// Uygulamanın yazı tipi: Plus Jakarta Sans. Her kalınlık ayrı bir yazı tipi adıdır;
// className'deki font-normal / font-medium / font-semibold / font-bold / font-extrabold / font-black
// sınıfları bunlara bağlıdır (bkz. tailwind.config.js). className kullanamayan yerlerde bu sabitler kullanılır.
export const fonts = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extrabold: 'PlusJakartaSans_800ExtraBold',
} as const;
