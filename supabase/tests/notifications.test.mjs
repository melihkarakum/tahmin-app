// Bildirim kurallarının testleri. Çalıştırma: npm run test:db
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { asUser, createMatch, createTestDb, insertPrediction, seedLeague, signUp } from './helpers.mjs';

const PERMISSION_DENIED = /permission denied/;
const TOKEN_A = 'ExponentPushToken[aaaaaaaaaaaaaaaaaaaaaa]';
const TOKEN_B = 'ExponentPushToken[bbbbbbbbbbbbbbbbbbbbbb]';
const TOKEN_C = 'ExponentPushToken[cccccccccccccccccccccc]';

function registerToken(db, userId, token, platform = 'ios') {
  return asUser(db, userId, 'select public.register_push_token($1, $2)', [token, platform]);
}

/** Bugünün verilen saati, Türkiye saatiyle (gece sessizliğini denetlemek için). */
async function istanbulTime(db, hour) {
  const { rows } = await db.query(
    "select (date_trunc('day', now() at time zone 'Europe/Istanbul') + make_interval(hours => $1)) at time zone 'Europe/Istanbul' as at",
    [hour],
  );
  return rows[0].at;
}

async function tokenOwner(db, token) {
  const { rows } = await db.query('select user_id from public.push_tokens where token = $1', [token]);
  return rows[0]?.user_id ?? null;
}

async function count(db, sql, params = []) {
  const { rows } = await db.query(sql, params);
  return Number(rows[0].count);
}

describe('bildirim tercihleri', () => {
  test('varsayılan ikisi de açık; kullanıcı kendi tercihini değiştirir, başkasınınkini göremez', async () => {
    const db = await createTestDb();
    const ali = await signUp(db, 'ali', 'Ali');
    const burak = await signUp(db, 'burak', 'Burak');

    const before = await asUser(db, ali, 'select * from public.get_my_notification_settings()');
    assert.deepEqual(before.rows[0], { match_reminders: true, round_results: true });

    await asUser(db, ali, 'select public.set_notification_settings(false, true)');
    await asUser(db, ali, 'select public.set_notification_settings(false, false)');
    const after = await asUser(db, ali, 'select * from public.get_my_notification_settings()');
    assert.deepEqual(after.rows[0], { match_reminders: false, round_results: false });

    const visibleToBurak = await asUser(db, burak, 'select count(*) from public.notification_settings');
    assert.equal(Number(visibleToBurak.rows[0].count), 0);
    const burakSettings = await asUser(db, burak, 'select * from public.get_my_notification_settings()');
    assert.deepEqual(burakSettings.rows[0], { match_reminders: true, round_results: true });
  });

  test('başkası adına tercih yazılamaz', async () => {
    const db = await createTestDb();
    const ali = await signUp(db, 'ali', 'Ali');
    const burak = await signUp(db, 'burak', 'Burak');
    await assert.rejects(
      asUser(
        db,
        ali,
        'insert into public.notification_settings (user_id, match_reminders, round_results) values ($1, false, false)',
        [burak],
      ),
      /row-level security/,
    );
  });
});

