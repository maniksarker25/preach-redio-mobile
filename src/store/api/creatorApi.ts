import { endpoints } from '@/services/api/endpoints';
import type { Paginated } from '@/types/api';
import type { PresignResult, UploadCategory, UploadFileCategory } from '@/types/upload';
import { baseApi } from './baseApi';

interface RawCategory {
  _id: string;
  name: string;
  isDeleted?: boolean;
  subcategories?: { _id: string; name: string; isDeleted?: boolean }[];
}

/**
 * Creator studio — live backend.
 *
 * - `getUploadCategories` GET /category/all-categories (each with its sub-categories)
 * - `getPresignedUrl`     POST /generate-presigned-url  → S3 PUT URL (valid 60 s)
 *
 * Create / my podcasts / delete live in contentApi (same cache tags as the rest of the app).
 */
export const creatorApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getUploadCategories: build.query<UploadCategory[], void>({
      query: () => ({ url: endpoints.category.all, params: { limit: 100 } }),
      // Publishing needs a sub-category, so categories without one can't be offered.
      transformResponse: (res: Paginated<RawCategory>) =>
        res.result
          .filter((c) => !c.isDeleted)
          .map((c) => ({ _id: c._id, name: c.name, subcategories: (c.subcategories ?? []).filter((s) => !s.isDeleted).map((s) => ({ _id: s._id, name: s.name })) }))
          .filter((c) => c.subcategories.length > 0),
      keepUnusedDataFor: 600,
      providesTags: ['Category'],
    }),

    getPresignedUrl: build.mutation<PresignResult, { fileType: string; fileCategory: UploadFileCategory }>({
      query: (body) => ({ url: endpoints.upload.presign, method: 'POST', body }),
    }),
  }),
});

export const { useGetUploadCategoriesQuery, useGetPresignedUrlMutation } = creatorApi;
