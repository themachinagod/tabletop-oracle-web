import { UpperCasePipe } from '@angular/common';
import { Component, DestroyRef, inject, Input, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { DocumentSummary, DocumentStatus } from '../../../models/document.model';
import { ExpansionDetail } from '../../../models/game.model';
import { AdminDocumentService } from '../../../core/services/admin-document.service';
import { DocumentProcessingService } from '../../../core/services/document-processing.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ErrorBannerComponent } from '../../../shared/components/error-banner/error-banner.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { RelativeTimePipe } from '../../../shared/pipes/relative-time.pipe';
import { DocumentStatusBadgeComponent } from './document-status-badge.component';
import { DocumentTypeBadgeComponent } from './document-type-badge.component';
import { DocumentUploadComponent } from './document-upload.component';

/**
 * Document list within the game detail Documents tab.
 *
 * Displays a table of documents with status badges, type badges,
 * and actions. Includes the upload zone above the table. Supports
 * delete with confirmation dialog.
 */
@Component({
  selector: 'app-document-list',
  standalone: true,
  imports: [
    ConfirmDialogComponent,
    DocumentStatusBadgeComponent,
    DocumentTypeBadgeComponent,
    DocumentUploadComponent,
    EmptyStateComponent,
    ErrorBannerComponent,
    LoadingSpinnerComponent,
    RelativeTimePipe,
    UpperCasePipe,
  ],
  templateUrl: './document-list.component.html',
  styleUrl: './document-list.component.scss',
})
export class DocumentListComponent implements OnInit {
  private readonly documentService = inject(AdminDocumentService);
  private readonly processingService = inject(DocumentProcessingService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  /** Parent game ID. */
  @Input({ required: true }) gameId!: string;

  /** Available expansions for upload classification. */
  @Input() expansions: ExpansionDetail[] = [];

  /** Loaded documents. */
  readonly documents = signal<DocumentSummary[]>([]);

  /** Whether documents are loading. */
  readonly loading = signal(true);

  /** Error message from the last failed operation. */
  readonly error = signal<string | null>(null);

  /** Document pending delete confirmation. */
  readonly deleteTarget = signal<DocumentSummary | null>(null);

  /** Whether a delete operation is in progress. */
  readonly deleteInProgress = signal(false);

  /** Live status overrides from SSE streams, keyed by document ID. */
  readonly liveStatuses = signal<Map<string, DocumentStatus>>(new Map());

  /** Active SSE subscriptions for processing documents. */
  private readonly processingSubscriptions = new Map<string, Subscription>();

  ngOnInit(): void {
    this.loadDocuments();
  }

  /** Navigate to document detail page. */
  viewDocument(doc: DocumentSummary): void {
    this.router.navigate(['/admin/games', this.gameId, 'documents', doc.id]);
  }

  /** Open delete confirmation dialog. */
  confirmDelete(doc: DocumentSummary): void {
    this.deleteTarget.set(doc);
  }

  /** Execute delete after confirmation. */
  onDeleteConfirmed(): void {
    const target = this.deleteTarget();
    if (!target) return;

    this.deleteTarget.set(null);
    this.deleteInProgress.set(true);
    this.error.set(null);

    this.documentService
      .deleteDocument(this.gameId, target.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.deleteInProgress.set(false);
          this.loadDocuments();
        },
        error: () => {
          this.error.set('Failed to delete document. Please try again.');
          this.deleteInProgress.set(false);
        },
      });
  }

  /** Cancel delete dialog. */
  onDeleteCancelled(): void {
    this.deleteTarget.set(null);
  }

  /** Refresh the document list after upload. */
  onDocumentUploaded(): void {
    this.loadDocuments();
  }

  /** Dismiss the error banner. */
  dismissError(): void {
    this.error.set(null);
  }

  /**
   * Get the effective status for a document, considering live SSE updates.
   *
   * @param doc - The document summary from the API.
   * @returns The live status if available, otherwise the API status.
   */
  getEffectiveStatus(doc: DocumentSummary): DocumentStatus {
    return this.liveStatuses().get(doc.id) ?? doc.status;
  }

  /** Format file size for display. */
  formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  /** Load documents from the API. */
  private loadDocuments(): void {
    this.loading.set(true);
    this.error.set(null);

    this.documentService
      .listDocuments(this.gameId, { sort: '-uploaded_at' })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.documents.set(result.data);
          this.loading.set(false);
          this.watchProcessingDocuments(result.data);
        },
        error: () => {
          this.error.set('Failed to load documents. Please try again.');
          this.loading.set(false);
        },
      });
  }

  /**
   * Subscribe to SSE streams for all documents currently in a processing state.
   *
   * Only subscribes if not already watching that document. On terminal events
   * (completed or error), the list is refreshed to pick up the final state
   * from the API.
   */
  private watchProcessingDocuments(docs: DocumentSummary[]): void {
    const processingDocs = docs.filter(
      (d) => d.status === 'uploaded' || d.status === 'parsing',
    );

    for (const doc of processingDocs) {
      if (this.processingSubscriptions.has(doc.id)) continue;

      const sub = this.processingService
        .watchProcessing(doc.id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (event) => {
            if (event.type === 'started' || event.type === 'stage') {
              this.updateLiveStatus(doc.id, 'parsing');
            } else if (event.type === 'completed') {
              this.updateLiveStatus(doc.id, 'processed');
              this.cleanupSubscription(doc.id);
              this.loadDocuments();
            } else if (event.type === 'error') {
              this.updateLiveStatus(doc.id, 'error');
              this.cleanupSubscription(doc.id);
              this.loadDocuments();
            }
          },
          error: () => {
            this.cleanupSubscription(doc.id);
          },
          complete: () => {
            this.cleanupSubscription(doc.id);
          },
        });

      this.processingSubscriptions.set(doc.id, sub);
    }
  }

  /** Update the live status map for a document. */
  private updateLiveStatus(documentId: string, status: DocumentStatus): void {
    const current = new Map(this.liveStatuses());
    current.set(documentId, status);
    this.liveStatuses.set(current);
  }

  /** Clean up an SSE subscription for a document. */
  private cleanupSubscription(documentId: string): void {
    const sub = this.processingSubscriptions.get(documentId);
    if (sub) {
      sub.unsubscribe();
      this.processingSubscriptions.delete(documentId);
    }
  }
}
