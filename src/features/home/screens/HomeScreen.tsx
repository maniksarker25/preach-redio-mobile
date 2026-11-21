import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useMemo } from 'react';
import { Linking, RefreshControl, ScrollView, useWindowDimensions, View } from 'react-native';
import type { TabScreenProps } from '@/app/navigation/types';
import { CategoryPill } from '@/components/cards/CategoryPill';
import { MusicCard, ReelThumb, SeriesCard } from '@/components/cards/HomeCards';
import { SectionHeader } from '@/components/common/SectionHeader';
import { ErrorState } from '@/components/common/States';
import { Rail } from '@/components/layouts/Rail';
import { Screen } from '@/components/layouts/Screen';
import { useBroadcasters, useHomeFeed, usePreviousLives } from '@/hooks/queries';
import { useBottomSpace } from '@/hooks/useBottomSpace';
import { useMediaActions } from '@/hooks/useMediaActions';
import { useGetClipsInfiniteQuery } from '@/store/api/reelsApi';
import { colors, GUTTER } from '@/theme';
import type { Podcast } from '@/types/models';
import { ownerName } from '@/utils/podcast';
import { BannerPager, type BannerItem } from '../components/BannerPager';
import { HeroBanner, type HeroItem } from '../components/HeroBanner';
import { HomeHeader } from '../components/HomeHeader';
import { HomeSkeleton } from '../components/HomeSkeleton';
import { StreamingRecordCard } from '../components/StreamingRecordCard';
import { TopFavorites } from '../components/TopFavorites';

const podcastKey = (p: Podcast) => p._id;

/** A hero slide plus what it opens. */
type HeroSlide = HeroItem & { podcast?: Podcast; albumId?: string; url?: string };

/**
 * Home — header (brand, greeting, search, notifications), a hero built from the admin banners, a compact
 * category row, then the Flutter sections in their original order:
 * Top Favorites · Features · Just In · Faith Hits · Praise Clips · Series · Streaming Record.
 */
