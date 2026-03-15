import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { SseEvent } from '../streaming/sse-event.model';
import { SseService } from '../streaming/sse.service';
import { SseError } from '../streaming/sse-error.model';
import { DocumentProcessingService } from './document-processing.service';
import { ProcessingEvent } from '../../models/processing-event.model';

describe('DocumentProcessingService', () => {
  let service: DocumentProcessingService;
  let sseSubject: Subject<SseEvent>;
  let mockSseService: { connect: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    sseSubject = new Subject<SseEvent>();
    mockSseService = {
      connect: vi.fn().mockReturnValue(sseSubject.asObservable()),
    };

    TestBed.configureTestingModule({
      providers: [{ provide: SseService, useValue: mockSseService }],
    });

    service = TestBed.inject(DocumentProcessingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('watchProcessing', () => {
    it('should connect to the correct SSE endpoint URL', () => {
      service.watchProcessing('doc-123').subscribe();

      expect(mockSseService.connect).toHaveBeenCalledWith(
        expect.stringContaining('/documents/doc-123/processing/stream'),
      );
    });

    it('should map processing.started event correctly', () => {
      const events: ProcessingEvent[] = [];
      service.watchProcessing('doc-123').subscribe((e) => events.push(e));

      sseSubject.next({
        type: 'processing.started',
        timestamp: '2026-03-14T10:00:00Z',
        payload: { document_id: 'doc-123', filename: 'rules.pdf' },
      });

      expect(events).toHaveLength(1);
      expect(events[0]).toEqual({
        type: 'started',
        documentId: 'doc-123',
        filename: 'rules.pdf',
      });
    });

    it('should map processing.stage event correctly', () => {
      const events: ProcessingEvent[] = [];
      service.watchProcessing('doc-123').subscribe((e) => events.push(e));

      sseSubject.next({
        type: 'processing.stage',
        timestamp: '2026-03-14T10:00:01Z',
        payload: { stage: 'extracting', progress: 0.35 },
      });

      expect(events).toHaveLength(1);
      expect(events[0]).toEqual({
        type: 'stage',
        stage: 'extracting',
        progress: 0.35,
      });
    });

    it('should map processing.completed event correctly', () => {
      const events: ProcessingEvent[] = [];
      service.watchProcessing('doc-123').subscribe((e) => events.push(e));

      sseSubject.next({
        type: 'processing.completed',
        timestamp: '2026-03-14T10:00:05Z',
        payload: { document_id: 'doc-123', chunk_count: 42 },
      });

      expect(events).toHaveLength(1);
      expect(events[0]).toEqual({
        type: 'completed',
        documentId: 'doc-123',
        chunkCount: 42,
      });
    });

    it('should map processing.error event correctly', () => {
      const events: ProcessingEvent[] = [];
      service.watchProcessing('doc-123').subscribe((e) => events.push(e));

      sseSubject.next({
        type: 'processing.error',
        timestamp: '2026-03-14T10:00:05Z',
        payload: {
          document_id: 'doc-123',
          code: 'EXTRACTION_FAILED',
          message: 'Could not extract text from PDF',
        },
      });

      expect(events).toHaveLength(1);
      expect(events[0]).toEqual({
        type: 'error',
        documentId: 'doc-123',
        code: 'EXTRACTION_FAILED',
        message: 'Could not extract text from PDF',
      });
    });

    it('should map unknown event types to unknown', () => {
      const events: ProcessingEvent[] = [];
      service.watchProcessing('doc-123').subscribe((e) => events.push(e));

      sseSubject.next({
        type: 'processing.future_event',
        timestamp: '2026-03-14T10:00:00Z',
        payload: {},
      });

      expect(events).toHaveLength(1);
      expect(events[0]).toEqual({ type: 'unknown' });
    });

    it('should emit multiple events in order', () => {
      const events: ProcessingEvent[] = [];
      service.watchProcessing('doc-123').subscribe((e) => events.push(e));

      sseSubject.next({
        type: 'processing.started',
        timestamp: '2026-03-14T10:00:00Z',
        payload: { document_id: 'doc-123', filename: 'rules.pdf' },
      });
      sseSubject.next({
        type: 'processing.stage',
        timestamp: '2026-03-14T10:00:01Z',
        payload: { stage: 'validating', progress: 0.1 },
      });
      sseSubject.next({
        type: 'processing.stage',
        timestamp: '2026-03-14T10:00:02Z',
        payload: { stage: 'extracting', progress: 0.4 },
      });

      expect(events).toHaveLength(3);
      expect(events[0]!.type).toBe('started');
      expect(events[1]!.type).toBe('stage');
      expect(events[2]!.type).toBe('stage');
    });

    it('should complete after processing.completed event', () => {
      let completed = false;
      const events: ProcessingEvent[] = [];
      service.watchProcessing('doc-123').subscribe({
        next: (e) => events.push(e),
        complete: () => {
          completed = true;
        },
      });

      sseSubject.next({
        type: 'processing.started',
        timestamp: '2026-03-14T10:00:00Z',
        payload: { document_id: 'doc-123', filename: 'rules.pdf' },
      });
      sseSubject.next({
        type: 'processing.completed',
        timestamp: '2026-03-14T10:00:05Z',
        payload: { document_id: 'doc-123', chunk_count: 42 },
      });

      expect(completed).toBe(true);
      expect(events).toHaveLength(2);
      expect(events[1]!.type).toBe('completed');
    });

    it('should complete after processing.error event', () => {
      let completed = false;
      const events: ProcessingEvent[] = [];
      service.watchProcessing('doc-123').subscribe({
        next: (e) => events.push(e),
        complete: () => {
          completed = true;
        },
      });

      sseSubject.next({
        type: 'processing.error',
        timestamp: '2026-03-14T10:00:05Z',
        payload: {
          document_id: 'doc-123',
          code: 'PARSE_ERROR',
          message: 'Failed',
        },
      });

      expect(completed).toBe(true);
      expect(events).toHaveLength(1);
      expect(events[0]!.type).toBe('error');
    });

    it('should not emit events after terminal event', () => {
      const events: ProcessingEvent[] = [];
      service.watchProcessing('doc-123').subscribe((e) => events.push(e));

      sseSubject.next({
        type: 'processing.completed',
        timestamp: '2026-03-14T10:00:05Z',
        payload: { document_id: 'doc-123', chunk_count: 42 },
      });

      // This should not be emitted (stream completed)
      sseSubject.next({
        type: 'processing.stage',
        timestamp: '2026-03-14T10:00:06Z',
        payload: { stage: 'extracting', progress: 0.5 },
      });

      expect(events).toHaveLength(1);
      expect(events[0]!.type).toBe('completed');
    });

    it('should propagate SSE connection errors', () => {
      let errorCaught: SseError | null = null;
      service.watchProcessing('doc-123').subscribe({
        error: (e: SseError) => {
          errorCaught = e;
        },
      });

      sseSubject.error(new SseError('network', '/test', 'Connection failed', 5));

      expect(errorCaught).toBeInstanceOf(SseError);
      expect(errorCaught!.kind).toBe('network');
    });

    it('should include the terminal event when completing via takeWhile', () => {
      const events: ProcessingEvent[] = [];
      service.watchProcessing('doc-123').subscribe((e) => events.push(e));

      sseSubject.next({
        type: 'processing.completed',
        timestamp: '2026-03-14T10:00:05Z',
        payload: { document_id: 'doc-123', chunk_count: 10 },
      });

      // The completed event itself should be emitted (takeWhile inclusive)
      expect(events).toHaveLength(1);
      expect(events[0]!.type).toBe('completed');
    });
  });
});
