import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { colors } from '@/constants/theme';

type AuthScreenProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

/** Giriş ve kayıt ekranlarının ortak düzeni: klavye açılınca alanlar yukarı kayar. */
export function AuthScreen({ title, subtitle, children }: AuthScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="flex-grow justify-center px-6 py-10">
        <View style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
          <View className="mb-6 h-14 w-14 items-center justify-center rounded-2xl border border-border bg-primary-soft">
            <Icon name="ball" size={28} color={colors.primary} />
          </View>
          <Text className="text-3xl font-black text-ink">{title}</Text>
          <Text className="mt-2 text-base text-muted">{subtitle}</Text>
          <View className="mt-8 gap-4">{children}</View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export function FormError({ message }: { message: string }) {
  return (
    <View className="rounded-xl border border-danger bg-surface px-4 py-3">
      <Text className="text-sm text-danger">{message}</Text>
    </View>
  );
}
