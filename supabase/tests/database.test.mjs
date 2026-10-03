// Veritabanı kurallarının testleri. Çalıştırma: npm run test:db
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import {
  asAnon,
  asUser,
  createMatch,
  createRoom,
  createTestDb,
  insertPrediction,
  seedLeague,
  signUp,
} from './helpers.mjs';

const PERMISSION_DENIED = /permission denied/;
const WINDOW_CLOSED = /tahmin süresi doldu/;

describe('kayıt ve profil', () => {
  test('kayıt olunca profil otomatik oluşur, kullanıcı adı küçük harfe çevrilir', async () => {
    const db = await createTestDb();
    const id = await signUp(db, 'Melih_34', 'Melih');
    const { rows } = await db.query(
      'select username, display_name, role, is_banned from public.profiles where id = $1',
      [id],
    );
    assert.deepEqual(rows[0], {
      username: 'melih_34',
      display_name: 'Melih',
      role: 'user',
      is_banned: false,
    });
  });

  test('görünen ad verilmezse kullanıcı adı kullanılır', async () => {
    const db = await createTestDb();
    const id = await signUp(db, 'burak');
    const { rows } = await db.query('select display_name from public.profiles where id = $1', [id]);
    assert.equal(rows[0].display_name, 'burak');
  });

  test('kullanım koşulları kabul edilmeden kayıt olunamaz; kabul zamanı kaydedilir', async () => {
    const db = await createTestDb();
    await assert.rejects(
      signUp(db, 'melih', undefined, { acceptedTerms: false }),
      /kullanım koşulları/,
    );

    const id = await signUp(db, 'melih');
    const { rows } = await db.query(
      "select terms_accepted_at > now() - interval '1 minute' as recent from public.profiles where id = $1",
      [id],
    );
    assert.equal(rows[0].recent, true);
  });

  test('kullanıcı adı uygunluğu giriş yapmadan sorulabilir, liste açılmaz', async () => {
    const db = await createTestDb();
    await signUp(db, 'burak');

    const check = async (name) =>
      (await asAnon(db, 'select public.is_username_available($1) as ok', [name])).rows[0].ok;

    assert.equal(await check('melih'), true);
    assert.equal(await check('Burak'), false);
    assert.equal(await check('ab'), false);
    assert.equal(await check('geçersiz ad'), false);
    await assert.rejects(asAnon(db, 'select username from public.profiles'), PERMISSION_DENIED);
  });

  test('kullanım koşulları alanı uygulamadan okunamaz', async () => {
    const db = await createTestDb();
    const id = await signUp(db, 'melih');
    await assert.rejects(
      asUser(db, id, 'select terms_accepted_at from public.profiles where id = $1', [id]),
      PERMISSION_DENIED,
    );
  });

  test('alınmış ya da geçersiz kullanıcı adıyla kayıt tamamen reddedilir', async () => {
    const db = await createTestDb();
    await signUp(db, 'burak');
    await assert.rejects(signUp(db, 'BURAK'));
    await assert.rejects(signUp(db, 'ab'));
    await assert.rejects(signUp(db, 'boşluk var'));
    await assert.rejects(signUp(db, ''));

    const { rows } = await db.query('select count(*)::int as count from auth.users');
    assert.equal(rows[0].count, 1);
  });
});

