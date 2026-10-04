// Ekranların kullandığı veri biçimleri. Veritabanı satırları bunlara çevrilir
// (bkz. src/features/matches/queries.ts).

export type Team = {
  id: number;
  name: string;
  shortName: string;
  /** Logo adresi; yoksa ya da yüklenemezse kulüp renklerinde rozet gösterilir. */
  logoUrl?: string | null;
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
  /** Sonucu (galibiyet/beraberlik/mağlubiyet) doğru bilinen maçlar; tam skorlar dahil. */
  outcomeCount?: number;
  /** Puanlanmış tahmin sayısı (maçı bitmiş tahminler). */
  scoredCount?: number;
  isMe?: boolean;
};

export type LeaderboardScope = 'week' | 'season';

export type ProfileStats = {
  seasonPoints: number;
  /** Bu sezon yapılan tüm tahminler (henüz oynanmamış maçlar dahil). */
  predictionCount: number;
  /** Puanlanmış (maçı bitmiş) tahmin sayısı. */
  scoredCount: number;
  exactCount: number;
  /** Doğru sonuç sayısı (tam skorlar dahil). */
  outcomeCount: number;
  /** Puanlanmış tahminlerde doğru sonuç oranı; henüz puanlanan yoksa null. */
  accuracyPercent: number | null;
  lastFiveRoundsPoints: number;
  /** Türkiye sezon sırası; henüz sıralamada değilse null. */
  seasonRank: number | null;
  seasonTotal: number | null;
};

export type HistoryItem = {
  matchId: number;
  round: number;
  kickoffAt: string;
  status: MatchStatus;
  home: Team;
  away: Team;
  homeScore: number | null;
  awayScore: number | null;
  predictedHome: number;
  predictedAway: number;
  points: number | null;
  resultType: ResultType | null;
  /** Tahminin en son kaydedildiği an (sunucu saati). */
  predictedAt: string;
};
