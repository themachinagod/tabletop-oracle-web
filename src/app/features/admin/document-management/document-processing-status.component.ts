import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  OnInit,
  Output,
  signal,
  SimpleChanges,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DocumentProcessingService } from '../../../core/services/document-processing.service';
import { DocumentStatus } from '../../../models/document.model';
import { ProcessingEvent, PROCESSING_STAGE_LABELS } from '../../../models/processing-event.model';

/**
 * Live document processing status indicator.
 *
 * When the document is in a processing state (`uploaded` or `parsing`),
 * this component subscribes to the SSE processing stream and shows
 * real-time stage progression. On completion or error, it emits an
 * event so the parent can refresh document data.
 *
 * For already-processed or errored documents, it displays static status
 * information without an SSE subscription.
 */
@Component({
  selector: 'app-document-processing-status',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './document-processing-status.component.html',
  styleUrl: './document-processing-status.component.scss',
})
export class DocumentProcessingStatusComponent implements OnInit, OnChanges {
  private readonly processingService = inject(DocumentProcessingService);
  private readonly destroyRef = inject(DestroyRef);

  /** The document ID to watch for processing events. */
  @Input({ required: true }) documentId!: string;

  /** Current document processing status from the API. */
  @Input({ required: true }) status!: DocumentStatus;

  /** Error message from the document (if status is 'error'). */
  @Input() errorMessage: string | null = null;

  /** Chunk count (if status is 'processed'). */
  @Input() chunkCount: number | null = null;

  /** Processed timestamp (if status is 'processed'). */
  @Input() processedAt: string | null = null;

  /** Emitted when processing completes or errors (parent should refresh). */
  @Output() readonly processingChanged = new EventEmitter<ProcessingEvent>();

  /** Current processing stage label. */
  readonly currentStage = signal<string | null>(null);

  /** Current processing progress (0.0-1.0). */
  readonly progress = signal<number>(0);

  /** Whether SSE is currently connected and streaming. */
  readonly isStreaming = signal(false);

  /** SSE connection error message. */
  readonly connectionError = signal<string | null>(null);

  /** Processing error from the stream (distinct from API error). */
  readonly streamErrorMessage = signal<string | null>(null);

  /** Whether processing has been started via SSE. */
  private sseActive = false;

  ngOnInit(): void {
    this.maybeSubscribe();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['status'] && !changes['status'].firstChange) {
      this.maybeSubscribe();
    }
  }

  /**
   * Subscribe to the SSE processing stream if the document is in
   * a processing state.
   */
  private maybeSubscribe(): void {
    if (this.sseActive) return;
    if (this.status !== 'uploaded' && this.status !== 'parsing') return;

    this.sseActive = true;
    this.isStreaming.set(true);
    this.connectionError.set(null);
    this.streamErrorMessage.set(null);

    this.processingService
      .watchProcessing(this.documentId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (event) => this.handleEvent(event),
        error: () => {
          this.isStreaming.set(false);
          this.sseActive = false;
          this.connectionError.set(
            'Lost connection to processing stream. Refresh to check status.',
          );
        },
        complete: () => {
          this.isStreaming.set(false);
          this.sseActive = false;
        },
      });
  }

  /** Route incoming processing events to the appropriate handler. */
  private handleEvent(event: ProcessingEvent): void {
    switch (event.type) {
      case 'started':
        this.currentStage.set('Starting');
        this.progress.set(0);
        break;
      case 'stage':
        this.currentStage.set(PROCESSING_STAGE_LABELS[event.stage] ?? event.stage);
        this.progress.set(event.progress);
        break;
      case 'completed':
        this.currentStage.set(null);
        this.progress.set(1);
        this.isStreaming.set(false);
        this.processingChanged.emit(event);
        break;
      case 'error':
        this.currentStage.set(null);
        this.streamErrorMessage.set(event.message);
        this.isStreaming.set(false);
        this.processingChanged.emit(event);
        break;
      case 'unknown':
        // Forward-compatible: ignore unknown event types
        break;
    }
  }
}