describe('tahmin kilidi', () => {
  test('maç başlamadan tahmin kaydedilir, zamanı sunucu yazar, puan boş başlar', async () => {
    const db = await createTestDb();
    const seed = await seedLeague(db);
    const userId = await signUp(db, 'melih');
    const matchId = await createMatch(db, seed, 60);

    await db.query(
      `insert into public.predictions (user_id, match_id, home_goals, away_goals, points, result_type, created_at)
       values ($1, $2, 2, 1, 5, 'exact', '2000-01-01')`,
      [userId, matchId],
    );

    const { rows } = await db.query(
      `select points, result_type, created_at > now() - interval '1 minute' as fresh
       from public.predictions where user_id = $1`,
      [userId],
    );
    assert.deepEqual(rows[0], { points: null, result_type: null, fresh: true });
  });

  test('maç başladıktan sonra tahmin oluşturulamaz', async () => {
    const db = await createTestDb();
    const seed = await seedLeague(db);
    const userId = await signUp(db, 'melih');
    const matchId = await createMatch(db, seed, -5);

    await assert.rejects(insertPrediction(db, userId, matchId, 1, 0), WINDOW_CLOSED);
  });

  test('maç başladıktan sonra tahmin değiştirilemez', async () => {
    const db = await createTestDb();
    const seed = await seedLeague(db);
    const userId = await signUp(db, 'melih');
    const matchId = await createMatch(db, seed, 60);
    await insertPrediction(db, userId, matchId, 1, 0);

    await db.query("update public.matches set kickoff_at = now() - interval '1 minute' where id = $1", [
      matchId,
    ]);

    await assert.rejects(
      db.query('update public.predictions set home_goals = 3 where user_id = $1', [userId]),
      WINDOW_CLOSED,
    );
  });

  test('ertelenen ya da biten maça tahmin yapılamaz', async () => {
    const db = await createTestDb();
    const seed = await seedLeague(db);
    const userId = await signUp(db, 'melih');
    const postponed = await createMatch(db, seed, 60, 'postponed');
    const live = await createMatch(db, seed, 60, 'live');

    await assert.rejects(insertPrediction(db, userId, postponed, 1, 0), WINDOW_CLOSED);
    await assert.rejects(insertPrediction(db, userId, live, 1, 0), WINDOW_CLOSED);
  });

  test('aynı maça ikinci tahmin oluşturulamaz', async () => {
    const db = await createTestDb();
    const seed = await seedLeague(db);
    const userId = await signUp(db, 'melih');
    const matchId = await createMatch(db, seed, 60);
    await insertPrediction(db, userId, matchId, 1, 0);

    await assert.rejects(insertPrediction(db, userId, matchId, 2, 2), /predictions_one_per_match/);
  });

  test('skor 0-20 aralığı dışında olamaz', async () => {
    const db = await createTestDb();
    const seed = await seedLeague(db);
    const userId = await signUp(db, 'melih');
    const matchId = await createMatch(db, seed, 60);

    await assert.rejects(insertPrediction(db, userId, matchId, 21, 0), /predictions_goals_range/);
    await assert.rejects(insertPrediction(db, userId, matchId, -1, 0), /predictions_goals_range/);
  });

  test('puanlama, maç bittikten sonra puan yazabilir; tahmin zamanı değişmez', async () => {
    const db = await createTestDb();
    const seed = await seedLeague(db);
    const userId = await signUp(db, 'melih');
    const matchId = await createMatch(db, seed, 60);
    await insertPrediction(db, userId, matchId, 2, 1);
    const before = await db.query('select updated_at from public.predictions where user_id = $1', [
      userId,
    ]);

    await db.query(
      "update public.matches set kickoff_at = now() - interval '2 hours', status = 'finished', home_score = 2, away_score = 1 where id = $1",
      [matchId],
    );
    await db.query(
      "update public.predictions set points = 5, result_type = 'exact' where user_id = $1",
      [userId],
    );

    const after = await db.query(
      'select points, result_type, updated_at from public.predictions where user_id = $1',
      [userId],
    );
    assert.equal(after.rows[0].points, 5);
    assert.equal(after.rows[0].result_type, 'exact');
    assert.deepEqual(after.rows[0].updated_at, before.rows[0].updated_at);
  });
});

