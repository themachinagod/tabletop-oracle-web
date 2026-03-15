import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  EventEmitter,
  inject,
  Input,
  Output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  DocumentDetail,
  DocumentType,
  DOCUMENT_TYPE_LABELS,
  DOCUMENT_TYPE_OPTIONS,
} from '../../../models/document.model';
import { ExpansionDetail } from '../../../models/game.model';
import { AdminDocumentService } from '../../../core/services/admin-document.service';
import { RelativeTimePipe } from '../../../shared/pipes/relative-time.pipe';
import { DocumentStatusBadgeComponent } from './document-status-badge.component';

/**
 * Document metadata display with inline reclassification.
 *
 * Shows document metadata (name, type, format, status, expansion,
 * file size, dates) and provides inline edit capabilities for type
 * (reclassify) and expansion (re-associate).
 */
@Component({
  selector: 'app-document-metadata',
  standalone: true,
  imports: [DocumentStatusBadgeComponent, RelativeTimePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './document-metadata.component.html',
  styleUrl: './document-metadata.component.scss',
})
export class DocumentMetadataComponent {
  private readonly documentService = inject(AdminDocumentService);
  private readonly destroyRef = inject(DestroyRef);

  /** Document detail data. */
  @Input({ required: true }) document!: DocumentDetail;

  /** Parent game ID. */
  @Input({ required: true }) gameId!: string;

  /** Available expansions for re-association dropdown. */
  @Input() expansions: ExpansionDetail[] = [];

  /** Emitted after a successful reclassification or re-association. */
  @Output() documentUpdated = new EventEmitter<void>();

  /** Document type options for the reclassify dropdown. */
  readonly typeOptions = DOCUMENT_TYPE_OPTIONS;

  /** Document type labels for display. */
  readonly typeLabels = DOCUMENT_TYPE_LABELS;

  /** Feedback message after a reclassify/reassociate operation. */
  readonly feedback = signal<string | null>(null);

  /** Whether a save operation is in progress. */
  readonly saving = signal(false);

  /** Reclassify document type via inline dropdown change. */
  onTypeChange(newType: DocumentType): void {
    if (newType === this.document.type) return;

    this.saving.set(true);
    this.feedback.set(null);

    this.documentService
      .reclassifyDocument(this.gameId, this.document.id, newType)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.feedback.set('Type updated.');
          this.documentUpdated.emit();
        },
        error: () => {
          this.saving.set(false);
          this.feedback.set('Failed to update type.');
        },
      });
  }

  /** Re-associate document expansion via inline dropdown change. */
  onExpansionChange(newExpansionId: string): void {
    const expansionId = newExpansionId || null;
    if (expansionId === this.document.expansion_id) return;

    this.saving.set(true);
    this.feedback.set(null);

    this.documentService
      .reassociateDocument(this.gameId, this.document.id, expansionId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.feedback.set('Expansion updated.');
          this.documentUpdated.emit();
        },
        error: () => {
          this.saving.set(false);
          this.feedback.set('Failed to update expansion.');
        },
      });
  }

  /** Format file size for display. */
  formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}
