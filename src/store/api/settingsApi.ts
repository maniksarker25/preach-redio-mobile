import { endpoints } from '@/services/api/endpoints';
import type { ContentPage, ContentPageKey, FaqItem, SupportContact } from '@/types/models';
import { baseApi } from './baseApi';

/** Raw CMS row: one HTML `description`, or `null` until the admin publishes the page. */
interface CmsRow {
  _id: string;
  description: string;
  updatedAt: string;
}

const PAGES: Record<ContentPageKey, { url: string; title: string }> = {
  about: { url: endpoints.content.about, title: 'About Us' },
  terms: { url: endpoints.content.terms, title: 'Terms of Services' },
  privacy: { url: endpoints.content.privacy, title: 'Privacy Policy' },
};

/**
 * Settings → Support / Legal — live backend (content is edited in the dashboard).
 *
 * - `getContentPage`     GET  /manage/get-about-us | get-terms-conditions | get-privacy-policy   (`null` = not published)
 * - `getFaqs`            GET  /manage/get-faq
 * - `getSupportContact`  GET  /manage/get-contact-us
 * - `sendFeedback`       POST /feedback/create-feedback  { name, description }   (shows in the dashboard)
 */
export const settingsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getContentPage: build.query<ContentPage | null, ContentPageKey>({
      query: (key) => PAGES[key].url,
      transformResponse: (row: CmsRow | null, _meta, key): ContentPage | null => (row?.description?.trim() ? { key, title: PAGES[key].title, body: row.description, updatedAt: row.updatedAt } : null),
      providesTags: (_r, _e, key) => [{ type: 'Content', id: key }],
      keepUnusedDataFor: 600,
    }),
    getFaqs: build.query<FaqItem[], void>({
      query: () => endpoints.content.faq,
      transformResponse: (rows: FaqItem[] | null) => (rows ?? []).filter((f) => f.question?.trim()),
      providesTags: [{ type: 'Content', id: 'FAQ' }],
      keepUnusedDataFor: 600,
    }),
    getSupportContact: build.query<SupportContact | null, void>({
      query: () => endpoints.content.contact,
      providesTags: [{ type: 'Content', id: 'CONTACT' }],
      keepUnusedDataFor: 600,
    }),
    sendFeedback: build.mutation<unknown, { name: string; description: string }>({
      query: (body) => ({ url: endpoints.feedback.create, method: 'POST', body }),
    }),
  }),
});

export const { useGetContentPageQuery, useGetFaqsQuery, useGetSupportContactQuery, useSendFeedbackMutation } = settingsApi;