describe('uygulamanın yetkileri', () => {
  test('kullanıcı tahmin tablosuna doğrudan yazamaz (yazma sunucu fonksiyonuyla olacak)', async () => {
    const db = await createTestDb();
    const seed = await seedLeague(db);
    const userId = await signUp(db, 'melih');
    const matchId = await createMatch(db, seed, 60);

    await assert.rejects(
      asUser(
        db,
        userId,
        'insert into public.predictions (user_id, match_id, home_goals, away_goals) values ($1, $2, 1, 0)',
        [userId, matchId],
      ),
      PERMISSION_DENIED,
    );
  });

  test('kullanıcı kendi puanını değiştiremez', async () => {
    const db = await createTestDb();
    const seed = await seedLeague(db);
    const userId = await signUp(db, 'melih');
    const matchId = await createMatch(db, seed, 60);
    await insertPrediction(db, userId, matchId, 1, 0);

    await assert.rejects(
      asUser(db, userId, 'update public.predictions set points = 99 where user_id = $1', [userId]),
      PERMISSION_DENIED,
    );
  });

  test('kullanıcı maç sonucunu ve puan ayarlarını değiştiremez', async () => {
    const db = await createTestDb();
    const seed = await seedLeague(db);
    const userId = await signUp(db, 'melih');
    const matchId = await createMatch(db, seed, -120, 'finished').catch(() => null);
    assert.equal(matchId, null, 'skorsuz biten maç eklenememeli');

    const scheduled = await createMatch(db, seed, 60);
    await assert.rejects(
      asUser(db, userId, 'update public.matches set home_score = 5 where id = $1', [scheduled]),
      PERMISSION_DENIED,
    );
    await assert.rejects(
      asUser(db, userId, 'update public.scoring_config set exact_points = 50'),
      PERMISSION_DENIED,
    );
  });

  test('kullanıcı maçları ve puan ayarlarını okuyabilir', async () => {
    const db = await createTestDb();
    const seed = await seedLeague(db);
    const userId = await signUp(db, 'melih');
    await createMatch(db, seed, 60);

    const matches = await asUser(db, userId, 'select id from public.matches');
    const config = await asUser(db, userId, 'select exact_points from public.scoring_config');
    assert.equal(matches.rows.length, 1);
    assert.equal(config.rows[0].exact_points, 5);
  });

  test('giriş yapmamış biri hiçbir veriyi okuyamaz', async () => {
    const db = await createTestDb();
    await seedLeague(db);

    await assert.rejects(asAnon(db, 'select id from public.matches'), PERMISSION_DENIED);
    await assert.rejects(asAnon(db, 'select id from public.profiles'), PERMISSION_DENIED);
    await assert.rejects(asAnon(db, 'select id from public.predictions'), PERMISSION_DENIED);
  });
});

describe('tahmin görünürlüğü', () => {
  test('oda arkadaşının tahmini maç başlamadan görünmez, başlayınca görünür', async () => {
    const db = await createTestDb();
    const seed = await seedLeague(db);
    const melih = await signUp(db, 'melih');
    const burak = await signUp(db, 'burak');
    await createRoom(db, melih, 'HT42K9', [burak]);
    const matchId = await createMatch(db, seed, 60);
    await insertPrediction(db, burak, matchId, 3, 0);

    const visibleBefore = await asUser(
      db,
      melih,
      'select home_goals from public.predictions where user_id = $1',
      [burak],
    );
    assert.equal(visibleBefore.rows.length, 0);

    await db.query("update public.matches set kickoff_at = now() - interval '1 minute' where id = $1", [
      matchId,
    ]);

    const visibleAfter = await asUser(
      db,
      melih,
      'select home_goals from public.predictions where user_id = $1',
      [burak],
    );
    assert.equal(visibleAfter.rows.length, 1);
  });

  test('aynı odada olmayanın tahmini maç başlasa da görünmez', async () => {
    const db = await createTestDb();
    const seed = await seedLeague(db);
    const melih = await signUp(db, 'melih');
    const stranger = await signUp(db, 'yabanci');
    const matchId = await createMatch(db, seed, 60);
    await insertPrediction(db, stranger, matchId, 1, 1);
    await db.query("update public.matches set kickoff_at = now() - interval '1 minute' where id = $1", [
      matchId,
    ]);

    const visible = await asUser(db, melih, 'select id from public.predictions where user_id = $1', [
      stranger,
    ]);
    assert.equal(visible.rows.length, 0);
  });

  test('kendi tahminini her zaman görür', async () => {
    const db = await createTestDb();
    const seed = await seedLeague(db);
    const melih = await signUp(db, 'melih');
    const matchId = await createMatch(db, seed, 60);
    await insertPrediction(db, melih, matchId, 2, 1);

    const own = await asUser(db, melih, 'select home_goals, away_goals from public.predictions');
    assert.deepEqual(own.rows, [{ home_goals: 2, away_goals: 1 }]);
  });
});

