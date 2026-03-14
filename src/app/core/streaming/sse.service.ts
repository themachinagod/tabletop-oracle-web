import { inject, Injectable, NgZone } from '@angular/core';
import { Observable, Subscriber } from 'rxjs';
import { SseEvent } from './sse-event.model';

/** Initial reconnection delay in milliseconds. */
const INITIAL_RETRY_MS = 1000;

/** Maximum reconnection delay in milliseconds. */
const MAX_RETRY_MS = 30_000;

/** Maximum consecutive reconnection failures before emitting an error. */
const MAX_RETRIES = 5;

/** Backoff multiplier applied on each consecutive failure. */
const BACKOFF_FACTOR = 2;

/** EventSource readyState: the connection has been closed (or was never opened). */
const EVENTSOURCE_CLOSED = 2;

/**
 * Core SSE client service.
 *
 * Wraps the browser EventSource API behind an RxJS Observable interface.
 * Handles credential forwarding (session cookie), heartbeat filtering,
 * JSON payload parsing, and reconnection with exponential backoff.
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
   * internally to keep the connection alive and are never emitted
   * to subscribers.
   *
   * The Observable completes when the server closes the stream
   * (EventSource transitions to CLOSED state without an error).
   *
   * On unsubscribe, the underlying EventSource is closed immediately.
   *
   * @param url - The SSE endpoint URL (absolute or relative).
   * @returns Observable that emits `SseEvent` objects.
   */
  connect<T = unknown>(url: string): Observable<SseEvent<T>> {
    return new Observable<SseEvent<T>>((subscriber) => {
      let retryCount = 0;
      let retryTimeout: ReturnType<typeof setTimeout> | null = null;
      let eventSource: EventSource | null = null;

      const open = (): void => {
        eventSource = this.createEventSource(url);
        this.attachListeners(eventSource, subscriber, {
          onOpen: () => {
            retryCount = 0;
          },
          onRetry: () => {
            retryCount++;
            if (retryCount > MAX_RETRIES) {
              subscriber.error(
                new Error(`SSE connection failed after ${MAX_RETRIES} consecutive retries`),
              );
              return;
            }
            const delay = Math.min(INITIAL_RETRY_MS * BACKOFF_FACTOR ** (retryCount - 1), MAX_RETRY_MS);
            retryTimeout = setTimeout(() => {
              retryTimeout = null;
              open();
            }, delay);
          },
        });
      };

      open();

      return () => {
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
   */
  private attachListeners<T>(
    source: EventSource,
    subscriber: Subscriber<SseEvent<T>>,
    hooks: { onOpen: () => void; onRetry: () => void },
  ): void {
    source.onopen = () => {
      this.zone.run(() => hooks.onOpen());
    };

    source.onmessage = (event: MessageEvent) => {
      this.zone.run(() => this.handleEvent(event, subscriber));
    };

    source.onerror = () => {
      this.zone.run(() => {
        // Capture readyState before closing — close() sets it to CLOSED
        // unconditionally. A readyState of CLOSED before we call close()
        // means the server terminated the stream (complete the Observable).
        // CONNECTING means a retryable network error.
        const wasClosedByServer = source.readyState === EVENTSOURCE_CLOSED;
        source.close();
        if (wasClosedByServer) {
          subscriber.complete();
        } else {
          hooks.onRetry();
        }
      });
    };
  }

  /**
   * Parse an SSE MessageEvent and emit it to the subscriber.
   *
   * Heartbeat events are filtered out — they serve a connection-level
   * purpose and are not relevant to application consumers.
   */
  private handleEvent<T>(event: MessageEvent, subscriber: Subscriber<SseEvent<T>>): void {
    try {
      const parsed = JSON.parse(event.data as string) as SseEvent<T>;

      if (parsed.type === 'heartbeat') {
        return;
      }

      subscriber.next(parsed);
    } catch {
      subscriber.error(new Error(`Failed to parse SSE event data: ${String(event.data)}`));
    }
  }
}
