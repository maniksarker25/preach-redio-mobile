import { ChevronLeft } from 'lucide-react-native';
import { useMemo } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootScreenProps } from '@/app/navigation/types';
import { IconButton } from '@/components/common/IconButton';
import { ErrorState } from '@/components/common/States';
import { Screen } from '@/components/layouts/Screen';
import { usePodcasts } from '@/hooks/queries';
import { colors } from '@/theme';
import { ReelsFeed } from '../components/ReelsFeed';

/** Praise Clips (Flutter `ReelsScreen`): vertical full-screen pages, starting at the tapped clip. */
export function ReelsViewerScreen({ route, navigation }: RootScreenProps<'ReelsViewer'>) {
  const insets = useSafeAreaInsets();
  const { startId, ids } = route.params;
  const all = usePodcasts({ type: 'clip', limit: 50 });

  const clips = useMemo(() => {
    const list = all.data ?? [];
    if (!ids?.length) return list;
    const picked = ids.map((id) => list.find((c) => c._id === id)).filter((c): c is NonNullable<typeof c> => Boolean(c));
    return picked.length ? picked : list;
  }, [all.data, ids]);

  return (
    <Screen safeTop={false} className="bg-black">
      {all.isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.white} />
        </View>
      ) : all.isError ? (
        <ErrorState onRetry={() => void all.refetch()} />
      ) : (
        <ReelsFeed clips={clips} startId={startId} bottomInset={insets.bottom + 8} />
      )}
      <View className="absolute left-2" style={{ top: insets.top + 4 }}>
        <IconButton icon={ChevronLeft} variant="glass" size={24} color={colors.white} onPress={() => navigation.goBack()} accessibilityLabel="Close clips" />
      </View>
    </Screen>
  );
}
