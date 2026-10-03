// GEÇİCİ: Supabase bağlanana kadar ekranların gösterdiği örnek veri.
// Takımlar, maçlar, skorlar ve kullanıcılar gerçek değildir. FAZ 7-12'de gerçek sorgularla değişecek.

import type {
  HistoryItem,
  LeaderboardRow,
  LeaderboardScope,
  Match,
  Prediction,
  ProfileStats,
  Room,
  Team,
} from '@/types/domain';

const MINUTE = 60 * 1000;
const loadedAt = Date.now();

// Maç saatleri uygulamanın açıldığı güne göre hesaplanır; böylece her an tüm kart durumları görünür.
function dayAt(dayOffset: number, hour: number, minute = 0): string {
  const date = new Date(loadedAt);
  date.setDate(date.getDate() + dayOffset);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

// Şu an oynanan maç: en az 20 dakika önceki son yarım saat başında başlamış sayılır.
const liveKickoff = new Date(
  Math.floor((loadedAt - 20 * MINUTE) / (30 * MINUTE)) * 30 * MINUTE,
).toISOString();

const team = (id: string, name: string, shortName: string): Team => ({ id, name, shortName });

const teams = {
  gs: team('gs', 'Galatasaray', 'GS'),
  fb: team('fb', 'Fenerbahçe', 'FB'),
  bjk: team('bjk', 'Beşiktaş', 'BJK'),
  ts: team('ts', 'Trabzonspor', 'TS'),
  ibfk: team('ibfk', 'Başakşehir', 'İBFK'),
  sam: team('sam', 'Samsunspor', 'SAM'),
  goz: team('goz', 'Göztepe', 'GÖZ'),
  kon: team('kon', 'Konyaspor', 'KON'),
  kas: team('kas', 'Kasımpaşa', 'KAS'),
  aln: team('aln', 'Alanyaspor', 'ALN'),
  ant: team('ant', 'Antalyaspor', 'ANT'),
  riz: team('riz', 'Rizespor', 'RİZ'),
  gfk: team('gfk', 'Gaziantep FK', 'GFK'),
  kay: team('kay', 'Kayserispor', 'KAY'),
  eyp: team('eyp', 'Eyüpspor', 'EYP'),
  koc: team('koc', 'Kocaelispor', 'KOC'),
  gen: team('gen', 'Gençlerbirliği', 'GEN'),
  krg: team('krg', 'Karagümrük', 'KRG'),
};

export const currentRound = 8;

export const matches: Match[] = [
  {
    id: 'm1',
    round: 8,
    home: teams.ts,
    away: teams.kon,
    kickoffAt: dayAt(-1, 17),
    status: 'finished',
    homeScore: 2,
    awayScore: 0,
  },
  {
    id: 'm2',
    round: 8,
    home: teams.sam,
    away: teams.goz,
    kickoffAt: dayAt(-1, 20),
    status: 'finished',
    homeScore: 1,
    awayScore: 1,
  },
  {
    id: 'm3',
    round: 8,
    home: teams.kas,
    away: teams.aln,
    kickoffAt: dayAt(-2, 20),
    status: 'finished',
    homeScore: 3,
    awayScore: 1,
  },
  {
    id: 'm4',
    round: 8,
    home: teams.bjk,
    away: teams.ibfk,
    kickoffAt: liveKickoff,
    status: 'live',
    homeScore: null,
    awayScore: null,
  },
  {
    id: 'm5',
    round: 8,
    home: teams.gs,
    away: teams.fb,
    kickoffAt: dayAt(1, 20),
    status: 'scheduled',
    homeScore: null,
    awayScore: null,
  },
  {
    id: 'm6',
    round: 8,
    home: teams.ant,
    away: teams.riz,
    kickoffAt: dayAt(1, 17),
    status: 'scheduled',
    homeScore: null,
    awayScore: null,
  },
  {
    id: 'm7',
    round: 8,
    home: teams.gfk,
    away: teams.kay,
    kickoffAt: dayAt(2, 17),
    status: 'scheduled',
    homeScore: null,
    awayScore: null,
  },
  {
    id: 'm8',
    round: 8,
    home: teams.eyp,
    away: teams.koc,
    kickoffAt: dayAt(2, 20),
    status: 'scheduled',
    homeScore: null,
    awayScore: null,
  },
  {
    id: 'm9',
    round: 8,
    home: teams.gen,
    away: teams.krg,
    kickoffAt: dayAt(3, 19),
    status: 'scheduled',
    homeScore: null,
    awayScore: null,
  },
];

export const initialPredictions: Prediction[] = [
  { matchId: 'm1', homeGoals: 2, awayGoals: 1, points: 3, resultType: 'outcome' },
  { matchId: 'm2', homeGoals: 1, awayGoals: 1, points: 5, resultType: 'exact' },
  { matchId: 'm3', homeGoals: 1, awayGoals: 2, points: 0, resultType: 'miss' },
  { matchId: 'm4', homeGoals: 2, awayGoals: 0, points: null, resultType: null },
  { matchId: 'm5', homeGoals: 2, awayGoals: 1, points: null, resultType: null },
  { matchId: 'm6', homeGoals: 1, awayGoals: 0, points: null, resultType: null },
];

export const rooms: Room[] = [
  { id: 'halisaha', name: 'Halısaha Tayfa', code: 'HT42K9', memberCount: 8, myRank: 3, leaderName: 'Burak' },
  { id: 'ofis', name: 'Ofis Ligi', code: 'OF7Q2M', memberCount: 14, myRank: 5, leaderName: 'Selin' },
  { id: 'kuzenler', name: 'Kuzenler', code: 'KZ9P4T', memberCount: 5, myRank: 1, leaderName: 'Melih' },
];

const row = (
  rank: number,
  userId: string,
  displayName: string,
  points: number,
  exactCount: number,
): LeaderboardRow => ({ rank, userId, displayName, points, exactCount, isMe: userId === 'melih' });

const roomLeaderboards: Record<LeaderboardScope, LeaderboardRow[]> = {
  week: [
    row(1, 'burak', 'Burak', 11, 1),
    row(2, 'ahmet', 'Ahmet', 9, 1),
    row(3, 'melih', 'Melih', 8, 1),
    row(4, 'emre', 'Emre', 7, 0),
    row(5, 'can', 'Can', 6, 0),
    row(6, 'deniz', 'Deniz', 4, 0),
    row(7, 'kerem', 'Kerem', 3, 0),
    row(8, 'onur', 'Onur', 0, 0),
  ],
  season: [
    row(1, 'burak', 'Burak', 131, 11),
    row(2, 'melih', 'Melih', 124, 9),
    row(3, 'ahmet', 'Ahmet', 119, 10),
    row(4, 'emre', 'Emre', 104, 7),
    row(5, 'deniz', 'Deniz', 98, 6),
    row(6, 'can', 'Can', 91, 5),
    row(7, 'onur', 'Onur', 77, 4),
    row(8, 'kerem', 'Kerem', 62, 3),
  ],
};

export function getRoomLeaderboard(scope: LeaderboardScope): LeaderboardRow[] {
  return roomLeaderboards[scope];
}

const nationalLeaderboards: Record<LeaderboardScope, LeaderboardRow[]> = {
  week: [
    row(1, 'u1', 'Kaleci61', 14, 2),
    row(2, 'u2', 'SerdarK', 13, 1),
    row(3, 'u3', 'ZeynepG', 13, 1),
    row(4, 'u4', 'Bordo53', 12, 1),
    row(5, 'u5', 'OnBirinciAdam', 12, 1),
    row(6, 'u6', 'Tribün35', 12, 0),
    row(7, 'u7', 'ElifNaz', 11, 1),
    row(8, 'burak', 'Burak', 11, 1),
    row(9, 'u9', 'Santrafor', 11, 0),
    row(10, 'u10', 'MertCan', 10, 1),
  ],
  season: [
    row(1, 'u3', 'ZeynepG', 168, 16),
    row(2, 'u1', 'Kaleci61', 165, 15),
    row(3, 'u5', 'OnBirinciAdam', 161, 14),
    row(4, 'u11', 'AnkaraGücü06', 158, 15),
    row(5, 'u2', 'SerdarK', 157, 13),
    row(6, 'u12', 'DenizliHoroz', 155, 14),
    row(7, 'u9', 'Santrafor', 154, 12),
    row(8, 'u7', 'ElifNaz', 152, 13),
    row(9, 'u13', 'Yedek Kulübesi', 151, 12),
    row(10, 'u4', 'Bordo53', 150, 13),
  ],
};

const myNationalRows: Record<LeaderboardScope, LeaderboardRow> = {
  week: row(2114, 'melih', 'Melih', 8, 1),
  season: row(1842, 'melih', 'Melih', 124, 9),
};

export function getNationalLeaderboard(scope: LeaderboardScope) {
  return { top: nationalLeaderboards[scope], me: myNationalRows[scope] };
}

export const profileStats: ProfileStats = {
  displayName: 'Melih',
  username: 'melih',
  seasonPoints: 124,
  predictionCount: 67,
  exactCount: 9,
  outcomeCount: 31,
  accuracyPercent: 48,
  lastFiveRoundsPoints: 74,
};

export const history: HistoryItem[] = [
  {
    id: 'h1',
    home: teams.kas,
    away: teams.aln,
    homeScore: 3,
    awayScore: 1,
    predictedHome: 1,
    predictedAway: 2,
    points: 0,
    resultType: 'miss',
    round: 8,
  },
  {
    id: 'h2',
    home: teams.sam,
    away: teams.goz,
    homeScore: 1,
    awayScore: 1,
    predictedHome: 1,
    predictedAway: 1,
    points: 5,
    resultType: 'exact',
    round: 8,
  },
  {
    id: 'h3',
    home: teams.ts,
    away: teams.kon,
    homeScore: 2,
    awayScore: 0,
    predictedHome: 2,
    predictedAway: 1,
    points: 3,
    resultType: 'outcome',
    round: 8,
  },
  {
    id: 'h4',
    home: teams.fb,
    away: teams.bjk,
    homeScore: 2,
    awayScore: 1,
    predictedHome: 3,
    predictedAway: 2,
    points: 4,
    resultType: 'outcome_diff',
    round: 7,
  },
  {
    id: 'h5',
    home: teams.gs,
    away: teams.ts,
    homeScore: 3,
    awayScore: 0,
    predictedHome: 2,
    predictedAway: 0,
    points: 3,
    resultType: 'outcome',
    round: 7,
  },
];
