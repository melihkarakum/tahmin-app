// Bildirim gönderim yardımcılarının testleri. Çalıştırma: npm run test:db
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { buildMessages, chunk, deadTokensFromReceipts, readTickets } from '../functions/_shared/push.ts';

const row = (tokens, title = 'Başlık') => ({ user_id: 'u1', tokens, title, body: 'Metin', url: '/' });

describe('Expo bildirim yardımcıları', () => {
  test('her cihaz adresine ayrı ileti oluşur; adresi olmayan atlanır', () => {
    const messages = buildMessages([row(['ExponentPushToken[a]', 'ExponentPushToken[b]']), row(null)]);
    assert.equal(messages.length, 2);
    assert.deepEqual(messages[0], {
      to: 'ExponentPushToken[a]',
      title: 'Başlık',
      body: 'Metin',
      data: { url: '/' },
      sound: 'default',
      channelId: 'default',
    });
  });

  test('iletiler 100erli gruplara bölünür', () => {
    const groups = chunk(Array.from({ length: 230 }, (_, index) => index), 100);
    assert.deepEqual(
      groups.map((group) => group.length),
      [100, 100, 30],
    );
  });

  test('biletler iletilerle eşleşir; silinmiş cihaz ayıklanır', () => {
    const messages = buildMessages([row(['T1', 'T2', 'T3'])]);
    const outcome = readTickets(messages, [
      { status: 'ok', id: 'r1' },
      { status: 'error', message: 'gone', details: { error: 'DeviceNotRegistered' } },
      { status: 'error', message: 'too big', details: { error: 'MessageTooBig' } },
    ]);
    assert.deepEqual(outcome, {
      stored: [{ id: 'r1', token: 'T1' }],
      deadTokens: ['T2'],
      errors: ['MessageTooBig'],
    });
  });

  test('makbuzda DeviceNotRegistered dönen cihazlar ayıklanır', () => {
    const dead = deadTokensFromReceipts(
      {
        r1: { status: 'ok' },
        r2: { status: 'error', details: { error: 'DeviceNotRegistered' } },
        r3: { status: 'error', details: { error: 'MessageRateExceeded' } },
      },
      [
        { id: 'r1', token: 'T1' },
        { id: 'r2', token: 'T2' },
        { id: 'r3', token: 'T3' },
        { id: 'r4', token: 'T4' },
      ],
    );
    assert.deepEqual(dead, ['T2']);
  });
});
