import { inject, Injectable } from '@angular/core';
import { map, Observable, takeWhile } from 'rxjs';
import { environment } from '../config/environment';
import { SseEvent } from '../streaming/sse-event.model';
import { SseService } from '../streaming/sse.service';
import { ProcessingEvent } from '../../models/processing-event.model';

/**
 * Real-time document processing status service.
 *
 * Wraps `SseService` with document-processing-specific typing and
 * lifecycle management. Subscribes to the `processing.*` SSE event
 * namespace for a given document ID and emits strongly-typed
 * `ProcessingEvent` objects.
 *
 * The Observable completes automatically on terminal events
 * (`processing.completed` or `processing.error`) so consumers do
 * not need to manually unsubscribe for lifecycle management — though
 * they should still unsubscribe on component destroy as a safety net.
 */
@Injectable({ providedIn: 'root' })
export class DocumentProcessingService {
  private readonly sseService = inject(SseService);

  /**
   * Subscribe to processing status events for a document.
   *
   * Opens an SSE connection to the document processing stream endpoint
   * and emits typed processing events. The stream completes automatically
   * when a terminal event (completed or error) is received.
   *
   * @param documentId - The ID of the document to watch.
   * @returns Observable of typed processing events.
   */
  watchProcessing(documentId: string): Observable<ProcessingEvent> {
    const url = `${environment.apiUrl}/documents/${documentId}/processing/stream`;
    return this.sseService.connect(url).pipe(
      map((event) => this.mapProcessingEvent(event)),
      takeWhile((event) => !this.isTerminalEvent(event), true),
    );
  }

  /**
   * Map a raw SSE event to a typed ProcessingEvent.
   *
   * Handles all `processing.*` event types defined in the T002 contract.
   * Unknown event types are mapped to `{ type: 'unknown' }` for forward
   * compatibility.
   */
  private mapProcessingEvent(event: SseEvent): ProcessingEvent {
    switch (event.type) {
      case 'processing.started':
        return {
          type: 'started',
          documentId: (event.payload as { document_id: string }).document_id,
          filename: (event.payload as { filename: string }).filename,
        };
      case 'processing.stage':
        return {
          type: 'stage',
          stage: (event.payload as { stage: string }).stage,
          progress: (event.payload as { progress: number }).progress,
        };
      case 'processing.completed':
        return {
          type: 'completed',
          documentId: (event.payload as { document_id: string }).document_id,
          chunkCount: (event.payload as { chunk_count: number }).chunk_count,
        };
      case 'processing.error':
        return {
          type: 'error',
          documentId: (event.payload as { document_id: string }).document_id,
          code: (event.payload as { code: string }).code,
          message: (event.payload as { message: string }).message,
        };
      default:
        return { type: 'unknown' };
    }
  }

  /**
   * Check whether a processing event is terminal.
   *
   * Terminal events signal the end of processing — either success or
   * failure. The SSE stream should close after these events.
   */
  private isTerminalEvent(event: ProcessingEvent): boolean {
    return event.type === 'completed' || event.type === 'error';
  }
}
