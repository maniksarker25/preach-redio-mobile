import { Eye, EyeOff, type LucideIcon } from 'lucide-react-native';
import { memo, useState, type ComponentRef, type Ref } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';
import { colors, fonts } from '@/theme';
import { cn } from '@/utils/podcast';
import { AppText } from './AppText';
import { Touchable } from './Touchable';

export interface TextFieldProps extends TextInputProps {
  label?: string;
  icon?: LucideIcon;
  error?: string;
  hint?: string;
  password?: boolean;
  containerClassName?: string;
  ref?: Ref<ComponentRef<typeof TextInput>>;
}

export const TextField = memo(
  function TextField({ label, icon: Icon, error, hint, password, containerClassName, onFocus, onBlur, multiline, ref, ...rest }: TextFieldProps) {
    const [focused, setFocused] = useState(false);
    const [hidden, setHidden] = useState(true);

    return (
      <View className={containerClassName}>
        {label ? (
          <AppText variant="label" tone="secondary" className="mb-2">
            {label}
          </AppText>
        ) : null}
        <View
          className={cn(
            'flex-row rounded-sm border bg-transparent px-4',
            multiline ? 'min-h-[120px] items-start py-3' : 'h-14 items-center',
            error ? 'border-danger' : focused ? 'border-brand-400' : 'border-white/80',
          )}
        >
          {Icon ? <Icon size={19} color={focused ? colors.brand[400] : colors.text.secondary} style={{ marginRight: 12, marginTop: multiline ? 2 : 0 }} /> : null}
          <TextInput
            ref={ref}
            placeholderTextColor={colors.text.faint}
            selectionColor={colors.brand[500]}
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
            style={{ flex: 1, color: colors.text.primary, fontFamily: fonts.medium, fontSize: 15, minHeight: multiline ? 96 : undefined }}
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
  },
);
