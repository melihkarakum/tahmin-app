/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    // Özel yazı tiplerinde kalınlık, yazı tipi adıyla seçilir (fontWeight ile değil);
    // bu yüzden font-bold gibi sınıflar doğrudan ilgili yazı tipine bağlanır.
    // Adlar src/constants/fonts.ts ile aynıdır.
    fontFamily: {
      normal: ['PlusJakartaSans_400Regular'],
      medium: ['PlusJakartaSans_500Medium'],
      semibold: ['PlusJakartaSans_600SemiBold'],
      bold: ['PlusJakartaSans_700Bold'],
      extrabold: ['PlusJakartaSans_800ExtraBold'],
      black: ['PlusJakartaSans_800ExtraBold'],
    },
    fontWeight: {},
    extend: {
      // Renklerin gerçek değerleri src/global.css içindeki değişkenlerde durur.
      colors: {
        background: 'rgb(var(--color-background) / <alpha-value>)',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        'surface-muted': 'rgb(var(--color-surface-muted) / <alpha-value>)',
        border: 'rgb(var(--color-border) / <alpha-value>)',
        ink: 'rgb(var(--color-ink) / <alpha-value>)',
        muted: 'rgb(var(--color-muted) / <alpha-value>)',
        primary: 'rgb(var(--color-primary) / <alpha-value>)',
        'primary-soft': 'rgb(var(--color-primary-soft) / <alpha-value>)',
        'on-primary': 'rgb(var(--color-on-primary) / <alpha-value>)',
        danger: 'rgb(var(--color-danger) / <alpha-value>)',
        gold: 'rgb(var(--color-gold) / <alpha-value>)',
        live: 'rgb(var(--color-live) / <alpha-value>)',
      },
    },
  },
  plugins: [],
};
