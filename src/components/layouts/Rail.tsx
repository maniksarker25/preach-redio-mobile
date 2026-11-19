import { FlashList, type ListRenderItem } from '@shopify/flash-list';
import { memo, useMemo, type ReactElement, type ReactNode } from 'react';
import { View } from 'react-native';
import { GUTTER } from '@/theme';

interface RailProps<T> {
  data: readonly T[] | undefined;
  renderItem: ListRenderItem<T>;
  keyExtractor: (item: T) => string;
  gap?: number;
}

/** Horizontal carousel with page gutters. Virtualised, so long rails stay cheap. */
function RailInner<T>({ data, renderItem, keyExtractor, gap = 14 }: RailProps<T>) {
  const Separator = useMemo(() => () => <View style={{ width: gap }} />, [gap]);
  return (
    <FlashList
      horizontal
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: GUTTER }}
      ItemSeparatorComponent={Separator}
    />
  );
}

export const Rail = memo(RailInner) as <T>(props: RailProps<T>) => ReactElement;

/** Spacing wrapper between home/discover sections. */
export const Section = memo(function Section({ children }: { children: ReactNode }) {
  return <View className="mb-9">{children}</View>;
});
