// Paylaşılan tahmin metinlerinin testleri. Çalıştırma: npm test
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { predictionShareText } from '../src/features/share/share-text.ts';

const base = {
  round: 8,
  status: 'finished',
  home: { id: 1, name: 'Galatasaray', shortName: 'GAL' },
  away: { id: 2, name: 'Fenerbahçe', shortName: 'FEN' },
  homeScore: 2,
  awayScore: 1,
  predictedHome: 2,
  predictedAway: 1,
};
const URL = 'https://ornek.app';

describe('paylaşılan tahmin metni', () => {
  test('tam skor, doğru sonuç, tutmayan ve bekleyen tahmin', () => {
    assert.equal(
      predictionShareText({ ...base, points: 5, resultType: 'exact' }, URL),
      '8. hafta Galatasaray - Fenerbahçe maçını 2-1 tam skor bildim! (+5 puan) Sen de tahmin et: https://ornek.app',
    );
    assert.match(
      predictionShareText({ ...base, predictedHome: 1, predictedAway: 0, points: 4, resultType: 'outcome_diff' }, URL),
      /sonucunu doğru bildim! Tahminim 1-0, maç 2-1 bitti\. \(\+4 puan\)/,
    );
    assert.match(
      predictionShareText({ ...base, predictedHome: 0, predictedAway: 2, points: 0, resultType: 'miss' }, URL),
      /tahminim 0-2 idi, maç 2-1 bitti\. Bu sefer olmadı!/,
    );
    assert.equal(
      predictionShareText({ ...base, status: 'scheduled', homeScore: null, awayScore: null, points: null, resultType: null }, URL),
      '8. hafta Galatasaray - Fenerbahçe maçı için tahminim: 2-1. Sen de tahmin et: https://ornek.app',
    );
  });

  test('metinlerde yasaklı kelimeler geçmez', () => {
    const texts = [
      predictionShareText({ ...base, points: 5, resultType: 'exact' }, URL),
      predictionShareText({ ...base, points: 3, resultType: 'outcome' }, URL),
      predictionShareText({ ...base, points: 0, resultType: 'miss' }, URL),
      predictionShareText({ ...base, points: null, resultType: null }, URL),
    ].join(' ').toLocaleLowerCase('tr-TR');
    for (const word of ['bahis', 'kupon', 'oran']) {
      assert.equal(new RegExp(`\\b${word}`).test(texts), false, word);
    }
  });
});
