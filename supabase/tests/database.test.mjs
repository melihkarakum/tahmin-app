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

describe('tahmin kaydetme (save_prediction)', () => {
  const save = (db, userId, matchId, home, away) =>
    asUser(
      db,
      userId,
      'select id, user_id, home_goals, away_goals, points from public.save_prediction($1, $2, $3)',
      [matchId, home, away],
    );

  test('kullanıcı tahmin kaydeder ve maç başlamadan günceller; satır hep kendisine aittir', async () => {
    const db = await createTestDb();
    const seed = await seedLeague(db);
    const melih = await signUp(db, 'melih');
    const matchId = await createMatch(db, seed, 60);

    const first = await save(db, melih, matchId, 2, 1);
    const second = await save(db, melih, matchId, 3, 1);

    assert.equal(first.rows[0].user_id, melih);
    assert.equal(second.rows[0].id, first.rows[0].id);
    assert.equal(second.rows[0].home_goals, 3);
    assert.equal(second.rows[0].points, null);
    const { rows } = await db.query('select count(*)::int as count from public.predictions');
    assert.equal(rows[0].count, 1);
  });

  test('maç başladıktan sonra kaydedemez', async () => {
    const db = await createTestDb();
    const seed = await seedLeague(db);
    const melih = await signUp(db, 'melih');
    const started = await createMatch(db, seed, -1);

    await assert.rejects(save(db, melih, started, 1, 0), WINDOW_CLOSED);
  });

  test('banlı kullanıcı ve giriş yapmamış biri kaydedemez', async () => {
    const db = await createTestDb();
    const seed = await seedLeague(db);
    const melih = await signUp(db, 'melih');
    const matchId = await createMatch(db, seed, 60);
    await db.query('update public.profiles set is_banned = true where id = $1', [melih]);

    await assert.rejects(save(db, melih, matchId, 1, 0), /tahmin yapılamaz/);
    await assert.rejects(
      asAnon(db, 'select * from public.save_prediction($1, 1, 0)', [matchId]),
      PERMISSION_DENIED,
    );
  });

  test('geçersiz skor reddedilir', async () => {
    const db = await createTestDb();
    const seed = await seedLeague(db);
    const melih = await signUp(db, 'melih');
    const matchId = await createMatch(db, seed, 60);

    await assert.rejects(save(db, melih, matchId, 25, 0), /predictions_goals_range/);
  });
});

describe('güncel hafta (current_round)', () => {
  const currentRound = async (db, userId) =>
    (await asUser(db, userId, 'select season_name, round from public.current_round()')).rows;

  const matchInRound = async (db, seed, round, minutesFromNow, status = 'scheduled') => {
    const id = await createMatch(db, seed, minutesFromNow, status);
    await db.query('update public.matches set round = $1 where id = $2', [round, id]);
    return id;
  };

  test('oynanan maç varsa onun haftası, yoksa sıradaki maçın haftası', async () => {
    const db = await createTestDb();
    const seed = await seedLeague(db);
    const melih = await signUp(db, 'melih');
    await matchInRound(db, seed, 7, -2000, 'scheduled');
    await matchInRound(db, seed, 8, 120);
    await matchInRound(db, seed, 9, 5000);

    assert.deepEqual(await currentRound(db, melih), [{ season_name: '2026-27', round: 8 }]);

    await matchInRound(db, seed, 7, -30, 'live');
    assert.equal((await currentRound(db, melih))[0].round, 7);
  });

  test('ertelenen maç haftayı geride bırakmaz; hiç gelecek maç yoksa son hafta', async () => {
    const db = await createTestDb();
    const seed = await seedLeague(db);
    const melih = await signUp(db, 'melih');
    await matchInRound(db, seed, 5, 60, 'postponed');
    const nextId = await matchInRound(db, seed, 9, 120);

    assert.equal((await currentRound(db, melih))[0].round, 9);

    await db.query(
      "update public.matches set status = 'finished', home_score = 1, away_score = 0, kickoff_at = now() - interval '1 day' where id = $1",
      [nextId],
    );
    assert.equal((await currentRound(db, melih))[0].round, 9);
  });

  test('güncel sezon yoksa sonuç boş döner', async () => {
    const db = await createTestDb();
    const melih = await signUp(db, 'melih');
    assert.deepEqual(await currentRound(db, melih), []);
  });
});

describe('puan hesabı (calculate_points)', () => {
  const cases = [
    // [tahmin ev, tahmin dep, gerçek ev, gerçek dep, puan, sonuç] — örnekler PRD'den
    [2, 1, 2, 1, 5, 'exact'],
    [3, 2, 2, 1, 4, 'outcome_diff'],
    [3, 1, 2, 1, 3, 'outcome'],
    [1, 1, 2, 1, 0, 'miss'],
    [0, 2, 2, 1, 0, 'miss'],
    [1, 1, 2, 2, 4, 'outcome_diff'],
    [0, 0, 0, 0, 5, 'exact'],
    [0, 1, 1, 3, 3, 'outcome'],
    [1, 3, 0, 2, 4, 'outcome_diff'],
    [2, 0, 0, 0, 0, 'miss'],
  ];

  test('tüm örneklerde doğru puan ve sonuç türü', async () => {
    const db = await createTestDb();
    for (const [ph, pa, h, a, points, resultType] of cases) {
      const { rows } = await db.query(
        'select points, result_type from public.calculate_points($1, $2, $3, $4)',
        [ph, pa, h, a],
      );
      assert.deepEqual(rows[0], { points, result_type: resultType }, `${ph}-${pa} / ${h}-${a}`);
    }
  });

  test('puan değerleri ayardan gelir', async () => {
    const db = await createTestDb();
    const { rows } = await db.query(
      'select points from public.calculate_points(2, 1, 2, 1, 10, 4, 2) union all select points from public.calculate_points(3, 2, 2, 1, 10, 4, 2)',
    );
    assert.deepEqual(
      rows.map((row) => row.points),
      [10, 6],
    );
  });
});

