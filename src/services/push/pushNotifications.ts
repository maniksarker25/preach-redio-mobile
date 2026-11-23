import { Platform } from 'react-native';
import type { NotificationClickEvent, NotificationWillDisplayEvent, PushSubscriptionChangedState } from 'react-native-onesignal';
import { env } from '@/app/config/env';
import { store } from '@/store';
import { notificationsApi } from '@/store/api/notificationsApi';
import type { NotificationData, NotificationEntity } from '@/types/models';
import { IS_NATIVE_BUILD } from '@/utils/runtime';
import { openNotificationTarget } from './openNotificationTarget';

type OneSignalApi = (typeof import('react-native-onesignal'))['OneSignal'];

/**
 * OneSignal push for the signed-in account.
 *
 * Off (no-ops) in Expo Go — the SDK is a native module — and when `EXPO_PUBLIC_ONESIGNAL_APP_ID` is
 * empty. In-app notifications work either way.
 *
 * Flow: init once at startup (so a tap that cold-starts the app is caught) → after sign-in:
 * `login(profileId)`, ask permission once, register this install's subscription id with the backend
 * (`/device/register`, again whenever OneSignal rotates it) → before sign-out: `/device/unregister`, `logout()`.
 */
let oneSignal: OneSignalApi | null | undefined;
const getOneSignal = (): OneSignalApi | null => {
  if (oneSignal !== undefined) return oneSignal;
  if (!IS_NATIVE_BUILD || !env.oneSignalAppId) return (oneSignal = null);
  try {
    // Loaded lazily: importing it in Expo Go would crash (no native module).
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    oneSignal = (require('react-native-onesignal') as typeof import('react-native-onesignal')).OneSignal;
  } catch {
    oneSignal = null;
  }
  return oneSignal;
};

export const isPushAvailable = () => getOneSignal() !== null;

const platform = (): 'ios' | 'android' | 'web' => (Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web');

/** Signed-in profile; null when signed out. Registration only happens while set. */
let currentProfileId: string | null = null;
/** `${profileId}:${subscriptionId}` last sent to the backend (avoid re-sending on every render). */
let registeredKey: string | null = null;

const registerSubscription = async (subscriptionId: string | null | undefined) => {
  if (!subscriptionId || !currentProfileId) return;
  const key = `${currentProfileId}:${subscriptionId}`;
  if (registeredKey === key) return;
  const request = store.dispatch(notificationsApi.endpoints.registerPushDevice.initiate({ playerId: subscriptionId, platform: platform() }));
  try {
    await request.unwrap();
    registeredKey = key;
  } catch {
    // Retried on the next launch / sign-in / subscription change.
  } finally {
    request.reset();
  }
};

const refreshInbox = () =>
  store.dispatch(
    notificationsApi.util.invalidateTags([
      { type: 'Notification', id: 'LIST' },
      { type: 'Notification', id: 'COUNT' },
    ]),
  );

const ENTITIES = new Set<NotificationEntity>(['PODCAST', 'LIVE_ROOM', 'FEEDBACK', 'CREATOR', 'REPORT', 'NONE']);
/** The backend puts { notificationId, type, entity, entityId } in the push's additional data. */
const readPushData = (raw: unknown): { notificationId?: string; target: NotificationData } => {
  const d = (raw ?? {}) as Record<string, unknown>;
  const entity = typeof d.entity === 'string' && ENTITIES.has(d.entity as NotificationEntity) ? (d.entity as NotificationEntity) : 'NONE';
  return {
    notificationId: typeof d.notificationId === 'string' ? d.notificationId : undefined,
    target: { entity, entityId: typeof d.entityId === 'string' ? d.entityId : null },
  };
};

let initialized = false;
/** Call once at app start (before navigation mounts). */
export const initPushNotifications = () => {
  const os = getOneSignal();
  if (!os || initialized) return;
  initialized = true;
  os.initialize(env.oneSignalAppId);

  os.Notifications.addEventListener('click', (event: NotificationClickEvent) => {
    const { notificationId, target } = readPushData(event.notification.additionalData);
    if (notificationId) {
      const request = store.dispatch(notificationsApi.endpoints.markNotificationRead.initiate(notificationId));
      void request
        .unwrap()
        .catch(() => undefined)
        .finally(() => request.reset());
    }
    refreshInbox();
    void openNotificationTarget(target, { fromPush: true });
  });

  // In the foreground: still show the banner, and refresh the inbox + badge.
  os.Notifications.addEventListener('foregroundWillDisplay', (event: NotificationWillDisplayEvent) => {
    refreshInbox();
    event.getNotification().display();
  });

  // OneSignal can create / rotate the subscription id at any time.
  os.User.pushSubscription.addEventListener('change', (state: PushSubscriptionChangedState) => {
    if (state.current.id && state.current.optedIn) void registerSubscription(state.current.id);
  });
};

/** After sign-in (and on every launch while signed in). */
export const onPushSignedIn = async (profileId: string) => {
  const os = getOneSignal();
  if (!os) return;
  currentProfileId = profileId;
  os.login(profileId);
  try {
    // Asks once; afterwards this resolves with the current choice (no prompt).
    if (await os.Notifications.canRequestPermission()) await os.Notifications.requestPermission(false);
  } catch {
    /* the user can enable it later in Settings */
  }
  await registerSubscription(await os.User.pushSubscription.getIdAsync().catch(() => null));
};

/**
 * Before an explicit sign-out (the token must still be valid): stop this account's pushes on this
 * install. Bounded wait, so a slow network never blocks signing out.
 */
export const unregisterPushDevice = async (timeoutMs = 3000) => {
  const os = getOneSignal();
  if (!os) return;
  const id = await os.User.pushSubscription.getIdAsync().catch(() => null);
  if (id) {
    const request = store.dispatch(notificationsApi.endpoints.unregisterPushDevice.initiate({ playerId: id }));
    await Promise.race([request.unwrap().catch(() => undefined), new Promise((r) => setTimeout(r, timeoutMs))]);
    request.reset();
  }
  onPushSignedOut();
};

/** Session ended (sign-out, expiry, account deleted). A later sign-in re-registers the install. */
export const onPushSignedOut = () => {
  const os = getOneSignal();
  currentProfileId = null;
  registeredKey = null;
  if (os) os.logout();
};
