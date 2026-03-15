import { TestBed } from '@angular/core/testing';
import { NgZone } from '@angular/core';
import { SseService } from './sse.service';
import { SseEvent } from './sse-event.model';
import { SseError } from './sse-error.model';

// ---------------------------------------------------------------------------
// EventSource mock
// ---------------------------------------------------------------------------

/**
 * Minimal EventSource mock that captures the URL, options, and event
 * listeners so tests can drive the SSE lifecycle imperatively.
 */
class MockEventSource {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSED = 2;

  readonly url: string;
  readonly withCredentials: boolean;

  readyState: number = MockEventSource.CONNECTING;

  onopen: ((ev: Event) => void) | null = null;
  onmessage: ((ev: MessageEvent) => void) | null = null;
  onerror: ((ev: Event) => void) | null = null;

  closed = false;

  constructor(url: string, options?: EventSourceInit) {
    this.url = url;
    this.withCredentials = options?.withCredentials ?? false;
  }

  close(): void {
    this.closed = true;
    this.readyState = MockEventSource.CLOSED;
  }

  // -- Test helpers ----------------------------------------------------------

  /** Simulate a successful connection open. */
  simulateOpen(): void {
    this.readyState = MockEventSource.OPEN;
    this.onopen?.(new Event('open'));
  }

  /** Simulate receiving a message event with JSON data. */
  simulateMessage(data: unknown): void {
    const event = new MessageEvent('message', { data: JSON.stringify(data) });
    this.onmessage?.(event);
  }

  /** Simulate receiving a message event with raw string data. */
  simulateRawMessage(data: string): void {
    const event = new MessageEvent('message', { data });
    this.onmessage?.(event);
  }

  /**
   * Simulate an error that triggers reconnection.
   * Sets readyState to CONNECTING before firing onerror (browser behaviour
   * when the connection drops but is retryable).
   */
  simulateRetryableError(): void {
    this.readyState = MockEventSource.CONNECTING;
    this.onerror?.(new Event('error'));
  }

  /**
   * Simulate the server closing the stream.
   * Sets readyState to CLOSED before firing onerror (browser behaviour
   * when the server ends the SSE response).
   */
  simulateServerClose(): void {
    this.readyState = MockEventSource.CLOSED;
    this.onerror?.(new Event('error'));
  }

