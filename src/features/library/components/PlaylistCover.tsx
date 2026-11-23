import { LinearGradient } from 'expo-linear-gradient';
import { ListMusic } from 'lucide-react-native';
import { memo } from 'react';
import { View } from 'react-native';
import { Artwork } from '@/components/media/Artwork';
import { colors } from '@/theme';

interface PlaylistCoverProps {
  /** The playlist's own cover, when it has one. */
  coverImage?: string | null;
  /** Covers of its first podcasts (detail screen) for the mosaic fallback. */
  covers?: (string | null | undefined)[];
  size: number;
}

/** Playlist cover: its own image, else a 2×2 mosaic of its first podcasts, else one cover, else a branded placeholder. */
export const PlaylistCover = memo(function PlaylistCover({ coverImage, covers = [], size }: PlaylistCoverProps) {
  const radius = size > 100 ? 24 : 12;
  if (coverImage) return <Artwork uri={coverImage} width={size} height={size} radius={radius} />;

  const found = covers.filter((c): c is string => Boolean(c));
  if (found.length >= 4) {
    const half = size / 2;
    return (
      <View style={{ width: size, height: size, borderRadius: radius, overflow: 'hidden', flexDirection: 'row', flexWrap: 'wrap' }}>
        {found.slice(0, 4).map((uri, i) => (
          <Artwork key={i} uri={uri} width={half} height={half} radius={0} />
        ))}
      </View>
    );
  }
  if (found[0]) return <Artwork uri={found[0]} width={size} height={size} radius={radius} fit="contain" />;

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