export function HomeScreen({ navigation }: TabScreenProps<'Home'>) {
  const { width: screen } = useWindowDimensions();
  const bottom = useBottomSpace();
  const feed = useHomeFeed();
  const hosts = useBroadcasters();
  const records = usePreviousLives();
  const { play } = useMediaActions();
  const data = feed.data;
  // Praise Clips come from the live clip feed (first page); the rest of home is still mock.
  const clipFeed = useGetClipsInfiniteQuery();
  const clips = clipFeed.data?.pages[0]?.result ?? [];

  /** Hero slides come from the admin banners; each links to a podcast or a series. */
  const hero = useMemo<HeroSlide[]>(() => {
    if (!data) return [];
    const all = [...data.newestPodcasts, ...data.popularPodcasts, ...data.sermons];
    return data.banners.map((b): HeroSlide => {
      const [, kind, id] = b.redirect_url?.match(/^preachradio:\/\/(podcast|album)\/(.+)$/) ?? [];
      const podcast = kind === 'podcast' ? all.find((p) => p._id === id) : undefined;
      if (podcast) {
        return {
          id: b._id,
          image: b.banner_url,
          eyebrow: 'Featured',
          title: podcast.title,
          subtitle: ownerName(podcast),
          cta: podcast.mediaType === 'video' ? 'Watch now' : 'Play now',
          podcast,
        };
      }
      const album = kind === 'album' ? data.albums.find((a) => a._id === id) : undefined;
      if (album) {
        return { id: b._id, image: b.banner_url, eyebrow: 'New series', title: album.name, subtitle: `${album.podcasts.length} messages`, cta: 'Open', albumId: album._id };
      }
      return { id: b._id, image: b.banner_url, eyebrow: 'Featured', title: 'Preach Radio', cta: 'Open', url: b.redirect_url };
    });
  }, [data]);

  const openHero = useCallback(
    (item: HeroItem) => {
      const slide = hero.find((h) => h.id === item.id);
      if (slide?.podcast) play(slide.podcast);
      else if (slide?.albumId) navigation.navigate('Album', { id: slide.albumId });
      else if (slide?.url) void Linking.openURL(slide.url);
    },
    [hero, navigation, play],
  );

  const features = useMemo<BannerItem[]>(() => (data?.albums ?? []).map((a) => ({ id: a._id, image: a.cover_image, title: a.name })), [data?.albums]);

  const coverFor = useCallback((ownerId?: string) => hosts.data?.find((h) => h.id === ownerId)?.cover, [hosts.data]);

  const onRefresh = useCallback(() => {
    void feed.refetch();
    void hosts.refetch();
    void records.refetch();
    void clipFeed.refetch();
  }, [feed, hosts, records, clipFeed]);

  return (
    <Screen>
      {/* Faint accent glow behind the header and the top of the hero */}
      <LinearGradient
        colors={['rgba(230,167,168,0.14)', 'rgba(230,167,168,0.04)', 'transparent']}
        locations={[0, 0.5, 1]}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 260 }}
        pointerEvents="none"
      />
      <HomeHeader />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottom }}
        refreshControl={<RefreshControl refreshing={feed.isFetching} onRefresh={onRefresh} tintColor={colors.white} />}
      >
        {feed.isLoading ? (
          <HomeSkeleton />
        ) : feed.isError || !data ? (
          <ErrorState onRetry={() => void feed.refetch()} />
        ) : (
          <>
            {hero.length ? (
              <View className="mt-1">
                <HeroBanner items={hero} onPress={openHero} />
              </View>
            ) : null}

            {data.categories.length ? (
              <View className="mt-5">
                <Rail
                  data={data.categories}
                  keyExtractor={(c) => c._id}
                  gap={8}
                  renderItem={({ item }) => <CategoryPill category={item} onPress={(c) => navigation.navigate('Category', { id: c._id })} />}
                />
              </View>
            ) : null}

            {hosts.data?.length ? (
              <View className="mt-6">
                <SectionHeader title="Top Favorites" onAction={() => navigation.navigate('Stations')} />
                <TopFavorites hosts={hosts.data} />
              </View>
            ) : null}

            {features.length ? (
              <View className="mt-5">
                <SectionHeader title="Features" onAction={() => navigation.navigate('Albums')} />
                <BannerPager items={features} badge="Album" buttonLabel="Play now" onPress={(i) => navigation.navigate('Album', { id: i.id })} />
              </View>
            ) : null}

            <View className="mt-5">
              <SectionHeader title="Just In" onAction={() => navigation.navigate('PodcastList', { title: 'Just In', query: { type: 'episode', sort: 'newest' } })} />
              <Rail data={data.newestPodcasts} keyExtractor={podcastKey} gap={8} renderItem={({ item }) => <MusicCard podcast={item} onPress={(p) => play(p, data.newestPodcasts)} />} />
            </View>

            <View className="mt-5">
              <SectionHeader title="Faith Hits" onAction={() => navigation.navigate('PodcastList', { title: 'Faith Hits', query: { type: 'episode', sort: 'popular' } })} />
              <Rail data={data.popularPodcasts} keyExtractor={podcastKey} gap={8} renderItem={({ item }) => <MusicCard podcast={item} onPress={(p) => play(p, data.popularPodcasts)} />} />
            </View>

            {clips.length ? (
              <View className="mt-5">
                <SectionHeader title="Praise Clips" onAction={() => navigation.navigate('PodcastList', { title: 'Praise Clips', query: { type: 'clip' } })} />
                <Rail data={clips} keyExtractor={podcastKey} gap={6} renderItem={({ item }) => <ReelThumb podcast={item} onPress={(p) => navigation.navigate('ReelsViewer', { startId: p._id })} />} />
              </View>
            ) : null}

            {data.albums.length ? (
              <View className="mt-5">
                <SectionHeader title="Series" onAction={() => navigation.navigate('Albums')} />
                <Rail
                  data={data.albums}
                  keyExtractor={(a) => a._id}
                  gap={8}
                  renderItem={({ item, index }) => (
                    <SeriesCard album={item} width={index === 0 ? screen - GUTTER * 2 : screen / 3} onPress={(a) => navigation.navigate('Album', { id: a._id })} />
                  )}
                />
              </View>
            ) : null}

            {records.data?.length ? (
              <View className="mt-5">
                <SectionHeader title="Streaming Record" />
                <Rail
                  data={records.data}
                  keyExtractor={(r) => r._id}
                  gap={12}
                  renderItem={({ item }) => (
                    <StreamingRecordCard room={item} cover={coverFor(item.station ?? item.creator)} onPress={(r) => navigation.navigate('RecordPlayer', { roomId: r._id })} />
                  )}
                />
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}
