/**
 * F001 API envelope types.
 *
 * All API responses follow the F001 envelope format. These interfaces
 * are used by ApiService for automatic unwrapping so feature services
 * receive typed domain objects directly.
 */

/** Standard API response envelope wrapping a single resource. */
export interface ApiResponse<T> {
  data: T;
  meta: { request_id: string };
}

/** Paginated API response envelope wrapping a collection. */
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    request_id: string;
    pagination: PaginationMeta;
  };
}

/** Pagination metadata returned in paginated responses. */
export interface PaginationMeta {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
}

/** Unwrapped paginated result returned by ApiService.getPaginated(). */
export interface PaginatedResult<T> {
  data: T[];
  pagination: PaginationMeta;
}

/** Standard API error response envelope. */
export interface ErrorEnvelope {
  error: {
    code: string;
    message: string;
    field?: string;
  };
}
