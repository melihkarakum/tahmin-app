import { useRef, useState } from 'react';
import type { TextInput } from 'react-native';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { toRoomMessage, useRenameRoom } from '@/features/rooms/queries';
import { haptics } from '@/lib/haptics';

type RenameRoomSheetProps = {
  visible: boolean;
  roomId: string;
  currentName: string;
  onClose: () => void;
};

/** Oda adını değiştirme paneli (yalnızca oda kurucusuna gösterilir; kural sunucuda). */
export function RenameRoomSheet({ visible, roomId, currentName, onClose }: RenameRoomSheetProps) {
  const inputRef = useRef<TextInput>(null);
  const [name, setName] = useState(currentName);
  const [error, setError] = useState<string | null>(null);
  const renameRoom = useRenameRoom(roomId);

  const save = () => {
    const trimmed = name.trim();
    if (trimmed.length < 2 || trimmed.length > 40) {
      setError('Oda adı 2-40 karakter olmalı.');
      return;
    }
    if (trimmed === currentName) {
      onClose();
      return;
    }
    setError(null);
    renameRoom.mutate(trimmed, {
      onSuccess: () => {
        haptics.success();
        onClose();
      },
      onError: (renameError) => {
        haptics.warning();
        setError(toRoomMessage(renameError));
      },
    });
  };

  return (
    <BottomSheet
      visible={visible}
      title="Oda adını düzenle"
      onClose={onClose}
      onShow={() => {
        // Panel her açıldığında güncel adla başlar.
        setName(currentName);
        setError(null);
        inputRef.current?.focus();
      }}>
      <TextField
        ref={inputRef}
        label="Oda adı"
        value={name}
        onChangeText={setName}
        maxLength={40}
        returnKeyType="done"
        onSubmitEditing={save}
        error={error}
        hint="Odadaki herkes yeni adı görür."
      />
      <Button
        label={renameRoom.isPending ? 'Kaydediliyor…' : 'Kaydet'}
        onPress={save}
        disabled={renameRoom.isPending}
        style={{ marginTop: 16 }}
      />
    </BottomSheet>
  );
}
