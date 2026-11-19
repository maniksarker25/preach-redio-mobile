import { AlertCircle } from 'lucide-react-native';
import { memo } from 'react';
import { View } from 'react-native';
import { AppText } from '@/components/common/AppText';
import { colors } from '@/theme';

/** Inline banner for a server error on auth forms. */
export const FormError = memo(function FormError({ message }: { message: string }) {
  return (
    <View className="flex-row items-center gap-2.5 rounded-xl border border-live/30 bg-live/10 px-3.5 py-3" accessibilityRole="alert">
      <AlertCircle size={17} color={colors.live} />
      <AppText variant="bodySm" className="flex-1" style={{ color: '#FFB4AE' }}>
        {message}
      </AppText>
    </View>
  );
});
