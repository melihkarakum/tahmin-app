import { Text as NativeText, type TextProps } from 'react-native';

const FONT_CLASS = /(^|\s)font-(normal|medium|semibold|bold|extrabold|black)(\s|$)/;

/**
 * Uygulamanın yazı tipiyle metin. react-native'in Text'i yerine her yerde bu kullanılır.
 * className'de kalınlık sınıfı yoksa normal kalınlık eklenir; böylece hiçbir yazı sistem fontunda kalmaz.
 */
export function Text({ className, ...props }: TextProps) {
  const fontClassName =
    className && FONT_CLASS.test(className) ? className : `font-normal ${className ?? ''}`.trim();
  return <NativeText className={fontClassName} {...props} />;
}
