import { useNavigation } from '@react-navigation/native';
import { useCallback } from 'react';
import { usePlayerStore } from '@/store/playerStore';
import type { Broadcaster } from '@/types/broadcaster';
import type { Podcast } from '@/types/models';
import { isClip } from '@/utils/podcast';

/**
 * One place that decides where content opens, as in the Flutter app:
 * clips → the vertical reels viewer · every other podcast (audio or video) → the player.
 */
export const useMediaActions = () => {
  const navigation = useNavigation();
  const playPodcast = usePlayerStore((s) => s.playPodcast);
  const playLive = usePlayerStore((s) => s.playLive);

  const play = useCallback(
    (podcast: Podcast, queue?: Podcast[]) => {
      if (isClip(podcast)) {
        navigation.navigate('ReelsViewer', { startId: podcast._id, ids: queue?.filter(isClip).map((p) => p._id) });
        return;
      }
      playPodcast(podcast, queue?.filter((p) => !isClip(p)));
      navigation.navigate('AudioPlayer');
    },
    [navigation, playPodcast],
  );

  const openDetail = useCallback(
    (podcast: Podcast) => {
      if (isClip(podcast)) navigation.navigate('ReelsViewer', { startId: podcast._id });
      else navigation.navigate('PodcastDetail', { id: podcast._id });
    },
    [navigation],
  );

  const tuneIn = useCallback(
    (broadcaster: Broadcaster) => {
      playLive(broadcaster);
      navigation.navigate('RadioPlayer');
    },
    [navigation, playLive],
  );

  return { play, openDetail, tuneIn };
};
