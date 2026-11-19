import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Calendar } from 'lucide-react-native';
import { memo, useState } from 'react';
import { Modal, Platform, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/theme';
import { AppText } from './AppText';
import { Button } from './Button';
import { fieldShell, type FieldVariant } from './TextField';
import { Touchable } from './Touchable';

interface DateFieldProps {
  label: string;
  value: Date | null;
  onChange: (d: Date) => void;
  placeholder?: string;
  error?: string;
  maximumDate?: Date;
  minimumDate?: Date;
  variant?: FieldVariant;
}

const format = (d: Date) => d.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });

/** Date input styled like TextField: native dialog on Android, bottom-sheet spinner on iOS. */
export const DateField = memo(function DateField({ label, value, onChange, placeholder = 'Select a date', error, maximumDate, minimumDate, variant = 'outline' }: DateFieldProps) {
  const filled = variant === 'filled';
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Date>(value ?? new Date(2000, 0, 1));

  const onAndroidChange = (e: DateTimePickerEvent, d?: Date) => {
    setOpen(false);
    if (e.type === 'set' && d) onChange(d);
  };

  return (
    <View>
      <AppText variant="label" tone={filled ? 'muted' : 'secondary'} className={filled ? 'mb-1.5 text-[13px]' : 'mb-2'}>
        {label}
      </AppText>
      <Touchable
        onPress={() => {
          setDraft(value ?? new Date(2000, 0, 1));
          setOpen(true);
        }}
        scaleTo={0.99}
        accessibilityLabel={`${label}${value ? `, ${format(value)}` : ''}`}
        style={fieldShell(variant, { focused: open, error: Boolean(error) })}
      >
        <Calendar size={19} color={open ? colors.brand[400] : filled ? colors.text.muted : colors.text.secondary} />
        <AppText variant="body" tone={value ? 'primary' : filled ? 'muted' : 'faint'} className="ml-3 flex-1">
          {value ? format(value) : placeholder}
        </AppText>
      </Touchable>
      {error ? (
        <AppText variant="caption" tone="live" className="mt-1.5">
          {error}
        </AppText>
      ) : null}

      {open && Platform.OS === 'android' ? (
        <DateTimePicker value={draft} mode="date" display="default" maximumDate={maximumDate} minimumDate={minimumDate} onChange={onAndroidChange} />
      ) : null}

      {Platform.OS === 'ios' ? (
        <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
          <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} onPress={() => setOpen(false)} accessibilityLabel="Close date picker" />
          <View style={{ backgroundColor: colors.ink[850], borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 16, paddingTop: 16, paddingBottom: insets.bottom + 16 }}>
            <AppText variant="h3" className="mb-2 text-center">
              {label}
            </AppText>
            <DateTimePicker value={draft} mode="date" display="spinner" themeVariant="dark" maximumDate={maximumDate} minimumDate={minimumDate} onChange={(_, d) => d && setDraft(d)} />
            <Button
              label="Done"
              onPress={() => {
                onChange(draft);
                setOpen(false);
              }}
              className="mt-2"
            />
          </View>
        </Modal>
      ) : null}
    </View>
  );
});