describe('otomatik puanlama', () => {
  const finish = (db, matchId, home, away) =>
    db.query(
      "update public.matches set kickoff_at = now() - interval '2 hours', status = 'finished', home_score = $2, away_score = $3 where id = $1",
      [matchId, home, away],
    );

  const pointsOf = async (db, matchId) =>
    (
      await db.query(
        'select u.username, p.points, p.result_type from public.predictions p join public.profiles u on u.id = p.user_id where p.match_id = $1 order by u.username',
        [matchId],
      )
    ).rows;

  test('maç bitince tüm tahminler puanlanır', async () => {
    const db = await createTestDb();
    const seed = await seedLeague(db);
    const ali = await signUp(db, 'ali');
    const burak = await signUp(db, 'burak');
    const can = await signUp(db, 'can');
    const matchId = await createMatch(db, seed, 60);
    await insertPrediction(db, ali, matchId, 2, 1);
    await insertPrediction(db, burak, matchId, 3, 2);
    await insertPrediction(db, can, matchId, 0, 0);

    await finish(db, matchId, 2, 1);

    assert.deepEqual(await pointsOf(db, matchId), [
      { username: 'ali', points: 5, result_type: 'exact' },
      { username: 'burak', points: 4, result_type: 'outcome_diff' },
      { username: 'can', points: 0, result_type: 'miss' },
    ]);
    const { rows } = await db.query('select scored_at is not null as scored from public.matches where id = $1', [
      matchId,
    ]);
    assert.equal(rows[0].scored, true);
  });

  test('skor düzeltilince puanlar yeniden hesaplanır, çift puan oluşmaz', async () => {
    const db = await createTestDb();
    const seed = await seedLeague(db);
    const ali = await signUp(db, 'ali');
    const matchId = await createMatch(db, seed, 60);
    await insertPrediction(db, ali, matchId, 2, 1);

    await finish(db, matchId, 2, 0);
    assert.equal((await pointsOf(db, matchId))[0].points, 3);

    await db.query('update public.matches set away_score = 1 where id = $1', [matchId]);
    assert.equal((await pointsOf(db, matchId))[0].points, 5);

    await db.query('update public.matches set away_score = 1 where id = $1', [matchId]);
    const { rows } = await db.query('select count(*)::int as count from public.predictions');
    assert.equal(rows[0].count, 1);
    assert.equal((await pointsOf(db, matchId))[0].points, 5);
  });

  test('biten maç sonradan iptal sayılırsa puanlar geri alınır', async () => {
    const db = await createTestDb();
    const seed = await seedLeague(db);
    const ali = await signUp(db, 'ali');
    const matchId = await createMatch(db, seed, 60);
    await insertPrediction(db, ali, matchId, 1, 0);
    await finish(db, matchId, 1, 0);

    await db.query(
      "update public.matches set status = 'cancelled', home_score = null, away_score = null where id = $1",
      [matchId],
    );

    assert.deepEqual(await pointsOf(db, matchId), [
      { username: 'ali', points: null, result_type: null },
    ]);
  });

  test('sonucu değiştirmeyen güncelleme (günlük senkron) puanları bozmaz', async () => {
    const db = await createTestDb();
    const seed = await seedLeague(db);
    const ali = await signUp(db, 'ali');
    const matchId = await createMatch(db, seed, 60);
    await insertPrediction(db, ali, matchId, 1, 1);
    await finish(db, matchId, 2, 2);

    await db.query(
      "update public.matches set status = 'finished', home_score = 2, away_score = 2, kickoff_at = kickoff_at where id = $1",
      [matchId],
    );

    assert.deepEqual(await pointsOf(db, matchId), [
      { username: 'ali', points: 4, result_type: 'outcome_diff' },
    ]);
  });

  test('puan ayarı değişince yalnızca sonradan puanlanan maçlar etkilenir', async () => {
    const db = await createTestDb();
    const seed = await seedLeague(db);
    const ali = await signUp(db, 'ali');
    const first = await createMatch(db, seed, 60);
    const second = await createMatch(db, seed, 90);
    await insertPrediction(db, ali, first, 2, 1);
    await insertPrediction(db, ali, second, 2, 1);

    await finish(db, first, 2, 1);
    await db.query('update public.scoring_config set exact_points = 10');
    await finish(db, second, 2, 1);

    assert.equal((await pointsOf(db, first))[0].points, 5);
    assert.equal((await pointsOf(db, second))[0].points, 10);
  });

  test('kullanıcı puanlamayı kendisi tetikleyemez', async () => {
    const db = await createTestDb();
    const seed = await seedLeague(db);
    const ali = await signUp(db, 'ali');
    const matchId = await createMatch(db, seed, 60);

    await assert.rejects(
      asUser(db, ali, 'select public.score_match($1)', [matchId]),
      PERMISSION_DENIED,
    );
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
