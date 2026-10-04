import { fireEvent, render, screen } from '@testing-library/react-native';

import { PredictionButton } from '@/features/matches/components/prediction-button';

describe('PredictionButton', () => {
  test('her durumda doğru yazıyı gösterir', async () => {
    const { rerender } = await render(<PredictionButton state="new" onPress={jest.fn()} />);
    expect(screen.getByText('Tahmini Kaydet')).toBeTruthy();

    await rerender(<PredictionButton state="dirty" onPress={jest.fn()} />);
    expect(screen.getByText('Tahmini Güncelle')).toBeTruthy();

    await rerender(<PredictionButton state="saving" onPress={jest.fn()} />);
    expect(screen.getByText('Kaydediliyor')).toBeTruthy();

    await rerender(<PredictionButton state="saved" savedTime="14:32" onPress={jest.fn()} />);
    expect(screen.getByText('Kaydedildi')).toBeTruthy();
    expect(screen.getByText('· 14:32')).toBeTruthy();

    await rerender(<PredictionButton state="error" errorText="Bağlantı yok" onPress={jest.fn()} />);
    expect(screen.getByText('Bağlantı yok · Tekrar dene')).toBeTruthy();
  });

  test('kaydedilmişken ve kaydedilirken basılamaz; diğer durumlarda basılır', async () => {
    const onPress = jest.fn();
    const { rerender } = await render(<PredictionButton state="saved" onPress={onPress} />);
    await fireEvent.press(screen.getByRole('button'));
    await rerender(<PredictionButton state="saving" onPress={onPress} />);
    await fireEvent.press(screen.getByRole('button'));
    expect(onPress).not.toHaveBeenCalled();

    await rerender(<PredictionButton state="new" onPress={onPress} />);
    await fireEvent.press(screen.getByRole('button'));
    await rerender(<PredictionButton state="error" errorText="Kaydedilemedi" onPress={onPress} />);
    await fireEvent.press(screen.getByRole('button'));
    expect(onPress).toHaveBeenCalledTimes(2);
  });
});
