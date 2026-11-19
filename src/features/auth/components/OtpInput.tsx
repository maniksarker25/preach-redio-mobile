import { useRef, type ComponentRef } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { AppText } from '@/components/common/AppText';
import { colors } from '@/theme';
import { cn } from '@/utils/podcast';

interface OtpInputProps {
  value: string;
  onChange: (v: string) => void;
  length?: number;
  error?: boolean;
}

/** Six boxes backed by one hidden input — paste and autofill (one-time-code) just work. */
export function OtpInput({ value, onChange, length = 6, error }: OtpInputProps) {
  const ref = useRef<ComponentRef<typeof TextInput>>(null);
  return (
    <Pressable onPress={() => ref.current?.focus()} accessibilityLabel="Verification code" accessibilityHint={`Enter the ${length}-digit code`}>
      <View className="flex-row justify-between">
        {Array.from({ length }, (_, i) => {
          const char = value[i];
          const active = i === Math.min(value.length, length - 1);
          return (
            <View
              key={i}
              className={cn(
                'h-14 w-12 items-center justify-center rounded-md border-2 bg-ink-800',
                error ? 'border-danger' : char ? 'border-brand-500/70' : active ? 'border-brand-500' : 'border-line-strong',
              )}
            >
              <AppText variant="h2">{char ?? ''}</AppText>
            </View>
          );
        })}
      </View>
      <TextInput
        ref={ref}
        value={value}
        onChangeText={(t) => onChange(t.replace(/\D/g, '').slice(0, length))}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        autoFocus
        maxLength={length}
        caretHidden
        selectionColor={colors.transparent}
        style={{ position: 'absolute', opacity: 0, width: 1, height: 1 }}
      />
    </Pressable>
  );
}
