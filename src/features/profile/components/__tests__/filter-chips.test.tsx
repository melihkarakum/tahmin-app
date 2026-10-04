import { fireEvent, render, screen } from '@testing-library/react-native';

import { FilterChips } from '@/features/profile/components/filter-chips';

const counts = { all: 6, correct: 3, exact: 1, miss: 2, pending: 1 };

describe('FilterChips', () => {
  test('her süzgecin yanında sayısı yazar', async () => {
    await render(<FilterChips value="all" counts={counts} onChange={jest.fn()} />);
    expect(screen.getByLabelText('Tümü, 6 tahmin')).toBeTruthy();
    expect(screen.getByLabelText('Doğru, 3 tahmin')).toBeTruthy();
    expect(screen.getByLabelText('Yanlış, 2 tahmin')).toBeTruthy();
  });

  test('başka süzgece dokununca değişir; seçili olana dokununca bir şey olmaz', async () => {
    const onChange = jest.fn();
    await render(<FilterChips value="all" counts={counts} onChange={onChange} />);
    await fireEvent.press(screen.getByLabelText('Doğru, 3 tahmin'));
    await fireEvent.press(screen.getByLabelText('Tümü, 6 tahmin'));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('correct');
  });
});
