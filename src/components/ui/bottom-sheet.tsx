import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/ui/icon';
import { PressableOpacity } from '@/components/ui/pressable-opacity';
import { Text } from '@/components/ui/text';
import { colors, overlayColor } from '@/constants/theme';
import { useKeyboardVisible } from '@/hooks/use-keyboard-visible';

type BottomSheetProps = {
  visible: boolean;
  title: string;
  /** Başlığın altındaki küçük açıklama. */
  subtitle?: ReactNode;
  onClose: () => void;
  /** Panel ekrana tamamen yerleştikten sonra çağrılır (örneğin yazı alanına odaklanmak için). */
  onShow?: () => void;
  /** Panel tamamen kapandıktan sonra çağrılır (iOS). Sayfa geçişi burada yapılmalı. */
  onDismiss?: () => void;
  children: ReactNode;
};

/**
 * Alttan açılan panel.
 * Açılış basit bir solma animasyonudur; klavye, panel yerleştikten sonra (onShow) açılmalıdır.
 * Panel kayarken klavyenin de aynı anda açılması iOS'ta zıplamaya yol açıyordu.
 */
export function BottomSheet({
  visible,
  title,
  subtitle,
  onClose,
  onShow,
  onDismiss,
  children,
}: BottomSheetProps) {
  const insets = useSafeAreaInsets();
  const keyboardVisible = useKeyboardVisible();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onShow={onShow}
      onDismiss={onDismiss}
      onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: overlayColor }}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Kapat" />

        <View
          className="rounded-t-3xl border-t border-border bg-surface pt-3"
          style={{
            paddingHorizontal: 20,
            // Klavye açıkken alttaki güvenli alan boşluğu gereksiz; panel klavyeye yaslanır.
            paddingBottom: keyboardVisible ? 16 : insets.bottom + 20,
          }}>
          <View className="items-center">
            <View className="h-1 w-10 rounded-full bg-border" />
          </View>

          <View className="mt-4 flex-row items-start justify-between">
            <View className="flex-1 pr-4">
              <Text className="text-lg font-extrabold text-ink">{title}</Text>
              {subtitle ? <View className="mt-1">{subtitle}</View> : null}
            </View>
            <PressableOpacity onPress={onClose} hitSlop={8} accessibilityLabel="Kapat">
              <View className="h-9 w-9 items-center justify-center rounded-full bg-surface-muted">
                <Icon name="close" size={13} color={colors.ink} />
              </View>
            </PressableOpacity>
          </View>

          <View className="mt-5">{children}</View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
