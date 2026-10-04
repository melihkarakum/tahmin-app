// Davet bağlantısı yardımcılarının testleri. Çalıştırma: npm test
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import {
  inviteMessage,
  inviteUrl,
  normalizeInviteCode,
  whatsappShareUrl,
} from '../src/lib/invite.ts';

describe('oda daveti', () => {
  test('bağlantıdaki kod temizlenir; geçersiz kod reddedilir', () => {
    assert.equal(normalizeInviteCode('abc234'), 'ABC234');
    assert.equal(normalizeInviteCode('  HT42K9 '), 'HT42K9');
    assert.equal(normalizeInviteCode('ABC23'), null);
    assert.equal(normalizeInviteCode('ABC2345'), null);
    assert.equal(normalizeInviteCode('ABC-23'), null);
    assert.equal(normalizeInviteCode('<script>'), null);
    assert.equal(normalizeInviteCode(undefined), null);
    assert.equal(normalizeInviteCode(['ABC234']), null);
  });

  test('davet bağlantısı ve mesajı', () => {
    assert.equal(inviteUrl('ABC234', 'https://ornek.app'), 'https://ornek.app/davet?kod=ABC234');
    assert.equal(
      inviteMessage('Cuma Ligi', 'ABC234', 'https://ornek.app'),
      'Cuma Ligi tahmin odasına katıl!\nhttps://ornek.app/davet?kod=ABC234\nOda kodu: ABC234',
    );
  });

  test('WhatsApp bağlantısında mesaj kodlanır (& ve # mesajı bölmez)', () => {
    const url = whatsappShareUrl('A & B #1\nhttps://ornek.app/davet?kod=ABC234');
    assert.equal(
      url,
      'https://wa.me/?text=A%20%26%20B%20%231%0Ahttps%3A%2F%2Fornek.app%2Fdavet%3Fkod%3DABC234',
    );
    assert.equal(decodeURIComponent(new URL(url).searchParams.get('text') ?? ''), 'A & B #1\nhttps://ornek.app/davet?kod=ABC234');
  });
});
