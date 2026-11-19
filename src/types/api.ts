/** Every backend response is wrapped in this envelope. */
export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

/** `QueryBuilder.countTotal()` meta block. */
export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPage: number;
}

export interface Paginated<T> {
  meta: PageMeta;
  result: T[];
}

export interface ListParams {
  page?: number;
  limit?: number;
  searchTerm?: string;
  sort?: string;
}

/** Normalised error thrown by the API client and the mock layer alike. */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /** 401 = token missing / invalid / expired. 403 never logs the user out. */
  get isUnauthorized(): boolean {
    return this.status === 401;
  }
}
