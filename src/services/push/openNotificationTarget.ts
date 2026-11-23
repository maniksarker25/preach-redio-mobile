import { Alert } from 'react-native';
import { navigationRef, whenNavigationReady } from '@/app/navigation/navigationRef';
import { store } from '@/store';
import { reelsApi } from '@/store/api/reelsApi';
import { usePlayerStore } from '@/store/playerStore';
import type { NotificationData } from '@/types/models';
import { isClip } from '@/utils/podcast';

/**
 * Open what a notification points at — used by the Notifications list and by push taps
 * (including a cold start, which waits for navigation and the session).
 * PODCAST → reels (clip) or the player (episode) · FEEDBACK → support · CREATOR → profile · else the inbox.
 */
export const openNotificationTarget = async (data: NotificationData | undefined, { fromPush = false } = {}) => {
  if (!(await whenNavigationReady())) return;
  const entityId = data?.entityId ?? undefined;

  switch (data?.entity) {
    case 'PODCAST': {
      if (!entityId) break;
      const request = store.dispatch(reelsApi.endpoints.getClip.initiate(entityId));
      try {
        const podcast = await request.unwrap();
        if (isClip(podcast)) navigationRef.navigate('ReelsViewer', { startId: podcast._id });
        else {
          usePlayerStore.getState().playPodcast(podcast);
          navigationRef.navigate('AudioPlayer');
        }
      } catch {
        Alert.alert('Not available', 'This message is no longer available.');
      } finally {
        request.unsubscribe();
      }
      return;
    }
    case 'FEEDBACK':
      navigationRef.navigate('Support');
      return;
    case 'CREATOR':
      navigationRef.navigate('Main', { screen: 'Profile' });
      return;
    default:
      break;
  }
  // Nothing specific to open: a push lands on the inbox; a tap inside the inbox stays there.
  if (fromPush) navigationRef.navigate('Notifications');
};
