/** Standard API response envelope. */
export interface DataEnvelope<T> {
  data: T;
}

/** Paginated list response envelope. */
export interface ListEnvelope<T> {
  data: T[];
  meta: PaginationMeta;
}

/** Pagination metadata. */
export interface PaginationMeta {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
}

/** Standard API error response. */
export interface ErrorEnvelope {
  error: {
    code: string;
    message: string;
    field?: string;
  };
}
