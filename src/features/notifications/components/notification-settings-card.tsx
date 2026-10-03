import { Linking, Platform, Switch, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { colors } from '@/constants/theme';
import type { PushStatus } from '@/features/notifications/push';
import {
  useEnablePush,
  useNotificationSettings,
  usePushStatus,
  useUpdateNotificationSettings,
} from '@/features/notifications/queries';

/** Profil ekranındaki bildirim bölümü: izin durumu ve iki tercih anahtarı. */
export function NotificationSettingsCard() {
  const { data: status } = usePushStatus();
  const { data: settings = { matchReminders: true, roundResults: true } } = useNotificationSettings();
  const update = useUpdateNotificationSettings();
  const enable = useEnablePush();

  return (
    <View className="overflow-hidden rounded-3xl border border-border bg-surface">
      {status && status !== 'granted' ? (
        <PermissionNotice
          status={status}
          onEnable={() => enable.mutate()}
          isEnabling={enable.isPending}
          failed={enable.isError}
        />
      ) : null}
      <SettingRow
        title="Maç hatırlatması"
        description="Tahmin yapmadığın maç başlamadan 1 saat önce"
        value={settings.matchReminders}
        onChange={(value) => update.mutate({ ...settings, matchReminders: value })}
      />
      <SettingRow
        title="Hafta sonucu"
        description="Hafta bitince puanın ve Türkiye sıran"
        value={settings.roundResults}
        onChange={(value) => update.mutate({ ...settings, roundResults: value })}
        isLast
      />
    </View>
  );
}

export function PermissionNotice({
  status,
  onEnable,
  isEnabling,
  failed,
}: {
  status: Exclude<PushStatus, 'granted'>;
  onEnable: () => void;
  isEnabling: boolean;
  failed: boolean;
}) {
  if (status === 'unsupported') {
    return (
      <Text className="border-b border-border px-4 py-3.5 text-xs text-muted">
        {Platform.OS === 'android'
          ? "Android'de bildirimler uygulamanın mağaza sürümünde çalışacak (Expo Go desteklemiyor)."
          : 'Bu cihaz bildirim almayı desteklemiyor.'}
      </Text>
    );
  }

  return (
    <View className="gap-3 border-b border-border px-4 py-4">
      <Text className="text-sm text-muted">
        {status === 'denied'
          ? 'Bildirim izni telefon ayarlarından kapatılmış. Hatırlatmaları almak için ayarlardan aç.'
          : 'Bildirimler bu cihazda kapalı. Açarsan maçları kaçırmazsın.'}
      </Text>
      {failed ? <Text className="text-xs text-danger">Bildirimler açılamadı. Tekrar dene.</Text> : null}
      {status === 'denied' ? (
        <Button label="Ayarları Aç" variant="secondary" onPress={() => Linking.openSettings()} />
      ) : (
        <Button
          label={isEnabling ? 'Açılıyor…' : 'Bildirimleri Aç'}
          onPress={onEnable}
          disabled={isEnabling}
        />
      )}
    </View>
  );
}

function SettingRow({
  title,
  description,
  value,
  onChange,
  isLast = false,
}: {
  title: string;
  description: string;
  value: boolean;
  onChange: (value: boolean) => void;
  isLast?: boolean;
}) {
  return (
    <View
      className={
        isLast
          ? 'flex-row items-center gap-3 px-4 py-3.5'
          : 'flex-row items-center gap-3 border-b border-border px-4 py-3.5'
      }>
      <View className="flex-1">
        <Text className="text-sm font-bold text-ink">{title}</Text>
        <Text className="mt-0.5 text-xs text-muted">{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.surfaceMuted, true: colors.primary }}
        thumbColor="#FFFFFF"
        ios_backgroundColor={colors.surfaceMuted}
        accessibilityLabel={title}
      />
    </View>
  );
}
