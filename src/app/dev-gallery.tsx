import { Redirect } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { SectionTitle } from '@/components/ui/section-title';
import { MatchCardSkeleton, RowsSkeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { RankRow } from '@/features/leaderboard/components/rank-row';
import { MatchCard } from '@/features/matches/components/match-card';
import { PredictionButton } from '@/features/matches/components/prediction-button';
import { WeekCard } from '@/features/matches/components/week-card';
import { WeekPickerSheet } from '@/features/matches/components/week-picker-sheet';
import { useNow } from '@/hooks/use-now';
import {
  NotificationSettingsCard,
  PermissionNotice,
} from '@/features/notifications/components/notification-settings-card';
import { FilterChips } from '@/features/profile/components/filter-chips';
import { PredictionGrid } from '@/features/profile/components/prediction-grid';
import { ProfileHeader, ProfileHighlights } from '@/features/profile/components/profile-header';
import {
  filterCounts,
  matchesFilter,
  type PredictionFilter,
  predictionOutcome,
} from '@/features/profile/prediction-filters';
import { RoomInviteCard } from '@/features/rooms/components/room-invite-card';
import { RoomStandings } from '@/features/rooms/components/room-standings';
import {
  PredictionShareCard,
  ProfileShareCard,
  profileShareAccent,
  ShareCardFrame,
  shareAccent,
} from '@/features/share/share-card';
import { teamLogoUrl } from '@/lib/team-logo';
import type {
  HistoryItem,
  LeaderboardRow,
  LeaderboardScope,
  Match,
  Prediction,
  ProfileStats,
  Team,
} from '@/types/domain';

// YALNIZCA GELİŞTİRME: tasarımı giriş yapmadan görmek için kartların tüm durumları, örnek veriyle.
// Yayın sürümünde açılmaz (ana sayfaya yönlendirir). Adres: /dev-gallery

const HOUR = 60 * 60 * 1000;

// Örnek takımlar gerçek depodaki logoları kullanır (futbol API kimliğiyle). Kimliği olmayan
// takım, logo bulunamayınca gösterilen renkli rozeti denemek içindir.
const PROVIDER_IDS: Record<string, number> = {
  Galatasaray: 645,
  Fenerbahçe: 611,
  Antalyaspor: 1005,
  Rizespor: 1007,
  Beşiktaş: 549,
  Başakşehir: 564,
  Samsunspor: 3603,
  Göztepe: 994,
  Trabzonspor: 998,
  Konyaspor: 607,
  Kasımpaşa: 1004,
  Alanyaspor: 996,
  Eyüpspor: 3588,
  Sivasspor: 1002,
  'Adana Demirspor': 3563,
};

const team = (id: number, name: string, shortName: string): Team => {
  const providerId = PROVIDER_IDS[name];
  return {
    id,
    name,
    shortName,
    logoUrl: providerId ? teamLogoUrl(`api-football/${providerId}.png`) : null,
  };
};

function buildSamples(now: number): { match: Match; prediction?: Prediction }[] {
  const at = (hours: number) => new Date(now + hours * HOUR).toISOString();
  const match = (
    id: number,
    home: Team,
    away: Team,
    hours: number,
    status: Match['status'],
    score: [number, number] | null = null,
  ): Match => ({
    id,
    round: 8,
    home,
    away,
    kickoffAt: at(hours),
    status,
    homeScore: score ? score[0] : null,
    awayScore: score ? score[1] : null,
    isTest: id === -1,
  });
  const prediction = (
    matchId: number,
    home: number,
    away: number,
    points: number | null = null,
    resultType: Prediction['resultType'] = null,
  ): Prediction => ({
    matchId,
    homeGoals: home,
    awayGoals: away,
    points,
    resultType,
    updatedAt: at(-0.2),
  });

  return [
    { match: match(-1, team(1, 'Galatasaray', 'GAL'), team(2, 'Fenerbahçe', 'FEN'), 2.25, 'scheduled') },
    {
      match: match(-2, team(3, 'Antalyaspor', 'ANT'), team(4, 'Rizespor', 'RIZ'), 21, 'scheduled'),
      prediction: prediction(-2, 1, 0),
    },
    {
      match: match(-3, team(5, 'Beşiktaş', 'BES'), team(6, 'Başakşehir', 'IST'), -0.5, 'live'),
      prediction: prediction(-3, 2, 0),
    },
    {
      match: match(-4, team(7, 'Samsunspor', 'SAM'), team(8, 'Göztepe', 'GOZ'), -20, 'finished', [1, 1]),
      prediction: prediction(-4, 1, 1, 5, 'exact'),
    },
    {
      match: match(-5, team(9, 'Trabzonspor', 'TRA'), team(10, 'Konyaspor', 'KON'), -23, 'finished', [2, 0]),
      prediction: prediction(-5, 2, 1, 3, 'outcome'),
    },
    {
      match: match(-6, team(11, 'Kasımpaşa', 'KAS'), team(12, 'Alanyaspor', 'ALA'), -44, 'finished', [3, 1]),
      prediction: prediction(-6, 1, 2, 0, 'miss'),
    },
    { match: match(-7, team(13, 'Eyüpspor', 'EYU'), team(14, 'Sivasspor', 'SIV'), 30, 'postponed') },
    // Uzun takım adları: taşma ve kesilme kontrolü için.
    {
      match: match(-8, team(15, 'Adana Demirspor', 'ADA'), team(16, 'Fatih Karagümrük', 'KAR'), 50, 'scheduled'),
    },
  ];
}

const SAMPLE_ROUNDS = Array.from({ length: 38 }, (_, index) => index + 1);

const historyItem = (
  matchId: number,
  home: [string, string],
  away: [string, string],
  score: [number, number] | null,
  guess: [number, number],
  points: number | null,
  resultType: HistoryItem['resultType'],
): HistoryItem => ({
  matchId,
  round: 8 - Math.floor(matchId / 3),
  kickoffAt: new Date(Date.UTC(2026, 9, 3 - matchId, 17)).toISOString(),
  status: score ? 'finished' : 'scheduled',
  home: team(matchId * 2, home[0], home[1]),
  away: team(matchId * 2 + 1, away[0], away[1]),
  homeScore: score ? score[0] : null,
  awayScore: score ? score[1] : null,
  predictedHome: guess[0],
  predictedAway: guess[1],
  points,
  resultType,
  predictedAt: new Date(Date.UTC(2026, 9, 3 - matchId, 13, 42)).toISOString(),
});

const SAMPLE_HISTORY: HistoryItem[] = [
  historyItem(0, ['Gaziantep FK', 'GAZ'], ['Kayserispor', 'KAY'], null, [2, 1], null, null),
  historyItem(1, ['Samsunspor', 'SAM'], ['Göztepe', 'GOZ'], [1, 1], [1, 1], 5, 'exact'),
  historyItem(2, ['Trabzonspor', 'TRA'], ['Konyaspor', 'KON'], [2, 0], [2, 1], 3, 'outcome'),
  historyItem(3, ['Kasımpaşa', 'KAS'], ['Alanyaspor', 'ALA'], [3, 1], [1, 2], 0, 'miss'),
  historyItem(4, ['Galatasaray', 'GAL'], ['Fenerbahçe', 'FEN'], [2, 1], [1, 0], 4, 'outcome_diff'),
];

const SAMPLE_STATS: ProfileStats = {
  seasonPoints: 19,
  predictionCount: 42,
  scoredCount: 33,
  exactCount: 3,
  outcomeCount: 12,
  accuracyPercent: 36,
  lastFiveRoundsPoints: 23,
  seasonRank: 3,
  seasonTotal: 120,
};

// Oda sıralaması örnekleri: kalabalık oda (kürsü + liste), iki kişilik oda, henüz puan yok.
const ROOM_ROWS: LeaderboardRow[] = [
  { rank: 1, userId: 'r1', displayName: 'Burak', points: 23, exactCount: 3, outcomeCount: 6, scoredCount: 9 },
  { rank: 2, userId: 'r2', displayName: 'Melih', points: 19, exactCount: 2, outcomeCount: 5, scoredCount: 9, isMe: true },
  { rank: 3, userId: 'r3', displayName: 'Fatih Karagümrüklü Ahmet', points: 15, exactCount: 1, outcomeCount: 5, scoredCount: 9 },
  { rank: 4, userId: 'r4', displayName: 'Emre', points: 12, exactCount: 1, outcomeCount: 3, scoredCount: 8 },
  { rank: 5, userId: 'r5', displayName: 'Can', points: 4, exactCount: 0, outcomeCount: 1, scoredCount: 6 },
];
const ROOM_ROWS_PAIR = ROOM_ROWS.slice(0, 2);
const ROOM_ROWS_EMPTY: LeaderboardRow[] = ROOM_ROWS.slice(0, 3).map((row) => ({
  ...row,
  rank: 1,
  points: 0,
  exactCount: 0,
  outcomeCount: 0,
  scoredCount: 0,
}));
const ROOM_SAMPLES = { full: ROOM_ROWS, pair: ROOM_ROWS_PAIR, empty: ROOM_ROWS_EMPTY };

const SAMPLE_ROWS: LeaderboardRow[] = [
  { rank: 1, userId: 'a', displayName: 'Burak', points: 11, exactCount: 1 },
  { rank: 2, userId: 'b', displayName: 'Ahmet', points: 9, exactCount: 1 },
  { rank: 3, userId: 'c', displayName: 'Melih', points: 8, exactCount: 1, isMe: true },
  { rank: 4, userId: 'd', displayName: 'Emre', points: 7, exactCount: 0 },
];

export default function DevGallery() {
  const now = useNow();
  const [samples] = useState(() => buildSamples(Date.now()));
  const [round, setRound] = useState(8);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [roomScope, setRoomScope] = useState<LeaderboardScope>('week');
  const [roomSample, setRoomSample] = useState<keyof typeof ROOM_SAMPLES>('full');
  const [historyFilter, setHistoryFilter] = useState<PredictionFilter>('all');

  if (!__DEV__) return <Redirect href="/" />;

  return (
    <Screen>
      <Text className="text-sm font-semibold text-muted">Yalnızca geliştirme</Text>
      <Text className="mt-1 text-3xl font-black text-ink">Tasarım vitrini</Text>

      <View className="mt-5">
        <WeekCard
          round={round}
          dateRange="1–5 Eki"
          isCurrent={round === 8}
          canGoPrev={round > 1}
          canGoNext={round < SAMPLE_ROUNDS.length}
          onPrev={() => setRound(round - 1)}
          onNext={() => setRound(round + 1)}
          onOpenPicker={() => setPickerOpen(true)}
          points={8}
          predicted={6}
          total={9}
          rank={3}
          note="3 maç tahminini bekliyor."
        />
      </View>
      <WeekPickerSheet
        visible={pickerOpen}
        rounds={SAMPLE_ROUNDS}
        selected={round}
        current={8}
        onSelect={setRound}
        onClose={() => setPickerOpen(false)}
      />

      <View className="mt-3">
        <Button label="Panel örneği (Koda katıl)" variant="secondary" onPress={() => setSheetOpen(true)} />
      </View>
      <BottomSheet
        visible={sheetOpen}
        title="Koda katıl"
        onClose={() => setSheetOpen(false)}
        subtitle={<Text className="text-xs text-muted">Arkadaşının paylaştığı 6 karakterlik kodu gir.</Text>}>
        <TextField label="Oda kodu" placeholder="HT42K9" maxLength={6} style={{ letterSpacing: 4 }} />
        <Button label="Katıl" onPress={() => setSheetOpen(false)} style={{ marginTop: 16 }} />
      </BottomSheet>

      <SectionTitle title="Tahmin düğmesi" />
      <View className="gap-3">
        <PredictionButton state="new" onPress={() => {}} />
        <PredictionButton state="dirty" onPress={() => {}} />
        <PredictionButton state="saving" onPress={() => {}} />
        <PredictionButton state="saved" savedTime="14:32" onPress={() => {}} />
        <PredictionButton state="error" errorText="Bağlantı yok" onPress={() => {}} />
      </View>

      <SectionTitle title="Maç kartları" />
      <View className="gap-3">
        {samples.map(({ match, prediction }) => (
          <MatchCard key={match.id} match={match} prediction={prediction} now={now} />
        ))}
      </View>

      <SectionTitle title="Profil" />
      <ProfileHeader
        username="melih"
        displayName="Melih"
        seasonLabel="2026-27 sezonu"
        stats={SAMPLE_STATS}
        onOpenSettings={() => {}}
        onEditProfile={() => {}}
        onShareProfile={() => {}}
      />
      <View className="mt-5">
        <ProfileHighlights stats={SAMPLE_STATS} />
      </View>
      <Text className="mb-3 mt-8 text-xl font-bold text-ink">Skor Tahminlerim</Text>
      <FilterChips
        value={historyFilter}
        counts={filterCounts(SAMPLE_HISTORY)}
        onChange={setHistoryFilter}
      />
      <View className="mt-4">
        <PredictionGrid
          items={SAMPLE_HISTORY.filter((item) => matchesFilter(item, historyFilter))}
          onPress={() => {}}
        />
      </View>

      <SectionTitle title="Paylaşma kartları" />
      <View className="items-center gap-4">
        <View style={{ borderRadius: 24, overflow: 'hidden' }}>
          <ShareCardFrame width={300} accent={shareAccent(predictionOutcome(SAMPLE_HISTORY[1]))}>
            <PredictionShareCard item={SAMPLE_HISTORY[1]} username="melih" displayName="Melih" />
          </ShareCardFrame>
        </View>
        <View style={{ borderRadius: 24, overflow: 'hidden' }}>
          <ShareCardFrame width={300} accent={shareAccent(predictionOutcome(SAMPLE_HISTORY[0]))}>
            <PredictionShareCard item={SAMPLE_HISTORY[0]} username="melih" displayName="Melih" />
          </ShareCardFrame>
        </View>
        <View style={{ borderRadius: 24, overflow: 'hidden' }}>
          <ShareCardFrame width={300} accent={profileShareAccent(SAMPLE_STATS)}>
            <ProfileShareCard username="melih" displayName="Melih" seasonLabel="2026-27" stats={SAMPLE_STATS} />
          </ShareCardFrame>
        </View>
      </View>

      <SectionTitle title="Yükleniyor görünümü" />
      <View className="gap-3">
        <MatchCardSkeleton />
        <RowsSkeleton count={3} />
      </View>

      <SectionTitle title="Oda ekranı" />
      <RoomInviteCard
        code="HT42K9"
        expanded={inviteOpen}
        onToggle={() => setInviteOpen(!inviteOpen)}
        onWhatsApp={() => {}}
        onShare={() => {}}
      />
      <View className="mt-3 flex-row gap-2">
        {(Object.keys(ROOM_SAMPLES) as (keyof typeof ROOM_SAMPLES)[]).map((key) => (
          <Button
            key={key}
            label={key}
            variant={roomSample === key ? 'primary' : 'secondary'}
            onPress={() => setRoomSample(key)}
            style={{ flex: 1 }}
          />
        ))}
      </View>
      <View className="mt-6">
        <RoomStandings
          rows={ROOM_SAMPLES[roomSample]}
          scope={roomScope}
          onScopeChange={setRoomScope}
          context={roomScope === 'week' ? '8. hafta' : '2026-27 sezonu'}
          isLoading={false}
          hasError={false}
          onRetry={() => {}}
          onMemberPress={() => {}}
        />
      </View>

      <SectionTitle title="Bildirimler" />
      <NotificationSettingsCard />
      <View className="mt-3 overflow-hidden rounded-3xl border border-border bg-surface">
        <PermissionNotice status="undetermined" onEnable={() => {}} isEnabling={false} failed />
        <PermissionNotice status="denied" onEnable={() => {}} isEnabling={false} failed={false} />
      </View>

      <SectionTitle title="Sıralama satırları" />
      <View className="overflow-hidden rounded-3xl border border-border bg-surface">
        {SAMPLE_ROWS.map((row, index) => (
          <RankRow key={row.userId} row={row} isLast={index === SAMPLE_ROWS.length - 1} />
        ))}
      </View>
    </Screen>
  );
}
