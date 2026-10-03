// Futbol API verisini dönüştüren fonksiyonların testleri. Çalıştırma: npm run test:db
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import {
  hasApiErrors,
  mapStatus,
  parseRound,
  resolveResult,
  seasonName,
  shortName,
  toMatchRow,
} from '../functions/_shared/api-football.ts';

function fixture({ status = 'NS', round = 'Regular Season - 8', fulltime = [null, null], goals = [null, null] } = {}) {
  return {
    fixture: { id: 1001, date: '2026-10-04T17:00:00+00:00', status: { short: status } },
    league: { id: 203, season: 2026, round },
    teams: {
      home: { id: 645, name: 'Galatasaray', logo: null },
      away: { id: 611, name: 'Fenerbahçe', logo: null },
    },
    goals: { home: goals[0], away: goals[1] },
    score: { fulltime: { home: fulltime[0], away: fulltime[1] } },
  };
}

const teamIds = new Map([
  ['645', 1],
  ['611', 2],
]);

describe('futbol API dönüşümleri', () => {
  test('durum kodları uygulama durumlarına çevrilir', () => {
    assert.equal(mapStatus('NS'), 'scheduled');
    assert.equal(mapStatus('TBD'), 'scheduled');
    assert.equal(mapStatus('2H'), 'live');
    assert.equal(mapStatus('SUSP'), 'live');
    assert.equal(mapStatus('FT'), 'finished');
    assert.equal(mapStatus('PEN'), 'finished');
    assert.equal(mapStatus('PST'), 'postponed');
    assert.equal(mapStatus('AWD'), 'cancelled');
    assert.equal(mapStatus('???'), null);
  });

  test('hafta numarası ve sezon adı okunur', () => {
    assert.equal(parseRound('Regular Season - 8'), 8);
    assert.equal(parseRound('Regular Season - 34'), 34);
    assert.equal(parseRound('Play-offs'), null);
    assert.equal(seasonName(2026), '2026-27');
    assert.equal(seasonName(2099), '2099-00');
  });

  test('kısa ad: API kodu varsa o, yoksa adın ilk üç harfi', () => {
    assert.equal(shortName('GAL', 'Galatasaray'), 'GAL');
    assert.equal(shortName(null, 'Beşiktaş'), 'BEŞ');
    assert.equal(shortName('', 'İstanbul Başakşehir'), 'İST');
  });

  test('biten maçta normal süre skoru kullanılır', () => {
    const result = resolveResult(fixture({ status: 'AET', fulltime: [1, 1], goals: [2, 1] }));
    assert.deepEqual(result, { status: 'finished', homeScore: 1, awayScore: 1 });
  });

  test('bitti denen ama skoru gelmeyen maç oynanıyor sayılır', () => {
    const result = resolveResult(fixture({ status: 'FT' }));
    assert.deepEqual(result, { status: 'live', homeScore: null, awayScore: null });
  });

  test('oynanan maçın skoru kaydedilmez', () => {
    const result = resolveResult(fixture({ status: '2H', goals: [1, 0] }));
    assert.deepEqual(result, { status: 'live', homeScore: null, awayScore: null });
  });

  test('maç satırı oluşturulur; eksik veride atlanır', () => {
    const row = toMatchRow(fixture({ status: 'FT', fulltime: [2, 1] }), 7, teamIds, 'api-football');
    assert.deepEqual(row, {
      season_id: 7,
      round: 8,
      home_team_id: 1,
      away_team_id: 2,
      kickoff_at: '2026-10-04T17:00:00+00:00',
      status: 'finished',
      home_score: 2,
      away_score: 1,
      provider: 'api-football',
      provider_id: '1001',
    });

    assert.equal(toMatchRow(fixture({ round: 'Play-offs' }), 7, teamIds, 'api-football'), null);
    assert.equal(toMatchRow(fixture(), 7, new Map(), 'api-football'), null);
    assert.equal(toMatchRow(fixture({ status: '???' }), 7, teamIds, 'api-football'), null);
  });

  test('API hata alanı doğru yorumlanır', () => {
    assert.equal(hasApiErrors([]), false);
    assert.equal(hasApiErrors({}), false);
    assert.equal(hasApiErrors({ plan: 'Free plans do not have access to this season' }), true);
    assert.equal(hasApiErrors(['token']), true);
  });
});