describe('cihaz bildirim adresleri', () => {
  test('adres kaydedilir; uygulama adres tablosunu doğrudan okuyamaz', async () => {
    const db = await createTestDb();
    const ali = await signUp(db, 'ali', 'Ali');
    await registerToken(db, ali, TOKEN_A);
    assert.equal(await tokenOwner(db, TOKEN_A), ali);
    await assert.rejects(asUser(db, ali, 'select * from public.push_tokens'), PERMISSION_DENIED);
  });

  test('geçersiz adres ve platform reddedilir', async () => {
    const db = await createTestDb();
    const ali = await signUp(db, 'ali', 'Ali');
    await assert.rejects(registerToken(db, ali, 'abc'), /Geçersiz bildirim adresi/);
    await assert.rejects(registerToken(db, ali, "ExponentPushToken[x'; drop table x;--]"), /Geçersiz bildirim adresi/);
    await assert.rejects(registerToken(db, ali, TOKEN_A, 'web'), /Geçersiz platform/);
  });

  test('aynı cihazda başka hesaba geçilince adres yeni hesaba taşınır', async () => {
    const db = await createTestDb();
    const ali = await signUp(db, 'ali', 'Ali');
    const burak = await signUp(db, 'burak', 'Burak');
    await registerToken(db, ali, TOKEN_A);
    await registerToken(db, burak, TOKEN_A);
    assert.equal(await tokenOwner(db, TOKEN_A), burak);
    assert.equal(await count(db, 'select count(*) from public.push_tokens'), 1);
  });

  test('kişi yalnızca kendi adresini silebilir', async () => {
    const db = await createTestDb();
    const ali = await signUp(db, 'ali', 'Ali');
    const burak = await signUp(db, 'burak', 'Burak');
    await registerToken(db, ali, TOKEN_A);
    await asUser(db, burak, 'select public.unregister_push_token($1)', [TOKEN_A]);
    assert.equal(await tokenOwner(db, TOKEN_A), ali);
    await asUser(db, ali, 'select public.unregister_push_token($1)', [TOKEN_A]);
    assert.equal(await tokenOwner(db, TOKEN_A), null);
  });

  test('bir hesapta en fazla 10 cihaz tutulur', async () => {
    const db = await createTestDb();
    const ali = await signUp(db, 'ali', 'Ali');
    for (let index = 0; index < 12; index += 1) {
      await registerToken(db, ali, `ExponentPushToken[device${String(index).padStart(2, '0')}xxxxxxxxxxxx]`);
    }
    assert.equal(await count(db, 'select count(*) from public.push_tokens where user_id = $1', [ali]), 10);
    assert.equal(await tokenOwner(db, 'ExponentPushToken[device00xxxxxxxxxxxx]'), null);
    assert.equal(await tokenOwner(db, 'ExponentPushToken[device11xxxxxxxxxxxx]'), ali);
  });

  test('hesap silinince adresleri, tercihleri ve bildirim kayıtları da silinir', async () => {
    const db = await createTestDb();
    const ali = await signUp(db, 'ali', 'Ali');
    await registerToken(db, ali, TOKEN_A);
    await asUser(db, ali, 'select public.set_notification_settings(true, false)');
    await db.query("insert into public.notification_log (user_id, kind, ref) values ($1, 'match_reminder', '1')", [ali]);

    await asUser(db, ali, 'select public.delete_my_account()');

    assert.equal(await count(db, 'select count(*) from public.push_tokens'), 0);
    assert.equal(await count(db, 'select count(*) from public.notification_settings'), 0);
    assert.equal(await count(db, 'select count(*) from public.notification_log'), 0);
  });
});

describe('maç hatırlatması', () => {
  async function setup() {
    const db = await createTestDb();
    const seed = await seedLeague(db);
    const ali = await signUp(db, 'ali', 'Ali');
    const burak = await signUp(db, 'burak', 'Burak');
    const cem = await signUp(db, 'cem', 'Cem');
    await signUp(db, 'deniz', 'Deniz'); // cihazı yok: bildirim almaz
    await registerToken(db, ali, TOKEN_A);
    await registerToken(db, burak, TOKEN_B);
    await registerToken(db, cem, TOKEN_C);
    await asUser(db, cem, 'select public.set_notification_settings(false, true)');
    return { db, seed, ali, burak, cem };
  }

  test('yalnızca tahmin yapmamış, hatırlatması açık ve cihazı olan kişiye gider; bir kez gider', async () => {
    const { db, seed, ali, burak } = await setup();
    const soon = await createMatch(db, seed, 30);
    await createMatch(db, seed, 180); // 1 saatten uzak: hatırlatılmaz
    await insertPrediction(db, burak, soon, 1, 0);

    const dry = await db.query('select * from public.collect_match_reminders(now(), true)');
    assert.equal(dry.rows.length, 1);
    assert.equal(await count(db, 'select count(*) from public.notification_log'), 0);

    const real = await db.query('select * from public.collect_match_reminders(now(), false)');
    assert.deepEqual(real.rows, [
      {
        user_id: ali,
        tokens: [TOKEN_A],
        title: 'Maç başlamak üzere',
        body: 'Galatasaray - Fenerbahçe 1 saat içinde başlıyor. Tahminini yapmayı unutma!',
        url: '/',
      },
    ]);

    const again = await db.query('select * from public.collect_match_reminders(now(), false)');
    assert.equal(again.rows.length, 0);
  });

  test('aynı saatlerdeki birden fazla maç tek bildirimde toplanır', async () => {
    const { db, seed, ali } = await setup();
    await createMatch(db, seed, 20);
    await createMatch(db, seed, 40);
    const { rows } = await db.query(
      'select body from public.collect_match_reminders(now(), false) where user_id = $1',
      [ali],
    );
    assert.deepEqual(rows, [{ body: '2 maç 1 saat içinde başlıyor. Tahminlerini yapmayı unutma!' }]);
  });

  test('uygulama kullanıcısı toplayıcı fonksiyonları çağıramaz', async () => {
    const { db, ali } = await setup();
    await assert.rejects(asUser(db, ali, 'select * from public.collect_match_reminders()'), PERMISSION_DENIED);
    await assert.rejects(asUser(db, ali, 'select * from public.collect_round_results()'), PERMISSION_DENIED);
  });
});

