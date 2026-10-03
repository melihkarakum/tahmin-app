// Yerel veritabanı testleri için yardımcılar. Çalıştırma: npm run test:db
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { PGlite } from '@electric-sql/pglite';

const here = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(here, '..', 'migrations');

/** Boş bir veritabanı açar, Supabase taklidini ve tüm migration dosyalarını sırayla uygular. */
export async function createTestDb() {
  const db = new PGlite();
  await db.exec(await readFile(path.join(here, 'supabase-shim.sql'), 'utf8'));

  const files = (await readdir(migrationsDir)).filter((file) => file.endsWith('.sql')).sort();
  for (const file of files) {
    await db.exec(await readFile(path.join(migrationsDir, file), 'utf8'));
  }
  return db;
}

/** Sorguyu, uygulamadan giriş yapmış bir kullanıcı gibi (authenticated rolüyle) çalıştırır. */
export async function asUser(db, userId, sql, params = []) {
  return db.transaction(async (tx) => {
    await tx.exec('set local role authenticated');
    await tx.query("select set_config('request.jwt.claims', $1, true)", [
      JSON.stringify({ sub: userId, role: 'authenticated' }),
    ]);
    return tx.query(sql, params);
  });
}

/** Sorguyu giriş yapmamış biri gibi (anon rolüyle) çalıştırır. */
export async function asAnon(db, sql, params = []) {
  return db.transaction(async (tx) => {
    await tx.exec('set local role anon');
    return tx.query(sql, params);
  });
}

/** Kayıt olmayı taklit eder: auth.users'a satır ekler, profil tetikleyiciyle oluşur. */
export async function signUp(db, username, displayName) {
  const metadata = displayName ? { username, display_name: displayName } : { username };
  const result = await db.query(
    'insert into auth.users (email, raw_user_meta_data) values ($1, $2) returning id',
    [`${username}@example.com`, JSON.stringify(metadata)],
  );
  return result.rows[0].id;
}

/** Bir lig, sezon ve iki takım oluşturur; maç eklemek için kimlikleri döner. */
export async function seedLeague(db) {
  const league = await db.query(
    "insert into public.leagues (name, country, provider, provider_id) values ('Süper Lig', 'Türkiye', 'test', '1') returning id",
  );
  const season = await db.query(
    "insert into public.seasons (league_id, name, provider_season, is_current) values ($1, '2026-27', '2026', true) returning id",
    [league.rows[0].id],
  );
  const teams = await db.query(
    "insert into public.teams (name, short_name, provider, provider_id) values ('Galatasaray', 'GS', 'test', 'gs'), ('Fenerbahçe', 'FB', 'test', 'fb') returning id",
  );
  return {
    seasonId: season.rows[0].id,
    homeTeamId: teams.rows[0].id,
    awayTeamId: teams.rows[1].id,
  };
}

let matchCounter = 0;

/** Başlama saati şu andan `minutesFromNow` dakika sonra olan bir maç ekler. */
export async function createMatch(db, seed, minutesFromNow, status = 'scheduled') {
  matchCounter += 1;
  const result = await db.query(
    `insert into public.matches
       (season_id, round, home_team_id, away_team_id, kickoff_at, status, provider, provider_id)
     values ($1, 1, $2, $3, now() + make_interval(mins => $4), $5, 'test', $6)
     returning id`,
    [seed.seasonId, seed.homeTeamId, seed.awayTeamId, minutesFromNow, status, `m${matchCounter}`],
  );
  return result.rows[0].id;
}

/** Tahmini sunucu yetkisiyle (uygulamayı atlayarak) ekler; kilit tetikleyicisi yine çalışır. */
export async function insertPrediction(db, userId, matchId, homeGoals, awayGoals) {
  return db.query(
    'insert into public.predictions (user_id, match_id, home_goals, away_goals) values ($1, $2, $3, $4) returning id',
    [userId, matchId, homeGoals, awayGoals],
  );
}

/** Bir oda oluşturur ve sahibini üye yapar (FAZ 10'daki fonksiyon gelene kadar test için). */
export async function createRoom(db, ownerId, code, memberIds = []) {
  const room = await db.query(
    "insert into public.rooms (name, code, owner_id) values ('Test Odası', $1, $2) returning id",
    [code, ownerId],
  );
  const roomId = room.rows[0].id;
  for (const userId of [ownerId, ...memberIds]) {
    await db.query('insert into public.room_members (room_id, user_id) values ($1, $2)', [
      roomId,
      userId,
    ]);
  }
  return roomId;
}
