// Edge Function güvenlik yardımcılarının testleri. Çalıştırma: npm run test:db
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { constantTimeEqual } from '../functions/_shared/security.ts';

describe('gizli parola karşılaştırması', () => {
  test('yalnızca birebir aynı parola kabul edilir', () => {
    assert.equal(constantTimeEqual('a1b2c3d4', 'a1b2c3d4'), true);
    assert.equal(constantTimeEqual('a1b2c3d4', 'a1b2c3d5'), false);
    assert.equal(constantTimeEqual('a1b2c3d4', 'a1b2c3d'), false);
    assert.equal(constantTimeEqual('a1b2c3d4', 'a1b2c3d4x'), false);
    assert.equal(constantTimeEqual('', 'a'), false);
    assert.equal(constantTimeEqual('şifre', 'sifre'), false);
  });
});
