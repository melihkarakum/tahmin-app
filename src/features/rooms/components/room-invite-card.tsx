import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { PressableOpacity } from '@/components/ui/pressable-opacity';
import { Text } from '@/components/ui/text';
import { colors } from '@/constants/theme';

type RoomInviteCardProps = {
  code: string;
  expanded: boolean;
  onToggle: () => void;
  onWhatsApp: () => void;
  onShare: () => void;
};

/** Oda ekranındaki davet alanı: kapalıyken tek satır (kodla birlikte), dokununca paylaşma düğmeleri açılır. */
export function RoomInviteCard({ code, expanded, onToggle, onWhatsApp, onShare }: RoomInviteCardProps) {
  return (
    <View className="overflow-hidden rounded-3xl border border-border bg-surface">
      <PressableOpacity
        onPress={onToggle}
        accessibilityLabel={`Arkadaşlarını davet et, oda kodu ${code.split('').join(' ')}`}
        accessibilityState={{ expanded }}>
        <View className="flex-row items-center gap-3 px-4 py-3">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-primary-soft">
            <Icon name="personAdd" size={18} color={colors.primary} />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-bold text-ink">Arkadaşlarını davet et</Text>
            <Text className="mt-0.5 text-xs text-muted">
              Oda kodu <Text className="text-xs font-extrabold tracking-[2px] text-ink">{code}</Text>
            </Text>
          </View>
          <Icon name={expanded ? 'chevronUp' : 'chevronDown'} size={14} color={colors.muted} />
        </View>
      </PressableOpacity>

      {expanded ? (
        <View className="gap-3 border-t border-border px-4 pb-4 pt-3">
          <View className="flex-row gap-2">
            <Button label="WhatsApp" onPress={onWhatsApp} style={{ flex: 1 }} />
            <Button label="Paylaş" variant="secondary" onPress={onShare} style={{ flex: 1 }} />
          </View>
          <Text className="text-xs text-muted">
            {"Arkadaşların davet bağlantısına dokunarak ya da Odalar → Koda Katıl'a bu kodu girerek katılır."}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
