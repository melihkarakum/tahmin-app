import { useRef, useState } from 'react';
import type { TextInput } from 'react-native';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { useUpdateDisplayName } from '@/features/profile/queries';
import { haptics } from '@/lib/haptics';

type EditProfileSheetProps = {
  visible: boolean;
  username: string;
  displayName: string;
  onClose: () => void;
};

/** Görünen adı değiştirme paneli. Kullanıcı adı değiştirilemez (arkadaşların seni bununla bulur). */
export function EditProfileSheet({ visible, username, displayName, onClose }: EditProfileSheetProps) {
  const inputRef = useRef<TextInput>(null);
  // Panel her açıldığında güncel adla başlar (bkz. onShow).
  const [name, setName] = useState(displayName);
  const [error, setError] = useState<string | null>(null);
  const updateName = useUpdateDisplayName();

  const save = () => {
    const trimmed = name.trim();
    if (trimmed.length < 1 || trimmed.length > 30) {
      setError('Görünen ad 1-30 karakter olmalı.');
      return;
    }
    if (trimmed === displayName) {
      onClose();
      return;
    }
    setError(null);
    updateName.mutate(trimmed, {
      onSuccess: () => {
        haptics.success();
        onClose();
      },
      onError: () => {
        haptics.warning();
        setError('Kaydedilemedi. İnternet bağlantını kontrol edip tekrar dene.');
      },
    });
  };

  return (
    <BottomSheet
      visible={visible}
      title="Profili düzenle"
      subtitle={<Text className="text-xs text-muted">Kullanıcı adın: @{username} (değiştirilemez)</Text>}
      onClose={onClose}
      onShow={() => {
        setName(displayName);
        setError(null);
        inputRef.current?.focus();
      }}>
      <TextField
        ref={inputRef}
        label="Görünen ad"
        value={name}
        onChangeText={setName}
        maxLength={30}
        autoCapitalize="words"
        returnKeyType="done"
        onSubmitEditing={save}
        error={error}
        hint="Sıralamalarda ve odalarda bu ad görünür."
      />
      <Button
        label={updateName.isPending ? 'Kaydediliyor…' : 'Kaydet'}
        onPress={save}
        disabled={updateName.isPending}
        style={{ marginTop: 16 }}
      />
    </BottomSheet>
  );
}
