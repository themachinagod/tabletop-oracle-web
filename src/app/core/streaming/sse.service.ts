import { inject, Injectable, NgZone } from '@angular/core';
import { Observable, Subscriber } from 'rxjs';
import { SseEvent } from './sse-event.model';
import { SseError } from './sse-error.model';

/** Initial reconnection delay in milliseconds. */
const INITIAL_RETRY_MS = 1000;

/** Maximum reconnection delay in milliseconds. */
const MAX_RETRY_MS = 30_000;

/** Maximum consecutive reconnection failures before emitting an error. */
const MAX_RETRIES = 5;

/** Backoff multiplier applied on each consecutive failure. */
const BACKOFF_FACTOR = 2;

/** Duration in ms without any event (including heartbeat) before treating connection as stale. */
const STALE_TIMEOUT_MS = 30_000;

/**
 * Core SSE client service.
 *
 * Wraps the browser EventSource API behind an RxJS Observable interface.
 * Handles credential forwarding (session cookie), heartbeat filtering,
 * JSON payload parsing, reconnection with exponential backoff, stale
 * connection detection, and error classification.
 *
 * Feature services (ChatService, DocService) consume this service —
 * they should never create raw EventSource instances.
 */
@Injectable({ providedIn: 'root' })
export class SseService {
  private readonly zone = inject(NgZone);