describe('hafta sonucu bildirimi', () => {
  async function setup() {
    const db = await createTestDb();
    const seed = await seedLeague(db);
    const ali = await signUp(db, 'ali', 'Ali');
    const burak = await signUp(db, 'burak', 'Burak');
    const cem = await signUp(db, 'cem', 'Cem');
    await registerToken(db, ali, TOKEN_A);
    await registerToken(db, burak, TOKEN_B);
    await registerToken(db, cem, TOKEN_C);
    await asUser(db, cem, 'select public.set_notification_settings(true, false)');

    const noon = await istanbulTime(db, 12);
    const first = await createMatch(db, seed, 60);
    const second = await createMatch(db, seed, 60);
    for (const userId of [ali, burak, cem]) await insertPrediction(db, userId, first, 2, 1);
    await insertPrediction(db, burak, second, 0, 0);

    // İki maç da bugün oynandı ve bitti: Ali 5, Burak 5 + 0, Cem 5 puan (Cem bildirimi kapattı).
    await db.query(
      "update public.matches set kickoff_at = $2::timestamptz - interval '5 hours', status = 'finished', home_score = 2, away_score = 1 where id = $1",
      [first, noon],
    );
    await db.query(
      "update public.matches set kickoff_at = $2::timestamptz - interval '3 hours', status = 'finished', home_score = 1, away_score = 0 where id = $1",
      [second, noon],
    );
    return { db, seed, ali, burak, noon };
  }

  test('haftanın puanı ve Türkiye sırası gider; bir kez gider', async () => {
    const { db, ali, burak, noon } = await setup();
    const { rows } = await db.query(
      'select user_id, tokens, title, body, url from public.collect_round_results($1, false) order by user_id = $2 desc',
      [noon, ali],
    );
    assert.deepEqual(rows, [
      {
        user_id: ali,
        tokens: [TOKEN_A],
        title: '1. Hafta tamamlandı',
        body: '5 puan aldın. Haftanın Türkiye sıralamasında 1. sıradasın (3 kişi).',
        url: '/leaderboard',
      },
      {
        user_id: burak,
        tokens: [TOKEN_B],
        title: '1. Hafta tamamlandı',
        body: '5 puan aldın. Haftanın Türkiye sıralamasında 1. sıradasın (3 kişi).',
        url: '/leaderboard',
      },
    ]);

    const again = await db.query('select * from public.collect_round_results($1, false)', [noon]);
    assert.equal(again.rows.length, 0);
  });

  test('gece (22:00-09:00) gönderilmez; sabah gönderilir', async () => {
    const { db, noon } = await setup();
    const night = await istanbulTime(db, 23);
    const atNight = await db.query('select * from public.collect_round_results($1, false)', [night]);
    assert.equal(atNight.rows.length, 0);

    const morning = await db.query(
      "select * from public.collect_round_results($1::timestamptz + interval '21 hours', false)",
      [noon],
    );
    assert.equal(morning.rows.length, 2);
  });

  test('oynanacak maçı kalan hafta bildirilmez', async () => {
    const { db, seed, noon } = await setup();
    await createMatch(db, seed, 24 * 60); // aynı haftada (1.) henüz oynanmamış maç
    const { rows } = await db.query('select * from public.collect_round_results($1, false)', [noon]);
    assert.equal(rows.length, 0);
  });
});
