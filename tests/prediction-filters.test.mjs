// "Skor Tahminlerim" süzgeçlerinin testleri. Çalıştırma: npm test
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { filterCounts, matchesFilter, predictionOutcome } from '../src/features/profile/prediction-filters.ts';

const exact = { points: 5, resultType: 'exact' };
const outcomeDiff = { points: 4, resultType: 'outcome_diff' };
const outcome = { points: 3, resultType: 'outcome' };
const miss = { points: 0, resultType: 'miss' };
const pending = { points: null, resultType: null };

describe('skor tahminlerim süzgeçleri', () => {
  test('tahminin sonucu doğru sınıflanır', () => {
    assert.equal(predictionOutcome(exact), 'exact');
    assert.equal(predictionOutcome(outcomeDiff), 'outcome');
    assert.equal(predictionOutcome(outcome), 'outcome');
    assert.equal(predictionOutcome(miss), 'miss');
    assert.equal(predictionOutcome(pending), 'pending');
  });

  test('"Doğru" tam skorları da kapsar; "Yanlış" yalnızca tutmayanlar', () => {
    assert.equal(matchesFilter(exact, 'correct'), true);
    assert.equal(matchesFilter(outcome, 'correct'), true);
    assert.equal(matchesFilter(miss, 'correct'), false);
    assert.equal(matchesFilter(pending, 'correct'), false);
    assert.equal(matchesFilter(miss, 'miss'), true);
    assert.equal(matchesFilter(pending, 'miss'), false);
    assert.equal(matchesFilter(outcome, 'exact'), false);
  });

  test('süzgeç sayıları', () => {
    assert.deepEqual(filterCounts([exact, outcomeDiff, outcome, miss, pending, pending]), {
      all: 6,
      correct: 3,
      exact: 1,
      miss: 1,
      pending: 2,
    });
  });
});
