import { Eye, EyeOff, type LucideIcon } from 'lucide-react-native';
import { memo, useState, type ComponentRef, type Ref } from 'react';
import { TextInput, View, type TextInputProps, type ViewStyle } from 'react-native';
import { colors, fonts } from '@/theme';
import { AppText } from './AppText';
import { Touchable } from './Touchable';

export type FieldVariant = 'outline' | 'filled';

export interface TextFieldProps extends TextInputProps {
  label?: string;
  icon?: LucideIcon;
  error?: string;
  hint?: string;
  password?: boolean;
  /** `outline` = Flutter white-border field (default) · `filled` = soft dark field used on auth screens. */
  variant?: FieldVariant;
  containerClassName?: string;
  ref?: Ref<ComponentRef<typeof TextInput>>;
}

/** Shell styles for a field in each variant/state — shared with DateField. */
export const fieldShell = (variant: FieldVariant, state: { focused: boolean; error: boolean; multiline?: boolean }): ViewStyle => {
  const base: ViewStyle = {
    flexDirection: 'row',
    alignItems: state.multiline ? 'flex-start' : 'center',
    paddingHorizontal: 16,
    ...(state.multiline ? { minHeight: 120, paddingVertical: 12 } : { height: variant === 'filled' ? 54 : 56 }),
  };
  if (variant === 'filled') {
    return {
      ...base,
      borderRadius: 14,
      backgroundColor: colors.ink[800],
      borderWidth: 1,
      borderColor: state.error ? colors.danger : state.focused ? 'rgba(230,167,168,0.6)' : 'rgba(255,255,255,0.06)',
    };
  }
  return {
    ...base,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: state.error ? colors.danger : state.focused ? colors.brand[400] : 'rgba(255,255,255,0.8)',
  };
};

export const TextField = memo(function TextField({
  label,
  icon: Icon,
  error,
  hint,
  password,
  variant = 'outline',
  containerClassName,
  onFocus,
  onBlur,
  multiline,
  ref,
  ...rest
}: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(true);
  const filled = variant === 'filled';

  return (
    <View className={containerClassName}>
      {label ? (
        <AppText variant="label" tone={filled ? 'muted' : 'secondary'} className={filled ? 'mb-1.5 text-[13px]' : 'mb-2'}>
          {label}
        </AppText>
      ) : null}
      <View style={fieldShell(variant, { focused, error: Boolean(error), multiline })}>
        {Icon ? <Icon size={19} color={focused ? colors.brand[400] : filled ? colors.text.muted : colors.text.secondary} style={{ marginRight: 12, marginTop: multiline ? 2 : 0 }} /> : null}
        <TextInput
          ref={ref}
          placeholderTextColor={filled ? colors.text.muted : colors.text.faint}
          selectionColor={colors.brand[400]}
          secureTextEntry={password && hidden}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          accessibilityLabel={label ?? rest.placeholder}
          {...rest}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={{ flex: 1, color: colors.text.primary, fontFamily: filled ? fonts.semibold : fonts.medium, fontSize: 15.5, minHeight: multiline ? 96 : undefined }}
        />
        {password ? (
          <Touchable onPress={() => setHidden((h) => !h)} accessibilityLabel={hidden ? 'Show password' : 'Hide password'} className="pl-3">
            {hidden ? <Eye size={19} color={colors.text.muted} /> : <EyeOff size={19} color={colors.text.muted} />}
          </Touchable>
        ) : null}
      </View>
      {error || hint ? (
        <AppText variant="caption" tone={error ? 'live' : 'muted'} className="mt-1.5">
          {error ?? hint}
        </AppText>
      ) : null}
    </View>
  );
});
