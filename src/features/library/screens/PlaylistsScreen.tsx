import { ChevronRight, Plus } from 'lucide-react-native';
import { ScrollView, View } from 'react-native';
import type { RootScreenProps } from '@/app/navigation/types';
import { AppText } from '@/components/common/AppText';
import { Touchable } from '@/components/common/Touchable';
import { ScreenHeader } from '@/components/layouts/ScreenHeader';
import { Screen } from '@/components/layouts/Screen';
import { useBottomSpace } from '@/hooks/useBottomSpace';
import { useLibraryStore } from '@/store/libraryStore';
import { colors, GUTTER } from '@/theme';
import { PlaylistCover } from '../components/PlaylistCover';

/** "My playlist" (Flutter `PlaylistScreen`): the user's playlists plus a create row. */
export function PlaylistsScreen({ navigation }: RootScreenProps<'Playlists'>) {
  const bottom = useBottomSpace(false);
  const playlists = useLibraryStore((s) => s.playlists);

  return (
    <Screen>
      <ScreenHeader title="My playlist" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: GUTTER, paddingBottom: bottom, gap: 10 }}>
        <Touchable onPress={() => navigation.navigate('PlaylistEditor', {})} className="flex-row items-center rounded-sm bg-ink-800 p-2.5" accessibilityLabel="Create a playlist">
          <View className="h-14 w-14 items-center justify-center rounded-[6px] border border-dashed border-white/40">
            <Plus size={24} color={colors.white} />
          </View>
          <AppText variant="title" className="ml-3.5 text-[16px]">
            Create playlist
          </AppText>
        </Touchable>
        {playlists.map((p) => (
          <Touchable key={p._id} onPress={() => navigation.navigate('Playlist', { id: p._id })} className="flex-row items-center rounded-sm bg-ink-800 p-2.5" accessibilityLabel={`Playlist ${p.name}`}>
            <PlaylistCover playlist={p} size={56} />
            <View className="ml-3.5 flex-1">
              <AppText variant="title" numberOfLines={1} className="text-[16px]">
                {p.name}
              </AppText>
              <AppText variant="caption" tone="muted">
                {p.podcasts.length} {p.podcasts.length === 1 ? 'podcast' : 'podcasts'}
              </AppText>
            </View>
            <ChevronRight size={18} color={colors.text.muted} />
          </Touchable>
        ))}
      </ScrollView>
    </Screen>
  );
}
