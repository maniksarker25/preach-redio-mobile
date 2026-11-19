import { memo } from 'react';
import { Text } from 'react-native';
import { AppText, type AppTextProps } from '@/components/common/AppText';
import { colors } from '@/theme';

/** Renders text with the part matching `query` in the accent colour. */
export const HighlightText = memo(function HighlightText({ text, query, ...rest }: AppTextProps & { text: string; query: string }) {
  const q = query.trim();
  const i = q ? text.toLowerCase().indexOf(q.toLowerCase()) : -1;
  if (i < 0) return <AppText {...rest}>{text}</AppText>;
  return (
    <AppText {...rest}>
      {text.slice(0, i)}
      <Text style={{ color: colors.brand[400] }}>{text.slice(i, i + q.length)}</Text>
      {text.slice(i + q.length)}
    </AppText>
  );
});