describe('profiller', () => {
  test('başkalarının adını görebilir ama rolünü ve ban durumunu göremez', async () => {
    const db = await createTestDb();
    const melih = await signUp(db, 'melih');
    await signUp(db, 'burak');

    const names = await asUser(db, melih, 'select username, display_name from public.profiles');
    assert.equal(names.rows.length, 2);
    await assert.rejects(asUser(db, melih, 'select role from public.profiles'), PERMISSION_DENIED);
    await assert.rejects(
      asUser(db, melih, 'select is_banned from public.profiles'),
      PERMISSION_DENIED,
    );
  });

  test('kendi görünen adını değiştirebilir, başkasınınkini değiştiremez', async () => {
    const db = await createTestDb();
    const melih = await signUp(db, 'melih');
    const burak = await signUp(db, 'burak');

    const own = await asUser(
      db,
      melih,
      "update public.profiles set display_name = 'Melih K.' where id = $1 returning id",
      [melih],
    );
    const other = await asUser(
      db,
      melih,
      "update public.profiles set display_name = 'Hacked' where id = $1 returning id",
      [burak],
    );

    assert.equal(own.rows.length, 1);
    assert.equal(other.rows.length, 0);
    const { rows } = await db.query('select display_name from public.profiles where id = $1', [burak]);
    assert.equal(rows[0].display_name, 'burak');
  });

  test('kendini admin yapamaz, kullanıcı adını değiştiremez', async () => {
    const db = await createTestDb();
    const melih = await signUp(db, 'melih');

    await assert.rejects(
      asUser(db, melih, "update public.profiles set role = 'admin' where id = $1", [melih]),
      PERMISSION_DENIED,
    );
    await assert.rejects(
      asUser(db, melih, "update public.profiles set username = 'baskasi' where id = $1", [melih]),
      PERMISSION_DENIED,
    );
  });
});

