/**
 * Türkçe kurallarıyla büyük harf: "i" -> "İ", "ı" -> "I".
 * CSS/React Native'deki uppercase dönüşümü dilden bağımsızdır ve "Tahmin"i "TAHMIN" yapar;
 * bu yüzden büyük harfli etiketler her zaman bu fonksiyonla yazılır.
 */
export function trUpper(text: string): string {
  return text.replace(/i/g, 'İ').toUpperCase();
}
