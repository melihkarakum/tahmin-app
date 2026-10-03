import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ScreenProps = {
  children: ReactNode;
  /** Kaydırılan içeriğin altında sabit duran bölüm. */
  footer?: ReactNode;
  /** Üstte başlık çubuğu olan ekranlarda false verilir. */
  topInset?: boolean;
};

export function Screen({ children, footer, topInset = true }: ScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: topInset ? insets.top : 0 }}>
      <ScrollView contentContainerClassName="px-5 pb-10 pt-3" showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
      {footer}
    </View>
  );
}