describe('odalar', () => {
  test('oda ve üye listesi yalnızca üyelere görünür', async () => {
    const db = await createTestDb();
    const melih = await signUp(db, 'melih');
    const burak = await signUp(db, 'burak');
    const stranger = await signUp(db, 'yabanci');
    await createRoom(db, melih, 'HT42K9', [burak]);

    const member = await asUser(db, burak, 'select name from public.rooms');
    const outsider = await asUser(db, stranger, 'select name from public.rooms');
    const outsiderMembers = await asUser(db, stranger, 'select user_id from public.room_members');
    const memberMembers = await asUser(db, burak, 'select user_id from public.room_members');

    assert.equal(member.rows.length, 1);
    assert.equal(outsider.rows.length, 0);
    assert.equal(outsiderMembers.rows.length, 0);
    assert.equal(memberMembers.rows.length, 2);
  });

  test('oda adını yalnızca sahibi değiştirebilir', async () => {
    const db = await createTestDb();
    const melih = await signUp(db, 'melih');
    const burak = await signUp(db, 'burak');
    const roomId = await createRoom(db, melih, 'HT42K9', [burak]);

    const byMember = await asUser(
      db,
      burak,
      "update public.rooms set name = 'Burak FC' where id = $1 returning id",
      [roomId],
    );
    const byOwner = await asUser(
      db,
      melih,
      "update public.rooms set name = 'Halısaha Tayfa' where id = $1 returning id",
      [roomId],
    );

    assert.equal(byMember.rows.length, 0);
    assert.equal(byOwner.rows.length, 1);
  });

  test('oda kodu ve sahibi değiştirilemez', async () => {
    const db = await createTestDb();
    const melih = await signUp(db, 'melih');
    const roomId = await createRoom(db, melih, 'HT42K9');

    await assert.rejects(
      asUser(db, melih, "update public.rooms set code = 'AAAAAA' where id = $1", [roomId]),
      PERMISSION_DENIED,
    );
  });

  test('üye odadan ayrılabilir, sahip ayrılamaz', async () => {
    const db = await createTestDb();
    const melih = await signUp(db, 'melih');
    const burak = await signUp(db, 'burak');
    const roomId = await createRoom(db, melih, 'HT42K9', [burak]);

    const memberLeaves = await asUser(
      db,
      burak,
      'delete from public.room_members where room_id = $1 and user_id = $2 returning user_id',
      [roomId, burak],
    );
    const ownerLeaves = await asUser(
      db,
      melih,
      'delete from public.room_members where room_id = $1 and user_id = $2 returning user_id',
      [roomId, melih],
    );

    assert.equal(memberLeaves.rows.length, 1);
    assert.equal(ownerLeaves.rows.length, 0);
  });

  test('sahip üyeyi çıkarabilir, diğer üyeler çıkaramaz', async () => {
    const db = await createTestDb();
    const melih = await signUp(db, 'melih');
    const burak = await signUp(db, 'burak');
    const ahmet = await signUp(db, 'ahmet');
    const roomId = await createRoom(db, melih, 'HT42K9', [burak, ahmet]);

    const byMember = await asUser(
      db,
      burak,
      'delete from public.room_members where room_id = $1 and user_id = $2 returning user_id',
      [roomId, ahmet],
    );
    const byOwner = await asUser(
      db,
      melih,
      'delete from public.room_members where room_id = $1 and user_id = $2 returning user_id',
      [roomId, ahmet],
    );

    assert.equal(byMember.rows.length, 0);
    assert.equal(byOwner.rows.length, 1);
  });

  test('kullanıcı odaya kendisi doğrudan eklenemez ve aynı odaya iki kez eklenemez', async () => {
    const db = await createTestDb();
    const melih = await signUp(db, 'melih');
    const burak = await signUp(db, 'burak');
    const roomId = await createRoom(db, melih, 'HT42K9', [burak]);

    await assert.rejects(
      asUser(db, burak, 'insert into public.room_members (room_id, user_id) values ($1, $2)', [
        roomId,
        burak,
      ]),
      PERMISSION_DENIED,
    );
    await assert.rejects(
      db.query('insert into public.room_members (room_id, user_id) values ($1, $2)', [roomId, burak]),
      /room_members_pkey/,
    );
  });

  test('oda kodu 6 karakter, büyük harf ve rakam olmalı', async () => {
    const db = await createTestDb();
    const melih = await signUp(db, 'melih');

    await assert.rejects(createRoom(db, melih, 'abc123'), /rooms_code_format/);
    await assert.rejects(createRoom(db, melih, 'HT42K'), /rooms_code_format/);
  });
});

describe('puan ayarları', () => {
  test('varsayılan değerler 5/3/1 ve tabloda tek satır olabilir', async () => {
    const db = await createTestDb();
    const { rows } = await db.query(
      'select exact_points, outcome_points, goal_diff_bonus from public.scoring_config',
    );
    assert.deepEqual(rows, [{ exact_points: 5, outcome_points: 3, goal_diff_bonus: 1 }]);
    await assert.rejects(db.query('insert into public.scoring_config (id) values (2)'));
  });
});
