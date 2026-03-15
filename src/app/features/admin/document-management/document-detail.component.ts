import { UpperCasePipe } from '@angular/common';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { DocumentDetail } from '../../../models/document.model';
import { ExpansionDetail } from '../../../models/game.model';
import { AdminDocumentService } from '../../../core/services/admin-document.service';
import { AdminExpansionService } from '../../../core/services/admin-expansion.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ErrorBannerComponent } from '../../../shared/components/error-banner/error-banner.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { DocumentMetadataComponent } from './document-metadata.component';
import { DocumentProcessingStatusComponent } from './document-processing-status.component';
import { DocumentStatusBadgeComponent } from './document-status-badge.component';
import { DocumentTypeBadgeComponent } from './document-type-badge.component';
import { DocumentVersionHistoryComponent } from './document-version-history.component';

/**
 * Full document detail view.
 *
 * Displays document metadata with inline editing, processing status,
 * version history, and actions (retry, delete). Includes a back link
 * to the game detail page.
 *
 * Route: /admin/games/:gameId/documents/:documentId
 */
@Component({
  selector: 'app-document-detail',
  standalone: true,
  imports: [
    ConfirmDialogComponent,
    DocumentMetadataComponent,
    DocumentProcessingStatusComponent,
    DocumentStatusBadgeComponent,
    DocumentTypeBadgeComponent,
    DocumentVersionHistoryComponent,
    ErrorBannerComponent,
    LoadingSpinnerComponent,
    UpperCasePipe,
  ],
  templateUrl: './document-detail.component.html',
  styleUrl: './document-detail.component.scss',
})
export class DocumentDetailComponent implements OnInit {
  private readonly documentService = inject(AdminDocumentService);
  private readonly expansionService = inject(AdminExpansionService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  /** Loaded document data. */
  readonly document = signal<DocumentDetail | null>(null);

  /** Available expansions for re-association. */
  readonly expansions = signal<ExpansionDetail[]>([]);

  /** Whether the document is loading. */
  readonly loading = signal(true);

  /** Error message from the last failed operation. */
  readonly error = signal<string | null>(null);

  /** Whether the delete confirmation dialog is open. */
  readonly showDeleteDialog = signal(false);

  /** Whether a delete or retry operation is in progress. */
  readonly actionInProgress = signal(false);

  /** Route parameters. */
  private gameId = '';
  private documentId = '';

  ngOnInit(): void {
    this.gameId = this.route.snapshot.paramMap.get('gameId') ?? '';
    this.documentId = this.route.snapshot.paramMap.get('documentId') ?? '';
    this.loadDocument();
    this.loadExpansions();
  }

  /** Navigate back to the game detail page (Documents tab). */
  goBack(): void {
    this.router.navigate(['/admin/games', this.gameId]);
  }

  /** Open the delete confirmation dialog. */
  confirmDelete(): void {
    this.showDeleteDialog.set(true);
  }

  /** Execute delete after confirmation. */
  onDeleteConfirmed(): void {
    this.showDeleteDialog.set(false);
    this.actionInProgress.set(true);
    this.error.set(null);

    this.documentService
      .deleteDocument(this.gameId, this.documentId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.actionInProgress.set(false);
          this.goBack();
        },
        error: () => {
          this.error.set('Failed to delete document. Please try again.');
          this.actionInProgress.set(false);
        },
      });
  }

  /** Cancel the delete dialog. */
  onDeleteCancelled(): void {
    this.showDeleteDialog.set(false);
  }

  /** Retry failed document processing. */
  retryProcessing(): void {
    this.actionInProgress.set(true);
    this.error.set(null);

    this.documentService
      .retryProcessing(this.gameId, this.documentId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.actionInProgress.set(false);
          this.loadDocument();
        },
        error: () => {
          this.error.set('Failed to retry processing. Please try again.');
          this.actionInProgress.set(false);
        },
      });
  }

  /** Refresh document data after metadata update. */
  onDocumentUpdated(): void {
    this.loadDocument();
  }

  /** Refresh document data after version upload. */
  onVersionUploaded(): void {
    this.loadDocument();
  }

  /** Refresh document data when processing status changes via SSE. */
  onProcessingChanged(): void {
    this.loadDocument();
  }

  /** Dismiss the error banner. */
  dismissError(): void {
    this.error.set(null);
  }

  /** Expose gameId for child components. */
  get currentGameId(): string {
    return this.gameId;
  }

  /** Expose documentId for child components. */
  get currentDocumentId(): string {
    return this.documentId;
  }

  /** Load document data from the API. */
  private loadDocument(): void {
    this.loading.set(true);
    this.error.set(null);

    this.documentService
      .getDocument(this.gameId, this.documentId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (doc) => {
          this.document.set(doc);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Failed to load document. Please try again.');
          this.loading.set(false);
        },
      });
  }

  /** Load expansions for re-association dropdown. */
  private loadExpansions(): void {
    this.expansionService
      .listExpansions(this.gameId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (expansions) => this.expansions.set(expansions),
        error: () => {
          /* Non-critical — dropdown will just show Base Game */
        },
      });
  }
}
