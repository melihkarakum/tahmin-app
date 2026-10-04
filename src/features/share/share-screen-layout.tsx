import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { colors } from '@/constants/theme';
import { withAlpha } from '@/lib/color';

type ShareScreenLayoutProps = {
  /** Kart önizlemesi. */
  children: ReactNode;
  hint: string;
  /** Kartın vurgu rengi; önizlemenin çevresinde hafif ışık olarak görünür. */
  accent?: string;
  /** Verilirse ipucunun yerine kırmızı yazılır (düzen kaymaz). */
  error?: string | null;
  isSharing: boolean;
  canShare: boolean;
  onShareImage: () => void;
  onShareText: () => void;
};

/**
 * Paylaşma ekranlarının ortak düzeni: kart önizlemesi ve iki paylaşma düğmesi.
 * Başlık ve kapat (X) düğmesi ekranın başlık çubuğundadır (bkz. src/app/_layout.tsx).
 */
export function ShareScreenLayout({
  children,
  hint,
  accent = colors.primary,
  error,
  isSharing,
  canShare,
  onShareImage,
  onShareText,
}: ShareScreenLayoutProps) {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-background" style={{ paddingBottom: insets.bottom + 12 }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 }}>
        <View
          style={{
            borderRadius: 24,
            shadowColor: accent,
            shadowOpacity: 0.35,
            shadowRadius: 24,
            shadowOffset: { width: 0, height: 8 },
            elevation: 12,
          }}>
          <View style={{ borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: withAlpha(accent, 0.4) }}>
            {children}
          </View>
        </View>
        <Text className={error ? 'mt-5 text-center text-sm text-danger' : 'mt-5 text-center text-xs text-muted'}>
          {error ?? hint}
        </Text>
      </ScrollView>

      <View className="gap-3 px-5 pt-2">
        <Button
          label={isSharing ? 'Hazırlanıyor…' : 'Görsel Olarak Paylaş'}
          icon="share"
          onPress={onShareImage}
          disabled={!canShare || isSharing}
        />
        <Button label="Metin Olarak Paylaş" variant="secondary" onPress={onShareText} disabled={!canShare} />
      </View>
    </View>
  );
}

/** Kart önizleme genişliği: ekrana (genişlik ve yükseklik) sığacak, en fazla 320. */
export function shareCardWidth(windowWidth: number, windowHeight: number): number {
  return Math.round(Math.min(windowWidth - 48, ((windowHeight - 330) * 9) / 16, 320));
}
