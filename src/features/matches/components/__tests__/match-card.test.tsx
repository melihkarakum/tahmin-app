import { fireEvent, render, screen } from '@testing-library/react-native';

import { MatchCard } from '@/features/matches/components/match-card';
import type { Match, Prediction } from '@/types/domain';

const mockMutate = jest.fn();
const mockSaveState = { isPending: false };

jest.mock('@/features/matches/queries', () => ({
  useSavePrediction: () => ({ mutate: mockMutate, isPending: mockSaveState.isPending }),
  toPredictionShortMessage: () => 'Kaydedilemedi',
}));
jest.mock('@/features/notifications/push', () => ({ maybeOfferPush: jest.fn() }));

const NOW = Date.parse('2026-10-04T12:00:00Z');
const HOUR = 60 * 60 * 1000;

function match(overrides: Partial<Match> = {}): Match {
  return {
    id: 7,
    round: 8,
    kickoffAt: new Date(NOW + 2 * HOUR).toISOString(),
    status: 'scheduled',
    homeScore: null,
    awayScore: null,
    isTest: false,
    home: { id: 1, name: 'Galatasaray', shortName: 'GAL' },
    away: { id: 2, name: 'Fenerbahçe', shortName: 'FEN' },
    ...overrides,
  };
}

const saved: Prediction = {
  matchId: 7,
  homeGoals: 2,
  awayGoals: 1,
  points: null,
  resultType: null,
  updatedAt: '2026-10-04T10:15:00Z',
};

beforeEach(() => {
  mockMutate.mockReset();
  mockSaveState.isPending = false;
});

describe('MatchCard (açık maç)', () => {
  test('tahmin yoksa skoru artırıp kaydeder', async () => {
    await render(<MatchCard match={match()} now={NOW} />);
    expect(screen.getByText('Tahmini Kaydet')).toBeTruthy();

    await fireEvent.press(screen.getByLabelText('Galatasaray golünü artır'));
    await fireEvent.press(screen.getByLabelText('Galatasaray golünü artır'));
    await fireEvent.press(screen.getByLabelText('Fenerbahçe golünü artır'));
    await fireEvent.press(screen.getByText('Tahmini Kaydet'));

    expect(mockMutate).toHaveBeenCalledWith({ matchId: 7, homeGoals: 2, awayGoals: 1 }, expect.anything());
  });

  test('kayıtlı tahminle aynıysa "Kaydedildi"; skor değişince "Tahmini Güncelle" olur', async () => {
    await render(<MatchCard match={match()} prediction={saved} now={NOW} />);
    expect(screen.getByText('Kaydedildi')).toBeTruthy();

    await fireEvent.press(screen.getByLabelText('Fenerbahçe golünü artır'));
    expect(screen.getByText('Tahmini Güncelle')).toBeTruthy();

    await fireEvent.press(screen.getByLabelText('Fenerbahçe golünü azalt'));
    expect(screen.getByText('Kaydedildi')).toBeTruthy();
  });

  test('gol sayısı 0\'ın altına inmez', async () => {
    await render(<MatchCard match={match()} now={NOW} />);
    await fireEvent.press(screen.getByLabelText('Galatasaray golünü azalt'));
    await fireEvent.press(screen.getByText('Tahmini Kaydet'));
    expect(mockMutate).toHaveBeenCalledWith({ matchId: 7, homeGoals: 0, awayGoals: 0 }, expect.anything());
  });

  test('kaydedilirken düğme "Kaydediliyor" der ve tekrar basılamaz', async () => {
    mockSaveState.isPending = true;
    await render(<MatchCard match={match()} now={NOW} />);
    expect(screen.getByText('Kaydediliyor')).toBeTruthy();
    await fireEvent.press(screen.getByText('Kaydediliyor'));
    expect(mockMutate).not.toHaveBeenCalled();
  });
});

describe('MatchCard (kapanmış maç)', () => {
  test('başlamış maçta skor paneli yok, "Kilitlendi" yazar', async () => {
    await render(
      <MatchCard match={match({ kickoffAt: new Date(NOW - HOUR).toISOString(), status: 'live' })} prediction={saved} now={NOW} />,
    );
    expect(screen.getByText('Kilitlendi')).toBeTruthy();
    expect(screen.queryByText('Tahmini Kaydet')).toBeNull();
    expect(screen.queryByLabelText('Galatasaray golünü artır')).toBeNull();
  });

  test('bitmiş maçta kazanılan puan görünür', async () => {
    await render(
      <MatchCard
        match={match({
          kickoffAt: new Date(NOW - 3 * HOUR).toISOString(),
          status: 'finished',
          homeScore: 2,
          awayScore: 1,
        })}
        prediction={{ ...saved, points: 5, resultType: 'exact' }}
        now={NOW}
      />,
    );
    expect(screen.getByText('+5 puan')).toBeTruthy();
  });
});
