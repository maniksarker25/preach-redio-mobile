import { endpoints } from '@/services/api/endpoints';
import type { Paginated } from '@/types/api';
import type { AppNotification } from '@/types/models';
import { baseApi } from './baseApi';

export const NOTIFICATIONS_PAGE_SIZE = 20;

/**
 * Notifications — live backend (own + broadcasts; `isSeen` is per user).
 *
 * - `getNotifications`            GET    /notification/get-notifications?page=   (infinite, newest first)
 * - `getUnseenNotificationCount`  GET    /notification/unseen-count               (home bell badge)
 * - `markNotificationsSeen`       PATCH  /notification/see-notifications          (all; optimistic)
 * - `markNotificationRead`        PATCH  /notification/see-notification/:id       (one; optimistic)
 * - `deleteNotification`          DELETE /notification/delete-notification/:id    (optimistic)
 * - `registerPushDevice` / `unregisterPushDevice`  POST /device/register | /device/unregister
 */
export const notificationsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getNotifications: build.infiniteQuery<Paginated<AppNotification>, void, number>({
      infiniteQueryOptions: {
        initialPageParam: 1,
        getNextPageParam: (last) => (last.meta.page < last.meta.totalPage ? last.meta.page + 1 : undefined),
      },
      query: ({ pageParam }) => ({ url: endpoints.notification.mine, params: { page: pageParam, limit: NOTIFICATIONS_PAGE_SIZE } }),
      providesTags: [{ type: 'Notification', id: 'LIST' }],
    }),

    getUnseenNotificationCount: build.query<number, void>({
      query: () => endpoints.notification.unseenCount,
      transformResponse: (res: { count: number }) => res.count ?? 0,
      providesTags: [{ type: 'Notification', id: 'COUNT' }],
    }),

    markNotificationsSeen: build.mutation<unknown, void>({
      query: () => ({ url: endpoints.notification.markSeen, method: 'PATCH' }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        const patches = [
          dispatch(
            notificationsApi.util.updateQueryData('getNotifications', undefined, (draft) => {
              for (const page of draft.pages) for (const n of page.result) n.isSeen = true;
            }),
          ),
          dispatch(notificationsApi.util.updateQueryData('getUnseenNotificationCount', undefined, () => 0)),
        ];
        try {
          await queryFulfilled;
        } catch {
          patches.forEach((p) => p.undo());
        }
      },
    }),

    /** Mark one read (opened from the list or a push). Optimistic. */
    markNotificationRead: build.mutation<unknown, string>({
      query: (id) => ({ url: endpoints.notification.markOneSeen(id), method: 'PATCH' }),
      async onQueryStarted(id, { dispatch, getState, queryFulfilled }) {
        const listed = notificationsApi.endpoints.getNotifications.select(undefined)(getState() as never);
        const wasUnread = listed.data?.pages.some((p) => p.result.some((n) => n._id === id && !n.isSeen)) ?? true;
        const patches = [
          dispatch(
            notificationsApi.util.updateQueryData('getNotifications', undefined, (draft) => {
              for (const page of draft.pages) for (const n of page.result) if (n._id === id) n.isSeen = true;
            }),
          ),
          ...(wasUnread ? [dispatch(notificationsApi.util.updateQueryData('getUnseenNotificationCount', undefined, (c) => Math.max(0, c - 1)))] : []),
        ];
        try {
          await queryFulfilled;
        } catch {
          patches.forEach((p) => p.undo());
        }
      },
    }),

    /** This install's OneSignal subscription id → the signed-in account (idempotent). */
    registerPushDevice: build.mutation<unknown, { playerId: string; platform: 'ios' | 'android' | 'web' }>({
      query: (body) => ({ url: endpoints.device.register, method: 'POST', body }),
    }),
    /** Before logout: stop this account's pushes to this install. */
    unregisterPushDevice: build.mutation<unknown, { playerId: string }>({
      query: (body) => ({ url: endpoints.device.unregister, method: 'POST', body }),
    }),

    deleteNotification: build.mutation<unknown, AppNotification>({
      query: (n) => ({ url: endpoints.notification.remove(n._id), method: 'DELETE' }),
      async onQueryStarted(n, { dispatch, queryFulfilled }) {
        const patches = [
          dispatch(
            notificationsApi.util.updateQueryData('getNotifications', undefined, (draft) => {
              for (const page of draft.pages) {
                const before = page.result.length;
                page.result = page.result.filter((x) => x._id !== n._id);
                if (page.result.length < before) page.meta.total = Math.max(0, page.meta.total - 1);
              }
            }),
          ),
          ...(n.isSeen ? [] : [dispatch(notificationsApi.util.updateQueryData('getUnseenNotificationCount', undefined, (c) => Math.max(0, c - 1)))]),
        ];
        try {
          await queryFulfilled;
        } catch {
          patches.forEach((p) => p.undo());
        }
      },
    }),
  }),
});

export const { useGetNotificationsInfiniteQuery, useGetUnseenNotificationCountQuery, useMarkNotificationsSeenMutation, useMarkNotificationReadMutation, useDeleteNotificationMutation } =
  notificationsApi;

export const flattenNotifications = (pages: Paginated<AppNotification>[] | undefined): AppNotification[] => {
  const seen = new Set<string>();
  const out: AppNotification[] = [];
  for (const page of pages ?? []) {
    for (const n of page.result) {
      if (seen.has(n._id)) continue;
      seen.add(n._id);
      out.push(n);
    }
  }
  return out;
};
