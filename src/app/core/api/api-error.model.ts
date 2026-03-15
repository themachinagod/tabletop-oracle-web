/**
 * Typed API error matching the F001 error response format.
 *
 * Used by the AuthInterceptor and ApiService to provide structured
 * error information to consuming components and services.
 */
export interface ApiError {
  /** Machine-readable error code (e.g., 'VALIDATION_ERROR', 'NOT_FOUND'). */
  code: string;

  /** Human-readable error message. */
  message: string;

  /** Additional error context (e.g., validation field details). */
  details?: Record<string, unknown>;
}
