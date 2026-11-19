import { Search, X } from 'lucide-react-native';
import { memo, useState } from 'react';
import { TextInput, View } from 'react-native';
import { Touchable } from '@/components/common/Touchable';
import { colors, fonts } from '@/theme';

interface SearchInputProps {
  value: string;
  onChangeText: (v: string) => void;
  onSubmit?: () => void;
  autoFocus?: boolean;
}

/** Soft, rounded search field: no hard outline, a pink ring only while focused. */
export const SearchInput = memo(function SearchInput({ value, onChangeText, onSubmit, autoFocus }: SearchInputProps) {
  const [focused, setFocused] = useState(false);
  return (
    <View
      style={{
        height: 48,
        borderRadius: 14,
        backgroundColor: colors.ink[800],
        borderWidth: 1,
        borderColor: focused ? 'rgba(230,167,168,0.55)' : 'rgba(255,255,255,0.06)',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
      }}
    >
      <Search size={19} color={focused ? colors.brand[400] : colors.text.muted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        placeholder="Podcasts, preachers, stations…"
        placeholderTextColor={colors.text.muted}
        selectionColor={colors.brand[400]}
        autoFocus={autoFocus}
        autoCorrect={false}
        returnKeyType="search"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        accessibilityLabel="Search podcasts and creators"
        style={{ flex: 1, marginLeft: 10, color: colors.text.primary, fontFamily: fonts.semibold, fontSize: 16 }}
      />
      {value ? (
        <Touchable onPress={() => onChangeText('')} accessibilityLabel="Clear search" className="h-6 w-6 items-center justify-center rounded-full bg-ink-600">
          <X size={14} color={colors.text.secondary} />
        </Touchable>
      ) : null}
    </View>
  );
});