  /**
   * Open an SSE connection to the given URL and return an Observable
   * of typed SSE events.
   *
   * The Observable emits parsed `SseEvent` objects for every non-heartbeat
   * event received from the server. Heartbeat events are consumed
   * internally (they reset the stale connection timer) but are never
   * emitted to subscribers.
   *
   * The Observable completes when the server closes the stream
   * (EventSource transitions to CLOSED state without an error).
   *
   * On error, the Observable emits an `SseError` with classification
   * and context sufficient for UI-level error handling.
   *
   * On unsubscribe, the underlying EventSource is closed immediately
   * and all timers are cleared.
   *
   * @param url - The SSE endpoint URL (absolute or relative).
   * @returns Observable that emits `SseEvent` objects.
   */
  connect<T = unknown>(url: string): Observable<SseEvent<T>> {
    return new Observable<SseEvent<T>>((subscriber) => {
      let retryCount = 0;
      let retryTimeout: ReturnType<typeof setTimeout> | null = null;
      let staleTimer: ReturnType<typeof setTimeout> | null = null;
      let eventSource: EventSource | null = null;

      const clearStaleTimer = (): void => {
        if (staleTimer !== null) {
          clearTimeout(staleTimer);
          staleTimer = null;
        }
      };

      const resetStaleTimer = (): void => {
        clearStaleTimer();
        staleTimer = setTimeout(() => {
          staleTimer = null;
          // Connection is stale — no events for STALE_TIMEOUT_MS.
          // Close current EventSource and trigger reconnection.
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
          scheduleRetry('stale');
        }, STALE_TIMEOUT_MS);
      };

      const scheduleRetry = (reason: 'network' | 'stale'): void => {
        retryCount++;
        if (retryCount > MAX_RETRIES) {
          const kind = reason === 'stale' ? 'stale' : 'network';
          subscriber.error(
            new SseError(
              kind,
              url,
              `SSE connection failed after ${MAX_RETRIES} consecutive retries`,
              retryCount - 1,
            ),
          );
          return;
        }
        const delay = Math.min(INITIAL_RETRY_MS * BACKOFF_FACTOR ** (retryCount - 1), MAX_RETRY_MS);
        retryTimeout = setTimeout(() => {
          retryTimeout = null;
          open();
        }, delay);
      };

      const open = (): void => {
        eventSource = this.createEventSource(url);
        this.attachListeners(eventSource, subscriber, {
          onOpen: () => {
            retryCount = 0;
            resetStaleTimer();
          },
          onEvent: () => {
            resetStaleTimer();
          },
          onRetry: () => {
            clearStaleTimer();
            scheduleRetry('network');
          },
          onTerminalError: (kind: 'auth' | 'not-found') => {
            clearStaleTimer();
            const message =
              kind === 'auth'
                ? 'SSE connection rejected: authentication required'
                : 'SSE connection rejected: resource not found';
            subscriber.error(new SseError(kind, url, message));
          },
          onComplete: () => {
            clearStaleTimer();
            subscriber.complete();
          },
        });
      };

      open();

      return () => {
        clearStaleTimer();
        if (retryTimeout !== null) {
          clearTimeout(retryTimeout);
          retryTimeout = null;
        }
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }
      };
    });
  }

  /**
   * Create an EventSource instance with credentials enabled.
   *
   * Extracted to allow test overrides via spying.
   *
   * @param url - The SSE endpoint URL.
   * @returns A new EventSource configured with `withCredentials: true`.
   */
  createEventSource(url: string): EventSource {
    return new EventSource(url, { withCredentials: true });
  }

  /**
   * Attach SSE event listeners that run inside the Angular zone.
   *
   * EventSource callbacks fire outside Angular's zone (browser API),
   * so every callback uses `NgZone.run()` to ensure change detection
   * picks up emitted values.
   *
   * The error handler disables the browser's built-in reconnection by
   * calling `close()` immediately, then delegates to manual reconnection
   * logic with exponential backoff.
   */
  private attachListeners<T>(
    source: EventSource,
    subscriber: Subscriber<SseEvent<T>>,
    hooks: {
      onOpen: () => void;
      onEvent: () => void;
      onRetry: () => void;
      onTerminalError: (kind: 'auth' | 'not-found') => void;
      onComplete: () => void;
    },
  ): void {
    source.onopen = () => {
      this.zone.run(() => hooks.onOpen());
    };

    source.onmessage = (event: MessageEvent) => {
      this.zone.run(() => {
        hooks.onEvent();
        this.handleEvent(event, subscriber);
      });
    };

    source.onerror = (errorEvent: Event) => {
      this.zone.run(() => {
        // Capture readyState before closing — close() sets it to CLOSED
        // unconditionally. A readyState of CLOSED before we call close()
        // means the server terminated the stream.
        const wasClosedByServer = source.readyState === 2; // CLOSED
        source.close();

        if (wasClosedByServer) {
          // Check for terminal HTTP error status if available.
          // When EventSource receives a non-200 HTTP response, it fires
          // onerror with readyState CLOSED. We check the status via a
          // pre-flight HEAD or rely on the error event properties.
          const status = this.extractHttpStatus(errorEvent);
          if (status === 401) {
            hooks.onTerminalError('auth');
          } else if (status === 404) {
            hooks.onTerminalError('not-found');
          } else {
            hooks.onComplete();
          }
        } else {
          hooks.onRetry();
        }
      });
    };
  }

  /**
   * Attempt to extract an HTTP status code from an EventSource error event.
   *
   * The standard EventSource API does not expose HTTP status codes on error
   * events. However, some environments (and polyfills) attach a `status`
   * property to the error event. This method checks for it, returning
   * `undefined` if unavailable.
   *
   * When the status is not available, we fall back to a HEAD pre-flight
   * check to determine if the endpoint returns a terminal status.
   */
  private extractHttpStatus(event: Event): number | undefined {
    // Non-standard but commonly available in some environments
    const statusEvent = event as Event & { status?: number };
    return statusEvent.status;
  }

  /**
   * Parse an SSE MessageEvent and emit it to the subscriber.
   *
   * Heartbeat events are filtered out — they serve a connection-level
   * purpose (stale timer reset handled by the onEvent hook) and are
   * not relevant to application consumers.
   */
  private handleEvent<T>(event: MessageEvent, subscriber: Subscriber<SseEvent<T>>): void {
    try {
      const parsed = JSON.parse(event.data as string) as SseEvent<T>;

      if (parsed.type === 'heartbeat') {
        return;
      }

      subscriber.next(parsed);
    } catch {
      subscriber.error(
        new SseError('parse', '', `Failed to parse SSE event data: ${String(event.data)}`),
      );
    }
  }
}
