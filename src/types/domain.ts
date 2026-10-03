// Uygulamanın kullandığı veri biçimleri. FAZ 4'te veritabanı tablolarıyla eşlenecek.

export type Team = {
  id: string;
  name: string;
  shortName: string;
};

export type MatchStatus = 'scheduled' | 'live' | 'finished' | 'postponed';

export type Match = {
  id: string;
  round: number;
  home: Team;
  away: Team;
  kickoffAt: string;
  status: MatchStatus;
  homeScore: number | null;
  awayScore: number | null;
};

export type ResultType = 'exact' | 'outcome_diff' | 'outcome' | 'miss';

export type Prediction = {
  matchId: string;
  homeGoals: number;
  awayGoals: number;
  points: number | null;
  resultType: ResultType | null;
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
  displayName: string;
  username: string;
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