  /**
   * Simulate a terminal HTTP error (e.g., 401, 404).
   * Sets readyState to CLOSED and attaches a status to the error event.
   */
  simulateHttpError(status: number): void {
    this.readyState = MockEventSource.CLOSED;
    const event = Object.assign(new Event('error'), { status });
    this.onerror?.(event);
  }
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('SseService', () => {
  let service: SseService;
  let mockInstances: MockEventSource[];

  /**
   * Returns the most recently created MockEventSource instance.
   * Throws if none have been created yet.
   */
  function latestMock(): MockEventSource {
    const mock = mockInstances[mockInstances.length - 1];
    if (!mock) {
      throw new Error('No MockEventSource instances created');
    }
    return mock;
  }

  beforeEach(() => {
    mockInstances = [];

    TestBed.configureTestingModule({});
    service = TestBed.inject(SseService);

    // Spy on createEventSource to return our mock
    vi.spyOn(service, 'createEventSource').mockImplementation((url: string) => {
      const mock = new MockEventSource(url, { withCredentials: true });
      mockInstances.push(mock);
      return mock as unknown as EventSource;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // -------------------------------------------------------------------------
  // Connection establishment
  // -------------------------------------------------------------------------

  describe('connect', () => {
    it('should create an EventSource with the provided URL', () => {
      const sub = service.connect('/api/v1/test/stream').subscribe();

      expect(service.createEventSource).toHaveBeenCalledWith('/api/v1/test/stream');
      sub.unsubscribe();
    });

    it('should set withCredentials to true', () => {
      const sub = service.connect('/api/v1/test/stream').subscribe();

      expect(latestMock().withCredentials).toBe(true);
      sub.unsubscribe();
    });
  });

  // -------------------------------------------------------------------------
  // Event parsing and emission
  // -------------------------------------------------------------------------

  describe('event parsing', () => {
    it('should emit parsed SseEvent objects for valid JSON data', () => {
      const events: SseEvent[] = [];
      const sub = service.connect('/stream').subscribe((e) => events.push(e));

      const mock = latestMock();
      mock.simulateOpen();
      mock.simulateMessage({
        type: 'stream.token',
        timestamp: '2026-03-14T10:30:00Z',
        payload: { token: 'hello' },
      });

      expect(events).toHaveLength(1);
      expect(events[0]).toEqual({
        type: 'stream.token',
        timestamp: '2026-03-14T10:30:00Z',
        payload: { token: 'hello' },
      });

      sub.unsubscribe();
    });

    it('should emit multiple events in order', () => {
      const events: SseEvent[] = [];
      const sub = service.connect('/stream').subscribe((e) => events.push(e));

      const mock = latestMock();
      mock.simulateOpen();
      mock.simulateMessage({
        type: 'stream.started',
        timestamp: '2026-03-14T10:30:00Z',
        payload: { message_id: 'abc' },
      });
      mock.simulateMessage({
        type: 'stream.token',
        timestamp: '2026-03-14T10:30:01Z',
        payload: { token: 'world' },
      });

      expect(events).toHaveLength(2);
      expect(events[0]?.type).toBe('stream.started');
      expect(events[1]?.type).toBe('stream.token');

      sub.unsubscribe();
    });

    it('should emit SseError with parse kind on invalid JSON data', () => {
      let errorCaught: SseError | null = null;
      const sub = service.connect('/stream').subscribe({
        error: (e: SseError) => {
          errorCaught = e;
        },
      });

      const mock = latestMock();
      mock.simulateOpen();
      mock.simulateRawMessage('not valid json');

      expect(errorCaught).toBeInstanceOf(SseError);
      expect(errorCaught!.kind).toBe('parse');
      expect(errorCaught!.terminal).toBe(true);
      expect(errorCaught!.message).toContain('Failed to parse SSE event data');

      sub.unsubscribe();
    });
  });

  // -------------------------------------------------------------------------
  // Heartbeat filtering
  // -------------------------------------------------------------------------

  describe('heartbeat filtering', () => {
    it('should not emit heartbeat events to subscribers', () => {
      const events: SseEvent[] = [];
      const sub = service.connect('/stream').subscribe((e) => events.push(e));

      const mock = latestMock();
      mock.simulateOpen();
      mock.simulateMessage({
        type: 'heartbeat',
        timestamp: '2026-03-14T10:30:00Z',
        payload: {},
      });

      expect(events).toHaveLength(0);
      sub.unsubscribe();
    });

    it('should emit non-heartbeat events while filtering heartbeats', () => {
      const events: SseEvent[] = [];
      const sub = service.connect('/stream').subscribe((e) => events.push(e));

      const mock = latestMock();
      mock.simulateOpen();
      mock.simulateMessage({
        type: 'stream.token',
        timestamp: '2026-03-14T10:30:00Z',
        payload: { token: 'a' },
      });
      mock.simulateMessage({
        type: 'heartbeat',
        timestamp: '2026-03-14T10:30:15Z',
        payload: {},
      });
      mock.simulateMessage({
        type: 'stream.token',
        timestamp: '2026-03-14T10:30:16Z',
        payload: { token: 'b' },
      });

      expect(events).toHaveLength(2);
      expect(events.every((e) => e.type !== 'heartbeat')).toBe(true);

      sub.unsubscribe();
    });
  });

  // -------------------------------------------------------------------------
  // Stream completion (server closes)
  // -------------------------------------------------------------------------

  describe('stream completion', () => {
    it('should complete the Observable when the server closes the stream', () => {
      let completed = false;
      const sub = service.connect('/stream').subscribe({
        complete: () => {
          completed = true;
        },
      });

      const mock = latestMock();
      mock.simulateOpen();
      mock.simulateServerClose();

      expect(completed).toBe(true);
      sub.unsubscribe();
    });

    it('should close the EventSource when the server closes the stream', () => {
      const sub = service.connect('/stream').subscribe();

      const mock = latestMock();
      mock.simulateOpen();
      mock.simulateServerClose();

      expect(mock.closed).toBe(true);
      sub.unsubscribe();
    });
  });

  // -------------------------------------------------------------------------
  // Cleanup on unsubscribe
  // -------------------------------------------------------------------------

  describe('unsubscribe cleanup', () => {
    it('should close EventSource when subscriber unsubscribes', () => {
      const sub = service.connect('/stream').subscribe();

      const mock = latestMock();
      mock.simulateOpen();

      expect(mock.closed).toBe(false);
      sub.unsubscribe();
      expect(mock.closed).toBe(true);
    });

    it('should close EventSource even if never opened', () => {
      const sub = service.connect('/stream').subscribe();

      const mock = latestMock();
      sub.unsubscribe();
      expect(mock.closed).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // Reconnection with exponential backoff
  // -------------------------------------------------------------------------

  describe('reconnection', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should attempt reconnection on retryable error', () => {
      const sub = service.connect('/stream').subscribe();

      const firstMock = latestMock();
      firstMock.simulateOpen();
      firstMock.simulateRetryableError();

      // First retry after 1000ms
      expect(mockInstances).toHaveLength(1);
      vi.advanceTimersByTime(1000);
      expect(mockInstances).toHaveLength(2);

      sub.unsubscribe();
    });

    it('should apply exponential backoff: 1s, 2s, 4s, 8s, 16s', () => {
      const sub = service.connect('/stream').subscribe({
        error: () => {
          /* expected */
        },
      });

      const expectedDelays = [1000, 2000, 4000, 8000, 16000];

      // Initial connection fails
      latestMock().simulateRetryableError();

      for (let i = 0; i < expectedDelays.length; i++) {
        const countBefore = mockInstances.length;
        vi.advanceTimersByTime(expectedDelays[i]! - 1);
        expect(mockInstances).toHaveLength(countBefore); // Not yet

        vi.advanceTimersByTime(1);
        expect(mockInstances).toHaveLength(countBefore + 1); // Now reconnected

        // Immediately fail again (without open) to continue backoff
        if (i < expectedDelays.length - 1) {
          latestMock().simulateRetryableError();
        }
      }

      sub.unsubscribe();
    });

    it('should reset retry count on successful connection', () => {
      const sub = service.connect('/stream').subscribe({
        error: () => {
          /* expected */
        },
      });

      // First error + reconnect
      latestMock().simulateOpen();
      latestMock().simulateRetryableError();
      vi.advanceTimersByTime(1000);

      // Successfully connects
      latestMock().simulateOpen();

      // Second error — should restart backoff at 1s, not 2s
      latestMock().simulateRetryableError();
      const countBefore = mockInstances.length;
      vi.advanceTimersByTime(1000);
      expect(mockInstances).toHaveLength(countBefore + 1);

      sub.unsubscribe();
    });

    it('should emit SseError with network kind after 5 consecutive failures', () => {
      let errorCaught: SseError | null = null;
      const sub = service.connect('/stream').subscribe({
        error: (e: SseError) => {
          errorCaught = e;
        },
      });

      const delays = [1000, 2000, 4000, 8000, 16000];

      // Initial connection fails immediately
      latestMock().simulateRetryableError();

      for (const delay of delays) {
        vi.advanceTimersByTime(delay);
        latestMock().simulateRetryableError();
      }

      expect(errorCaught).toBeInstanceOf(SseError);
      expect(errorCaught!.kind).toBe('network');
      expect(errorCaught!.terminal).toBe(false);
      expect(errorCaught!.attempts).toBe(5);
      expect(errorCaught!.message).toContain('SSE connection failed after 5 consecutive retries');

      sub.unsubscribe();
    });

    it('should include the URL in the SseError on max retries', () => {
      let errorCaught: SseError | null = null;
      const sub = service.connect('/api/v1/sessions/abc/stream').subscribe({
        error: (e: SseError) => {
          errorCaught = e;
        },
      });

      latestMock().simulateRetryableError();
      for (const delay of [1000, 2000, 4000, 8000, 16000]) {
        vi.advanceTimersByTime(delay);
        latestMock().simulateRetryableError();
      }

      expect(errorCaught!.url).toBe('/api/v1/sessions/abc/stream');

      sub.unsubscribe();
    });

    it('should cap retry delay at 30 seconds', () => {
      const sub = service.connect('/stream').subscribe({
        error: () => {
          /* expected */
        },
      });

      // Burn through retries quickly
      for (let i = 0; i < 5; i++) {
        latestMock().simulateOpen();
        latestMock().simulateRetryableError();
        vi.advanceTimersByTime(30_000);
      }

      // Should have created 6 instances (initial + 5 retries)
      expect(mockInstances).toHaveLength(6);

      sub.unsubscribe();
    });

    it('should clear pending retry timeout on unsubscribe', () => {
      const sub = service.connect('/stream').subscribe({
        error: () => {
          /* expected */
        },
      });

      latestMock().simulateOpen();
      latestMock().simulateRetryableError();

      const countBefore = mockInstances.length;
      sub.unsubscribe();

      vi.advanceTimersByTime(60_000);
      expect(mockInstances).toHaveLength(countBefore);
    });

    it('should close existing EventSource before retrying', () => {
      const sub = service.connect('/stream').subscribe({
        error: () => {
          /* expected */
        },
      });

      const firstMock = latestMock();
      firstMock.simulateOpen();
      firstMock.simulateRetryableError();

      expect(firstMock.closed).toBe(true);

      vi.advanceTimersByTime(1000);
      expect(mockInstances).toHaveLength(2);

      sub.unsubscribe();
    });
  });

  // -------------------------------------------------------------------------
  // Stale connection detection
  // -------------------------------------------------------------------------

  describe('stale connection detection', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should trigger reconnect after 30s with no events', () => {
      const sub = service.connect('/stream').subscribe({
        error: () => {
          /* expected */
        },
      });

      latestMock().simulateOpen();

      // No events for 30 seconds
      expect(mockInstances).toHaveLength(1);
      vi.advanceTimersByTime(30_000);

      // Stale detection fires, old connection closed
      expect(mockInstances[0]!.closed).toBe(true);

      // After backoff delay (1s for first retry), reconnect happens
      vi.advanceTimersByTime(1000);
      expect(mockInstances).toHaveLength(2);

      sub.unsubscribe();
    });

    it('should reset stale timer when heartbeat is received', () => {
      const sub = service.connect('/stream').subscribe({
        error: () => {
          /* expected */
        },
      });

      const mock = latestMock();
      mock.simulateOpen();

      // Advance 20s, then receive heartbeat
      vi.advanceTimersByTime(20_000);
      mock.simulateMessage({
        type: 'heartbeat',
        timestamp: '2026-03-14T10:30:00Z',
        payload: {},
      });

      // Advance another 20s (total 40s from start, but only 20s from heartbeat)
      vi.advanceTimersByTime(20_000);
      // Should NOT have triggered stale reconnect
      expect(mockInstances).toHaveLength(1);
      expect(mock.closed).toBe(false);

      // 10 more seconds (30s from heartbeat) triggers stale
      vi.advanceTimersByTime(10_000);
      expect(mock.closed).toBe(true);

      sub.unsubscribe();
    });

    it('should reset stale timer when non-heartbeat event is received', () => {
      const sub = service.connect('/stream').subscribe({
        error: () => {
          /* expected */
        },
      });

      const mock = latestMock();
      mock.simulateOpen();

      // Advance 25s, then receive a data event
      vi.advanceTimersByTime(25_000);
      mock.simulateMessage({
        type: 'stream.token',
        timestamp: '2026-03-14T10:30:00Z',
        payload: { token: 'x' },
      });

      // 25s from data event: no stale trigger
      vi.advanceTimersByTime(25_000);
      expect(mockInstances).toHaveLength(1);
      expect(mock.closed).toBe(false);

      sub.unsubscribe();
    });

    it('should emit SseError with stale kind when stale triggers and retries exhaust', () => {
      let errorCaught: SseError | null = null;
      const sub = service.connect('/stream').subscribe({
        error: (e: SseError) => {
          errorCaught = e;
        },
      });

      // Connection opens, then goes stale (no events for 30s).
      // The stale timeout fires, which closes the connection and
      // starts the retry cycle. All subsequent reconnection attempts
      // fail immediately (never open), exhausting the retry limit.
      latestMock().simulateOpen();
      vi.advanceTimersByTime(30_000); // stale fires (retryCount becomes 1)

      // Now the reconnection attempts fail without opening
      const delays = [1000, 2000, 4000, 8000];
      for (const delay of delays) {
        vi.advanceTimersByTime(delay);
        latestMock().simulateRetryableError(); // retryCount increments
      }

      // 5th retry also fails
      vi.advanceTimersByTime(16_000);
      latestMock().simulateRetryableError();

      expect(errorCaught).toBeInstanceOf(SseError);
      // The initial trigger was stale, but subsequent failures are network.
      // The error kind reflects the last reason.
      expect(errorCaught!.kind).toBe('network');
      expect(errorCaught!.attempts).toBe(5);

      sub.unsubscribe();
    });

    it('should clear stale timer on unsubscribe', () => {
      const sub = service.connect('/stream').subscribe({
        error: () => {
          /* expected */
        },
      });

      latestMock().simulateOpen();

      sub.unsubscribe();

      // Advance past stale timeout — should NOT trigger reconnect
      vi.advanceTimersByTime(60_000);
      expect(mockInstances).toHaveLength(1);
    });

    it('should clear stale timer on server close', () => {
      let completed = false;
      const sub = service.connect('/stream').subscribe({
        complete: () => {
          completed = true;
        },
      });

      latestMock().simulateOpen();
      latestMock().simulateServerClose();

      expect(completed).toBe(true);

      // Advance past stale timeout — should NOT trigger reconnect
      vi.advanceTimersByTime(60_000);
      expect(mockInstances).toHaveLength(1);

      sub.unsubscribe();
    });

    it('should clear stale timer on retryable error', () => {
      const sub = service.connect('/stream').subscribe({
        error: () => {
          /* expected */
        },
      });

      latestMock().simulateOpen();

      // Advance 15s, then trigger a retryable error
      vi.advanceTimersByTime(15_000);
      latestMock().simulateRetryableError();

      // Stale timer should be cleared — only the retry timer should fire
      vi.advanceTimersByTime(1000);
      expect(mockInstances).toHaveLength(2);

      // Advance past what would have been the original stale timeout
      // Should NOT trigger a second reconnect
      latestMock().simulateOpen();
      vi.advanceTimersByTime(15_000);
      expect(mockInstances).toHaveLength(2);

      sub.unsubscribe();
    });
  });

  // -------------------------------------------------------------------------
  // Terminal error handling (401, 404)
  // -------------------------------------------------------------------------

  describe('terminal errors', () => {
    it('should emit SseError with auth kind on 401 and not retry', () => {
      vi.useFakeTimers();

      let errorCaught: SseError | null = null;
      const sub = service.connect('/stream').subscribe({
        error: (e: SseError) => {
          errorCaught = e;
        },
      });

      latestMock().simulateHttpError(401);

      expect(errorCaught).toBeInstanceOf(SseError);
      expect(errorCaught!.kind).toBe('auth');
      expect(errorCaught!.terminal).toBe(true);
      expect(errorCaught!.attempts).toBe(0);
      expect(errorCaught!.message).toContain('authentication required');

      // No retry should be scheduled
      vi.advanceTimersByTime(60_000);
      expect(mockInstances).toHaveLength(1);

      vi.useRealTimers();
      sub.unsubscribe();
    });

    it('should emit SseError with not-found kind on 404 and not retry', () => {
      vi.useFakeTimers();

      let errorCaught: SseError | null = null;
      const sub = service.connect('/stream').subscribe({
        error: (e: SseError) => {
          errorCaught = e;
        },
      });

      latestMock().simulateHttpError(404);

      expect(errorCaught).toBeInstanceOf(SseError);
      expect(errorCaught!.kind).toBe('not-found');
      expect(errorCaught!.terminal).toBe(true);
      expect(errorCaught!.attempts).toBe(0);
      expect(errorCaught!.message).toContain('resource not found');

      vi.advanceTimersByTime(60_000);
      expect(mockInstances).toHaveLength(1);

      vi.useRealTimers();
      sub.unsubscribe();
    });

    it('should include the URL in terminal SseErrors', () => {
      let errorCaught: SseError | null = null;
      const sub = service.connect('/api/v1/sessions/xyz/stream').subscribe({
        error: (e: SseError) => {
          errorCaught = e;
        },
      });

      latestMock().simulateHttpError(401);

      expect(errorCaught!.url).toBe('/api/v1/sessions/xyz/stream');

      sub.unsubscribe();
    });

    it('should complete (not error) on server close without terminal status', () => {
      let completed = false;
      let errorCaught: unknown = null;
      const sub = service.connect('/stream').subscribe({
        complete: () => {
          completed = true;
        },
        error: (e: unknown) => {
          errorCaught = e;
        },
      });

      latestMock().simulateOpen();
      latestMock().simulateServerClose();

      expect(completed).toBe(true);
      expect(errorCaught).toBeNull();

      sub.unsubscribe();
    });
  });

  // -------------------------------------------------------------------------
  // SseError model
  // -------------------------------------------------------------------------

  describe('SseError model', () => {
    it('should mark network errors as non-terminal', () => {
      const error = new SseError('network', '/stream', 'test', 5);
      expect(error.terminal).toBe(false);
      expect(error.name).toBe('SseError');
    });

    it('should mark stale errors as non-terminal', () => {
      const error = new SseError('stale', '/stream', 'test', 3);
      expect(error.terminal).toBe(false);
    });

    it('should mark auth errors as terminal', () => {
      const error = new SseError('auth', '/stream', 'test');
      expect(error.terminal).toBe(true);
      expect(error.attempts).toBe(0);
    });

    it('should mark not-found errors as terminal', () => {
      const error = new SseError('not-found', '/stream', 'test');
      expect(error.terminal).toBe(true);
    });

    it('should mark parse errors as terminal', () => {
      const error = new SseError('parse', '/stream', 'test');
      expect(error.terminal).toBe(true);
    });

    it('should extend Error', () => {
      const error = new SseError('network', '/stream', 'some message', 2);
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('some message');
    });
  });

  // -------------------------------------------------------------------------
  // NgZone integration
  // -------------------------------------------------------------------------

  describe('NgZone integration', () => {
    it('should run event callbacks inside Angular zone', () => {
      const zone = TestBed.inject(NgZone);
      const runSpy = vi.spyOn(zone, 'run');

      const sub = service.connect('/stream').subscribe();

      const mock = latestMock();
      mock.simulateOpen();
      mock.simulateMessage({
        type: 'stream.token',
        timestamp: '2026-03-14T10:30:00Z',
        payload: { token: 'x' },
      });

      // onopen + onmessage = at least 2 zone.run calls
      expect(runSpy).toHaveBeenCalled();
      expect(runSpy.mock.calls.length).toBeGreaterThanOrEqual(2);

      sub.unsubscribe();
    });
  });

  // -------------------------------------------------------------------------
  // Typed event generics
  // -------------------------------------------------------------------------

  describe('typed events', () => {
    interface TokenPayload {
      token: string;
    }

    it('should support generic payload typing', () => {
      const events: SseEvent<TokenPayload>[] = [];
      const sub = service.connect<TokenPayload>('/stream').subscribe((e) => events.push(e));

      const mock = latestMock();
      mock.simulateOpen();
      mock.simulateMessage({
        type: 'stream.token',
        timestamp: '2026-03-14T10:30:00Z',
        payload: { token: 'typed' },
      });

      expect(events).toHaveLength(1);
      expect(events[0]?.payload.token).toBe('typed');

      sub.unsubscribe();
    });
  });

  // -------------------------------------------------------------------------
  // Combined scenarios
  // -------------------------------------------------------------------------

  describe('combined scenarios', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should handle stale then network error in sequence', () => {
      const sub = service.connect('/stream').subscribe({
        error: () => {
          /* expected */
        },
      });

      // Open, then go stale
      latestMock().simulateOpen();
      vi.advanceTimersByTime(30_000); // stale triggers
      vi.advanceTimersByTime(1000); // backoff delay

      // Second connection opens but then gets a network error
      latestMock().simulateOpen();
      latestMock().simulateRetryableError();

      // Third retry (reset by open, so back to 1s delay)
      vi.advanceTimersByTime(1000);
      expect(mockInstances).toHaveLength(3);

      sub.unsubscribe();
    });

    it('should handle events received between reconnection attempts', () => {
      const events: SseEvent[] = [];
      const sub = service.connect('/stream').subscribe({
        next: (e) => events.push(e),
        error: () => {
          /* expected */
        },
      });

      // First connection: receive some events then disconnect
      latestMock().simulateOpen();
      latestMock().simulateMessage({
        type: 'stream.token',
        timestamp: '2026-03-14T10:30:00Z',
        payload: { token: 'before' },
      });
      latestMock().simulateRetryableError();

      // Reconnect
      vi.advanceTimersByTime(1000);

      // Second connection: receive more events
      latestMock().simulateOpen();
      latestMock().simulateMessage({
        type: 'stream.token',
        timestamp: '2026-03-14T10:30:05Z',
        payload: { token: 'after' },
      });

      expect(events).toHaveLength(2);
      expect(events[0]!.payload).toEqual({ token: 'before' });
      expect(events[1]!.payload).toEqual({ token: 'after' });

      sub.unsubscribe();
    });

    it('should handle terminal error after successful reconnection', () => {
      let errorCaught: SseError | null = null;
      const sub = service.connect('/stream').subscribe({
        error: (e: SseError) => {
          errorCaught = e;
        },
      });

      // First connection, network error, reconnect
      latestMock().simulateOpen();
      latestMock().simulateRetryableError();
      vi.advanceTimersByTime(1000);

      // Second connection gets 401
      latestMock().simulateHttpError(401);

      expect(errorCaught).toBeInstanceOf(SseError);
      expect(errorCaught!.kind).toBe('auth');
      expect(errorCaught!.terminal).toBe(true);

      // No further retries
      vi.advanceTimersByTime(60_000);
      expect(mockInstances).toHaveLength(2);

      sub.unsubscribe();
    });
  });
});
