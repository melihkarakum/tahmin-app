import { Text, TextInput, type TextInputProps, View } from 'react-native';

import { colors } from '@/constants/theme';

type TextFieldProps = TextInputProps & {
  label: string;
  error?: string | null;
  hint?: string;
};

export function TextField({ label, error, hint, ...inputProps }: TextFieldProps) {
  return (
    <View className="gap-1.5">
      <Text className="text-sm font-semibold text-ink">{label}</Text>
      <TextInput
        className={
          error
            ? 'h-12 rounded-xl border border-danger bg-surface px-4 text-base text-ink'
            : 'h-12 rounded-xl border border-border bg-surface px-4 text-base text-ink'
        }
        placeholderTextColor={colors.muted}
        {...inputProps}
      />
      {error ? (
        <Text className="text-xs text-danger">{error}</Text>
      ) : hint ? (
        <Text className="text-xs text-muted">{hint}</Text>
      ) : null}
    </View>
  );
}
