// Güvenlik yardımcıları. Platforma özgü kod içermez: hem Edge Function'da (Deno) hem testlerde (Node) çalışır.

/**
 * Sabit sürede karşılaştırma: ilk farklı karakterde durmaz, böylece yanıt süresinden
 * gizli parolanın kaç karakterinin doğru olduğu tahmin edilemez.
 */
export function constantTimeEqual(a: string, b: string): boolean {
  const encoder = new TextEncoder();
  const left = encoder.encode(a);
  const right = encoder.encode(b);
  let diff = left.length ^ right.length;
  for (let index = 0; index < Math.max(left.length, right.length); index += 1) {
    diff |= (left[index] ?? 0) ^ (right[index] ?? 0);
  }
  return diff === 0;
}
