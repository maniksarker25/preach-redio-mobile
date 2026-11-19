import { memo, useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { colors } from '@/theme';
import { AppText } from './AppText';
import { Touchable } from './Touchable';

interface SegmentedTabsProps<K extends string> {
  tabs: readonly { key: K; label: string }[];
  value: K;
  onChange: (key: K) => void;
}

/** Pill tabs with a sliding indicator. */
function SegmentedTabsInner<K extends string>({ tabs, value, onChange }: SegmentedTabsProps<K>) {
  const [width, setWidth] = useState(0);
  const index = Math.max(0, tabs.findIndex((t) => t.key === value));
  const segment = width / tabs.length;

  const indicator = useAnimatedStyle(() => ({
    width: segment,
    transform: [{ translateX: withSpring(index * segment, { damping: 20, stiffness: 220 }) }],
  }));

  return (
    <View
      className="h-11 flex-row rounded-full border border-line bg-ink-800 p-1"
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width - 8)}
      accessibilityRole="tablist"
    >
      {width > 0 ? <Animated.View style={[{ position: 'absolute', bottom: 4, left: 4, top: 4, borderRadius: 999, backgroundColor: colors.ink[600] }, indicator]} /> : null}
      {tabs.map((t) => (
        <Touchable
          key={t.key}
          haptic
          scaleTo={0.98}
          onPress={() => onChange(t.key)}
          accessibilityRole="tab"
          accessibilityState={{ selected: t.key === value }}
          className="flex-1 items-center justify-center"
        >
          <AppText variant="label" tone={t.key === value ? 'primary' : 'muted'}>
            {t.label}
          </AppText>
        </Touchable>
      ))}
    </View>
  );
}

export const SegmentedTabs = memo(SegmentedTabsInner) as typeof SegmentedTabsInner;
