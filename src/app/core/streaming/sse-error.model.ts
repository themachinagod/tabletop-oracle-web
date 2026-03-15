/**
 * Classification of SSE connection errors.
 *
 * - `network`: Transient network failure. The service retries automatically
 *   with exponential backoff. Emitted only after all retries are exhausted.
 * - `stale`: No events (including heartbeats) received within the stale
 *   timeout window. Treated as a network failure — retries apply.
 * - `auth`: Authentication failure (401). Terminal — no retries.
 * - `not-found`: Resource not found (404). Terminal — no retries.
 * - `parse`: Failed to parse an SSE event payload. Terminal — no retries.
 */
export type SseErrorKind = 'network' | 'stale' | 'auth' | 'not-found' | 'parse';

/**
 * Structured SSE error with enough context for feature services to
 * display appropriate UI feedback (e.g., "connection lost" banner,
 * login redirect, or "resource not found" message).
 */
export class SseError extends Error {
  /** Error classification for programmatic handling. */
  readonly kind: SseErrorKind;

  /** The SSE endpoint URL that produced the error. */
  readonly url: string;

  /** Whether this error type is terminal (no retries attempted). */
  readonly terminal: boolean;

  /** Number of reconnection attempts made before this error (network/stale only). */
  readonly attempts: number;

  /**
   * @param kind - Error classification.
   * @param url - The SSE endpoint URL.
   * @param message - Human-readable error description.
   * @param attempts - Reconnection attempts made (0 for terminal errors).
   */
  constructor(kind: SseErrorKind, url: string, message: string, attempts = 0) {
    super(message);
    this.name = 'SseError';
    this.kind = kind;
    this.url = url;
    this.terminal = kind === 'auth' || kind === 'not-found' || kind === 'parse';
    this.attempts = attempts;
  }
}
