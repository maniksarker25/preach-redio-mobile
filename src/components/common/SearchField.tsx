import { Search, X } from 'lucide-react-native';
import { memo } from 'react';
import { TextInput, View } from 'react-native';
import { colors, fonts } from '@/theme';
import { Touchable } from './Touchable';
import { AppText } from './AppText';

interface SearchFieldProps {
  value?: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  /** Render as a button that opens the search screen. */
  onPressFake?: () => void;
}

export const SearchField = memo(function SearchField({
  value,
  onChangeText,
  placeholder = 'What would you like to hear?',
  autoFocus,
  onPressFake,
}: SearchFieldProps) {
  // Flutter search box: #2A2B31 fill, white 1 px border, 8 px corners.
  const shell = 'h-[52px] flex-row items-center rounded-sm border border-white bg-ink-800 px-3.5';

  if (onPressFake) {
    return (
      <Touchable onPress={onPressFake} className={shell} accessibilityLabel="Search" scaleTo={0.985}>
        <Search size={22} color={colors.white} />
        <AppText variant="body" tone="secondary" className="ml-2 text-[16px]">
          {placeholder}
        </AppText>
      </Touchable>
    );
  }

  return (
    <View className={shell}>
      <Search size={19} color={colors.text.muted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.text.faint}
        selectionColor={colors.brand[500]}
        autoFocus={autoFocus}
        returnKeyType="search"
        autoCorrect={false}
        accessibilityLabel="Search"
        style={{ flex: 1, marginLeft: 12, color: colors.text.primary, fontFamily: fonts.medium, fontSize: 15 }}
      />
      {value ? (
        <Touchable onPress={() => onChangeText?.('')} accessibilityLabel="Clear search" className="h-6 w-6 items-center justify-center rounded-full bg-ink-600">
          <X size={14} color={colors.text.secondary} />
        </Touchable>
      ) : null}
    </View>
  );
});
