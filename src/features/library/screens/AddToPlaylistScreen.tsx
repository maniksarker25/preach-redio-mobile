import { Check, Plus } from 'lucide-react-native';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootScreenProps } from '@/app/navigation/types';
import { AppText } from '@/components/common/AppText';
import { Button } from '@/components/common/Button';
import { Touchable } from '@/components/common/Touchable';
import { ScreenHeader } from '@/components/layouts/ScreenHeader';
import { Screen } from '@/components/layouts/Screen';
import { useLibraryStore } from '@/store/libraryStore';
import { colors, GUTTER } from '@/theme';
import { PlaylistCover } from '../components/PlaylistCover';

/** Sheet to toggle a message in and out of the user's playlists. */
export function AddToPlaylistScreen({ route, navigation }: RootScreenProps<'AddToPlaylist'>) {
  const { podcastId } = route.params;
  const insets = useSafeAreaInsets();
  const playlists = useLibraryStore((s) => s.playlists);
  const { addToPlaylist, removeFromPlaylist } = useLibraryStore.getState();

  return (
    <Screen safeTop={false} className="bg-ink-850">
      <View className="items-center pt-2.5">
        <View className="h-1 w-10 rounded-full bg-ink-500" />
      </View>
      <ScreenHeader back="down" title="Add to playlist" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: GUTTER, paddingBottom: insets.bottom + 24 }}>
        <Touchable onPress={() => navigation.replace('PlaylistEditor', { addPodcastId: podcastId })} className="flex-row items-center py-2.5" accessibilityLabel="New playlist">
          <View className="h-14 w-14 items-center justify-center rounded-md bg-white">
            <Plus size={24} color={colors.black} />
          </View>
          <AppText variant="title" className="ml-3.5">
            New playlist
          </AppText>
        </Touchable>
        {playlists.map((p) => {
          const added = p.podcasts.includes(podcastId);
          return (
            <Touchable
              key={p._id}
              haptic
              onPress={() => (added ? removeFromPlaylist(p._id, podcastId) : addToPlaylist(p._id, podcastId))}
              className="flex-row items-center py-2.5"
              accessibilityRole="checkbox"
              accessibilityState={{ checked: added }}
              accessibilityLabel={p.name}
            >
              <PlaylistCover playlist={p} size={56} />
              <View className="ml-3.5 flex-1">
                <AppText variant="title">{p.name}</AppText>
                <AppText variant="caption" tone="muted">
                  {p.podcasts.length} messages
                </AppText>
              </View>
              <View className={added ? 'h-7 w-7 items-center justify-center rounded-full bg-white' : 'h-7 w-7 rounded-full border-2 border-ink-500'}>
                {added ? <Check size={16} color={colors.black} strokeWidth={3} /> : null}
              </View>
            </Touchable>
          );
        })}
        <Button label="Done" variant="secondary" onPress={() => navigation.goBack()} className="mt-6" />
      </ScrollView>
    </Screen>
  );
}
