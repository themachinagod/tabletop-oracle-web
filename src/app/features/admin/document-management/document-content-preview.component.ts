import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  Input,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DocumentContent } from '../../../models/document-content.model';
import { AdminDocumentService } from '../../../core/services/admin-document.service';
import { ErrorBannerComponent } from '../../../shared/components/error-banner/error-banner.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

/**
 * Displays extracted document content as a nested, collapsible section tree.
 *
 * Renders the preview API response including structured sections with
 * headings and text, table summaries, image descriptions, and aggregate
 * statistics. Only used when a document has been successfully processed.
 */
@Component({
  selector: 'app-document-content-preview',
  standalone: true,
  imports: [ErrorBannerComponent, LoadingSpinnerComponent, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './document-content-preview.component.html',
  styleUrl: './document-content-preview.component.scss',
})
export class DocumentContentPreviewComponent implements OnInit {
  private readonly documentService = inject(AdminDocumentService);
  private readonly destroyRef = inject(DestroyRef);

  /** Parent game ID. */
  @Input({ required: true }) gameId!: string;

  /** Document ID to preview. */
  @Input({ required: true }) documentId!: string;

  /** Loaded content data. */
  readonly content = signal<DocumentContent | null>(null);

  /** Whether content is loading. */
  readonly loading = signal(true);

  /** Error message from the last operation. */
  readonly error = signal<string | null>(null);

  /** Set of collapsed section paths for tree state management. */
  readonly collapsedSections = signal<Set<string>>(new Set());

  ngOnInit(): void {
    this.loadContent();
  }

  /** Toggle the collapsed state of a section. */
  toggleSection(path: string): void {
    const current = this.collapsedSections();
    const next = new Set(current);
    if (next.has(path)) {
      next.delete(path);
    } else {
      next.add(path);
    }
    this.collapsedSections.set(next);
  }

  /** Check whether a section is currently collapsed. */
  isSectionCollapsed(path: string): boolean {
    return this.collapsedSections().has(path);
  }

  /**
   * Build a unique path for a section node used as collapse/expand key.
   *
   * @param parentPath - The parent section's path (empty string for root).
   * @param index - The section's index within its siblings.
   * @returns A dot-separated path string.
   */
  buildSectionPath(parentPath: string, index: number): string {
    return parentPath ? `${parentPath}.${index}` : `${index}`;
  }

  /** Dismiss the error banner. */
  dismissError(): void {
    this.error.set(null);
  }

  /** Format a confidence value for display. */
  formatConfidence(confidence: string): string {
    return confidence.charAt(0).toUpperCase() + confidence.slice(1);
  }

  /** Format a number with locale-appropriate separators. */
  formatNumber(value: number): string {
    return value.toLocaleString();
  }

  /** Load content preview from the API. */
  private loadContent(): void {
    this.loading.set(true);
    this.error.set(null);

    this.documentService
      .getContentPreview(this.gameId, this.documentId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (content) => {
          this.content.set(content);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Failed to load content preview.');
          this.loading.set(false);
        },
      });
  }
}
