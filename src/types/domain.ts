// Ekranların kullandığı veri biçimleri. Veritabanı satırları bunlara çevrilir
// (bkz. src/features/matches/queries.ts).

export type Team = {
  id: number;
  name: string;
  shortName: string;
};

export type MatchStatus = 'scheduled' | 'live' | 'finished' | 'postponed' | 'cancelled';

export type Match = {
  id: number;
  round: number;
  home: Team;
  away: Team;
  kickoffAt: string;
  status: MatchStatus;
  homeScore: number | null;
  awayScore: number | null;
  /** Geliştirme için eklenmiş deneme maçı (gerçek fikstür değil). */
  isTest: boolean;
};

export type ResultType = 'exact' | 'outcome_diff' | 'outcome' | 'miss';

export type Prediction = {
  matchId: number;
  homeGoals: number;
  awayGoals: number;
  points: number | null;
  resultType: ResultType | null;
  /** Tahminin en son kaydedildiği an (sunucu saati). */
  updatedAt: string;
};

export type LeaderboardRow = {
  userId: string;
  displayName: string;
  rank: number;
  points: number;
  exactCount: number;
  isMe?: boolean;
};

export type LeaderboardScope = 'week' | 'season';

export type Room = {
  id: string;
  name: string;
  code: string;
  memberCount: number;
  myRank: number;
  leaderName: string;
};

export type ProfileStats = {
  seasonPoints: number;
  predictionCount: number;
  exactCount: number;
  outcomeCount: number;
  accuracyPercent: number;
  lastFiveRoundsPoints: number;
};

export type HistoryItem = {
  id: string;
  home: Team;
  away: Team;
  homeScore: number;
  awayScore: number;
  predictedHome: number;
  predictedAway: number;
  points: number;
  resultType: ResultType;
  round: number;
};
