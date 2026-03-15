/**
 * Typed SSE event received from the server.
 *
 * Maps to the server-side event envelope: each SSE event carries a type,
 * a server timestamp, and an event-specific payload. The generic parameter
 * allows feature services to narrow the payload type for their domain.
 *
 * @typeParam T - The shape of the event payload. Defaults to `unknown`.
 */
export interface SseEvent<T = unknown> {
  /** Event type (e.g., 'stream.token', 'processing.stage'). */
  type: string;
  /** ISO 8601 timestamp from the server. */
  timestamp: string;
  /** Event-specific payload. */
  payload: T;
}
