import { fireEvent, render, screen } from '@testing-library/react-native';

import { RoomStandings } from '@/features/rooms/components/room-standings';
import type { LeaderboardRow } from '@/types/domain';

const row = (rank: number, userId: string, displayName: string, points: number, extra: Partial<LeaderboardRow> = {}) => ({
  rank,
  userId,
  displayName,
  points,
  exactCount: 0,
  outcomeCount: 0,
  scoredCount: points > 0 ? 3 : 0,
  ...extra,
});

const baseProps = {
  scope: 'week' as const,
  onScopeChange: jest.fn(),
  isLoading: false,
  hasError: false,
  onRetry: jest.fn(),
};

describe('RoomStandings', () => {
  test('puan alan varsa ilk üç kürsüde, kalanlar listede', async () => {
    const rows = [
      row(1, 'a', 'Burak', 23),
      row(2, 'b', 'Melih', 19, { isMe: true }),
      row(3, 'c', 'Ahmet', 15),
      row(4, 'd', 'Emre', 12, { exactCount: 1, outcomeCount: 3 }),
    ];
    await render(<RoomStandings {...baseProps} rows={rows} />);
    expect(screen.getByLabelText('1. Burak, 23 puan')).toBeTruthy();
    expect(screen.getByText('SEN')).toBeTruthy();
    expect(screen.getByText('1 tam skor · 3 doğru sonuç')).toBeTruthy();
    expect(screen.queryByText('Henüz puan yok')).toBeNull();
  });

  test('kimse puan almadıysa "Henüz puan yok" ve sırasız üye listesi', async () => {
    const rows = [row(1, 'a', 'Burak', 0), row(1, 'b', 'Melih', 0, { isMe: true })];
    await render(<RoomStandings {...baseProps} scope="season" rows={rows} />);
    expect(screen.getByText('Henüz puan yok')).toBeTruthy();
    expect(screen.getByText('Melih (sen)')).toBeTruthy();
    expect(screen.getAllByText('Puanlanan tahmini yok')).toHaveLength(2);
  });

  test('oda sahibi başka üyeye dokununca seçenekler açılır; kendine dokununca açılmaz', async () => {
    const onMemberPress = jest.fn();
    const rows = [row(1, 'a', 'Burak', 0), row(1, 'b', 'Melih', 0, { isMe: true })];
    await render(<RoomStandings {...baseProps} rows={rows} onMemberPress={onMemberPress} />);
    await fireEvent.press(screen.getByLabelText('Burak seçenekleri'));
    expect(onMemberPress).toHaveBeenCalledWith(expect.objectContaining({ userId: 'a' }));
    expect(screen.queryByLabelText('Melih seçenekleri')).toBeNull();
  });
});
