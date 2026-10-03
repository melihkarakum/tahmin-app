import type { Ref } from 'react';
import { TextInput, type TextInputProps, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { fonts } from '@/constants/fonts';
import { colors } from '@/constants/theme';

type TextFieldProps = TextInputProps & {
  label: string;
  error?: string | null;
  hint?: string;
  /** Yazı alanına dışarıdan odaklanmak için (örneğin panel açıldıktan sonra). */
  ref?: Ref<TextInput>;
};

// Yazı alanında satır yüksekliği (lineHeight) verilmez: iOS'ta metni kaydırıp kırpıyor.
// Yükseklik kutudan, yazı boyutu yalnızca fontSize ile gelir.
const inputTextStyle = { fontFamily: fonts.medium, fontSize: 16, paddingVertical: 0 } as const;

export function TextField({ label, error, hint, style, ref, ...inputProps }: TextFieldProps) {
  return (
    <View className="gap-2">
      <Text className="text-sm font-semibold text-ink">{label}</Text>
      <TextInput
        ref={ref}
        className={
          error
            ? 'h-14 rounded-2xl border border-danger bg-surface px-4 text-ink'
            : 'h-14 rounded-2xl border border-border bg-surface px-4 text-ink'
        }
        style={[inputTextStyle, style]}
        placeholderTextColor={colors.muted}
        {...inputProps}
      />
      {error ? (
        <Text className="text-xs leading-5 text-danger">{error}</Text>
      ) : hint ? (
        <Text className="text-xs leading-5 text-muted">{hint}</Text>
      ) : null}
    </View>
  );
}
