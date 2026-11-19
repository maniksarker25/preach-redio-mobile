import { LinearGradient } from 'expo-linear-gradient';
import { ListMusic } from 'lucide-react-native';
import { memo } from 'react';
import { View } from 'react-native';
import { Artwork } from '@/components/media/Artwork';
import { usePodcastsByIds } from '@/hooks/queries';
import { colors } from '@/theme';
import type { Playlist } from '@/types/models';

/** Playlist cover: its own image, or a 2×2 mosaic of its first episodes, or a branded placeholder. */
export const PlaylistCover = memo(function PlaylistCover({ playlist, size }: { playlist: Playlist; size: number }) {
  const { data } = usePodcastsByIds(playlist.cover_image ? [] : playlist.podcasts.slice(0, 4));
  const radius = size > 100 ? 24 : 12;

  if (playlist.cover_image) return <Artwork uri={playlist.cover_image} width={size} height={size} radius={radius} />;

  const covers = (data ?? []).map((p) => p.coverImage).filter(Boolean) as string[];
  if (covers.length >= 4) {
    const half = size / 2;
    return (
      <View style={{ width: size, height: size, borderRadius: radius, overflow: 'hidden', flexDirection: 'row', flexWrap: 'wrap' }}>
        {covers.slice(0, 4).map((uri, i) => (
          <Artwork key={i} uri={uri} width={half} height={half} radius={0} />
        ))}
      </View>
    );
  }
  if (covers[0]) return <Artwork uri={covers[0]} width={size} height={size} radius={radius} />;

  return (
    <LinearGradient
      colors={[colors.brand[600], colors.brand[900]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ width: size, height: size, borderRadius: radius, alignItems: 'center', justifyContent: 'center' }}
    >
      <ListMusic size={size * 0.38} color={colors.white} />
    </LinearGradient>
  );
});
