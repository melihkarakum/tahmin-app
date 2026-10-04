import Constants from 'expo-constants';
import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { SectionTitle } from '@/components/ui/section-title';
import { Text } from '@/components/ui/text';
import { signOut, toAuthMessage } from '@/features/auth/api';
import { FormError } from '@/features/auth/components/auth-screen';
import { NotificationSettingsCard } from '@/features/notifications/components/notification-settings-card';
import { useDeleteAccount } from '@/features/profile/queries';
import { confirmDestructive } from '@/lib/dialogs';

/** Ayarlar (profildeki dişli simgesinden): bildirimler ve hesap. */
export default function SettingsScreen() {
  const deleteAccount = useDeleteAccount();
  const [actionError, setActionError] = useState<string | null>(null);

  const handleSignOut = async () => {
    setActionError(null);
    try {
      await signOut();
    } catch (error) {
      setActionError(toAuthMessage(error));
    }
  };

  const confirmDelete = () => {
    confirmDestructive({
      title: 'Hesabını sil',
      message:
        'E-posta adresin ve giriş bilgilerin kalıcı olarak silinir, odalardan çıkarılırsın. Geçmiş tahminlerin isimsiz olarak kalır. Bu işlem geri alınamaz.',
      confirmLabel: 'Hesabımı sil',
      onConfirm: () =>
        deleteAccount.mutate(undefined, {
          onError: () => setActionError('Hesap silinemedi. İnternet bağlantını kontrol edip tekrar dene.'),
        }),
    });
  };

  return (
    <Screen topInset={false}>
      <Text className="mb-3 text-xl font-bold text-ink">Bildirimler</Text>
      <NotificationSettingsCard />

      <SectionTitle title="Hesap" />
      <View className="gap-3">
        {actionError ? <FormError message={actionError} /> : null}
        <Button label="Çıkış Yap" variant="secondary" onPress={handleSignOut} />
        <Button
          label={deleteAccount.isPending ? 'Siliniyor…' : 'Hesabımı Sil'}
          variant="danger"
          onPress={confirmDelete}
          disabled={deleteAccount.isPending}
        />
      </View>

      <Text className="mt-8 text-center text-xs text-muted">
        Sürüm {Constants.expoConfig?.version ?? '–'}
      </Text>
    </Screen>
  );
}
