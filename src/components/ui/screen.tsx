import type { ReactElement, ReactNode } from 'react';
import { type RefreshControlProps, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ScreenProps = {
  children: ReactNode;
  /** Kaydırılan içeriğin altında sabit duran bölüm. */
  footer?: ReactNode;
  /** Üstte başlık çubuğu olan ekranlarda false verilir. */
  topInset?: boolean;
  /** Aşağı çekip yenileme. */
  refreshControl?: ReactElement<RefreshControlProps>;
  /** İçerik ekranın kalan yüksekliğini doldurur (örn. boş durumu ortalamak için). */
  fill?: boolean;
};

export function Screen({ children, footer, topInset = true, refreshControl, fill = false }: ScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: topInset ? insets.top : 0 }}>
      <ScrollView
        contentContainerClassName={fill ? 'grow px-5 pb-10 pt-3' : 'px-5 pb-10 pt-3'}
        showsVerticalScrollIndicator={false}
        refreshControl={refreshControl}>
        {children}
      </ScrollView>
      {footer}
    </View>
  );
}
