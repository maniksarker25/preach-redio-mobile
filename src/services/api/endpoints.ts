/**
 * Backend routes used by the app (preach-radio-backend/src/app/routes).
 * Not called yet — repositories use mocks — but kept here so the HTTP
 * repositories can be written against a single list.
 */
export const endpoints = {
  auth: {
    login: '/auth/login',
    oauthLogin: '/auth/oauth-login',
    resendResetCode: '/auth/resend-reset-code',
    register: '/user/register-user',
    verifyCode: '/user/verify-code',
    resendCode: '/user/resend-verify-code',
    forgotPassword: '/auth/forget-password',
    verifyResetOtp: '/auth/verify-reset-otp',
    resetPassword: '/auth/reset-password',
    changePassword: '/auth/change-password',
    refreshToken: '/auth/refresh-token',
  },
  user: {
    me: '/user/get-my-profile',
    updateProfile: '/normal-user/update-profile',
    deleteAccount: '/user/delete-account',
  },
  podcast: {
    home: '/podcast/get-home-data',
    all: '/podcast/all', // ?type=clip|episode&sort=popular&category=&subCategory=&searchTerm=&page=&limit=
    single: (id: string) => `/podcast/get-single/${id}`,
    myPodcasts: '/podcast/my-podcasts',
    create: '/podcast/create',
    update: (id: string) => `/podcast/update/${id}`,
    remove: (id: string) => `/podcast/delete-podcast/${id}`,
    globalSearch: '/podcast/global-search',
    view: (id: string) => `/podcast/view/${id}`,
    feed: '/podcast/get-podcast-feed',
  },
  like: { toggle: (podcastId: string) => `/podcast/like-unlike/${podcastId}` },
  bookmark: { toggle: (podcastId: string) => `/bookmark/add-delete-bookmark/${podcastId}`, mine: '/bookmark/my-bookmarks' },
  comment: {
    list: (podcastId: string) => `/comment/get-podcast-comments/${podcastId}`,
    create: '/comment/create',
    reply: '/comment/create-reply',
    replies: (commentId: string) => `/comment/get-replies/${commentId}`,
    like: (commentId: string) => `/comment/like-unlike-comment/${commentId}`,
    update: (commentId: string) => `/comment/update-comment/${commentId}`,
    remove: (commentId: string) => `/comment/delete-comment/${commentId}`,
  },
  /** Raw (non-enveloped) `{ uploadURL, fileName }`; the URL is valid for 60 s. */
  upload: { presign: '/generate-presigned-url' },
  watchHistory: { mine: '/watch-history/get-all' },
  album: { all: '/album/all-albums', single: (id: string) => `/album/get-single/${id}` },
  playlist: {
    mine: '/playlist/my-playlists',
    single: (id: string) => `/playlist/get-single/${id}`,
    create: '/playlist/create',
    update: (id: string) => `/playlist/update/${id}`,
    remove: (id: string) => `/playlist/delete/${id}`,
  },
  category: { all: '/category/all-categories' },
  subCategory: { all: '/sub-category/all-subcategories' },
  station: { get: '/station/get-station' },
  creator: {
    all: '/creator/get-all-creators',
    top: '/creator/get-top-creators',
    single: (id: string) => `/creator/single-creator/${id}`,
  },
  live: {
    createRoom: '/live-stream/create-streaming-room',
    joinToken: '/live-stream/get-join-token',
    myRoom: '/live-stream/get-my-live-room',
    end: (id: string) => `/live-stream/end-live/${id}`,
    previous: '/live-stream/get-previous-live',
  },
  notification: { mine: '/notification/get-notifications', markSeen: '/notification/see-notifications' },
  banner: { active: '/banner/get-all' },
  content: {
    about: '/manage/get-about-us',
    terms: '/manage/get-terms-conditions',
    privacy: '/manage/get-privacy-policy',
    faq: '/manage/get-faq',
  },
  report: { create: '/report/create' },
  s3: { presignedUrl: '/generate-presigned-url' },
} as const;
