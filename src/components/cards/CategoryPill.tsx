import { LinearGradient } from 'expo-linear-gradient';
import { memo } from 'react';
import { View } from 'react-native';
import { AppText } from '@/components/common/AppText';
import { Touchable } from '@/components/common/Touchable';
import { colors } from '@/theme';
import type { Category } from '@/types/models';

/**
 * Text-only category chip for the home row: soft gradient fill, hairline border,
 * a small accent dot and the name. No image, so the row stays calm under the hero.
 */
export const CategoryPill = memo(function CategoryPill({ category, onPress }: { category: Category; onPress: (c: Category) => void }) {
  return (
    <Touchable onPress={() => onPress(category)} scaleTo={0.96} style={{ borderRadius: 999 }} accessibilityLabel={`Category: ${category.name}`}>
      <LinearGradient
        colors={['#33343B', colors.ink[800]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ height: 40, borderRadius: 999, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)' }}
      >
        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.brand[400], marginRight: 9 }} />
        <AppText variant="title" className="text-[14px] tracking-[0.3px]">
          {category.name}
        </AppText>
      </LinearGradient>
    </Touchable>
  );
});
