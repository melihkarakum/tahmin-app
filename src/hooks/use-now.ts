import { useEffect, useState } from 'react';

/** Şu anki zamanı verir ve belirli aralıklarla yeniler; geri sayım ve tahmin kilidi için. */
export function useNow(intervalMs = 30_000): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}
