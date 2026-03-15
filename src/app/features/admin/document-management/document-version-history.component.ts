import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DocumentVersion } from '../../../models/document.model';
import { AdminDocumentService } from '../../../core/services/admin-document.service';
import { ErrorBannerComponent } from '../../../shared/components/error-banner/error-banner.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { RelativeTimePipe } from '../../../shared/pipes/relative-time.pipe';

/**
 * Document version history list.
 *
 * Displays all versions of a document ordered newest first. The active
 * version is highlighted. Includes an "Upload New Version" button that
 * opens a file picker.
 */
@Component({
  selector: 'app-document-version-history',
  standalone: true,
  imports: [ErrorBannerComponent, LoadingSpinnerComponent, RelativeTimePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './document-version-history.component.html',
  styleUrl: './document-version-history.component.scss',
})
export class DocumentVersionHistoryComponent implements OnInit {
  private readonly documentService = inject(AdminDocumentService);
  private readonly destroyRef = inject(DestroyRef);

  /** Parent game ID. */
  @Input({ required: true }) gameId!: string;

  /** Document ID. */
  @Input({ required: true }) documentId!: string;

  /** Emitted after a new version is uploaded. */
  @Output() versionUploaded = new EventEmitter<void>();

  /** Version entries. */
  readonly versions = signal<DocumentVersion[]>([]);

  /** Whether versions are loading. */
  readonly loading = signal(true);

  /** Error message from the last operation. */
  readonly error = signal<string | null>(null);

  /** Whether a version upload is in progress. */
  readonly uploading = signal(false);

  ngOnInit(): void {
    this.loadVersions();
  }

  /** Handle file selection for new version upload. */
  onVersionFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    input.value = '';

    this.uploading.set(true);
    this.error.set(null);

    this.documentService
      .uploadVersion(this.gameId, this.documentId, file)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.uploading.set(false);
          this.loadVersions();
          this.versionUploaded.emit();
        },
        error: () => {
          this.error.set('Failed to upload new version. Please try again.');
          this.uploading.set(false);
        },
      });
  }

  /** Dismiss the error banner. */
  dismissError(): void {
    this.error.set(null);
  }

  /** Format file size for display. */
  formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  /** Load version history from the API. */
  private loadVersions(): void {
    this.loading.set(true);

    this.documentService
      .getVersionHistory(this.gameId, this.documentId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (versions) => {
          this.versions.set(versions);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Failed to load version history.');
          this.loading.set(false);
        },
      });
  }
}
