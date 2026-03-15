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
import { ExpansionDetail } from '../../../models/game.model';
import {
  ALLOWED_EXTENSIONS,
  DOCUMENT_TYPE_LABELS,
  DOCUMENT_TYPE_OPTIONS,
  DocumentType,
  MAX_FILE_SIZE_BYTES,
  UploadClassification,
} from '../../../models/document.model';
import { AdminDocumentService } from '../../../core/services/admin-document.service';

/** Tracks per-file upload state within the upload zone. */
interface UploadItem {
  file: File;
  name: string;
  type: DocumentType;
  expansionId: string | null;
  uploading: boolean;
  error: string | null;
  validationError: string | null;
}

/**
 * Drag-and-drop document upload zone.
 *
 * Supports multi-file selection via drag-and-drop or file picker.
 * Each file gets a classification form (name, type, expansion)
 * before upload. Client-side validation enforces format and size
 * constraints.
 */
@Component({
  selector: 'app-document-upload',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './document-upload.component.html',
  styleUrl: './document-upload.component.scss',
})
export class DocumentUploadComponent {
  private readonly documentService = inject(AdminDocumentService);
  private readonly destroyRef = inject(DestroyRef);

  /** Parent game ID. */
  @Input({ required: true }) gameId!: string;

  /** Available expansions for this game. */
  @Input() expansions: ExpansionDetail[] = [];

  /** Emitted after a successful upload to trigger list refresh. */
  @Output() uploaded = new EventEmitter<void>();

  /** Files queued for upload. */
  readonly uploadItems = signal<UploadItem[]>([]);

  /** Whether the drag zone is in hover state. */
  readonly isDragOver = signal(false);

  /** Document type options for dropdowns. */
  readonly typeOptions = DOCUMENT_TYPE_OPTIONS;

  /** Document type labels for display. */
  readonly typeLabels = DOCUMENT_TYPE_LABELS;

  /** Handle drag over to show visual feedback. */
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(true);
  }

  /** Handle drag leave to remove visual feedback. */
  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
  }

  /** Handle file drop. */
  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);

    const files = event.dataTransfer?.files;
    if (files) {
      this.addFiles(Array.from(files));
    }
  }

  /** Handle file picker selection. */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.addFiles(Array.from(input.files));
      input.value = '';
    }
  }

  /** Update the display name for an upload item. */
  updateName(index: number, name: string): void {
    this.updateItem(index, { name });
  }

  /** Update the document type for an upload item. */
  updateType(index: number, type: DocumentType): void {
    this.updateItem(index, { type });
  }

  /** Update the expansion association for an upload item. */
  updateExpansion(index: number, expansionId: string): void {
    this.updateItem(index, { expansionId: expansionId || null });
  }

  /** Remove an item from the upload queue. */
  removeItem(index: number): void {
    this.uploadItems.update((items) => items.filter((_, i) => i !== index));
  }

  /** Upload a single file. */
  uploadFile(index: number): void {
    const items = this.uploadItems();
    const item = items[index];
    if (!item || item.uploading || item.validationError) return;

    this.updateItem(index, { uploading: true, error: null });

    const classification: UploadClassification = {
      name: item.name,
      type: item.type,
      expansion_id: item.expansionId,
    };

    this.documentService
      .uploadDocument(this.gameId, item.file, classification)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.uploadItems.update((current) => current.filter((_, i) => i !== index));
          this.uploaded.emit();
        },
        error: () => {
          this.updateItem(index, { uploading: false, error: 'Upload failed. Please try again.' });
        },
      });
  }

  /** Upload all valid queued files. */
  uploadAll(): void {
    const items = this.uploadItems();
    items.forEach((item, index) => {
      if (!item.uploading && !item.validationError) {
        this.uploadFile(index);
      }
    });
  }

  /** Format file size for display. */
  formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  /** Whether any items are ready to upload. */
  get hasUploadableItems(): boolean {
    return this.uploadItems().some((item) => !item.uploading && !item.validationError);
  }

  /** Add files to the upload queue with validation. */
  private addFiles(files: File[]): void {
    const newItems: UploadItem[] = files.map((file) => ({
      file,
      name: this.fileNameWithoutExtension(file.name),
      type: 'other' as DocumentType,
      expansionId: null,
      uploading: false,
      error: null,
      validationError: this.validateFile(file),
    }));

    this.uploadItems.update((items) => [...items, ...newItems]);
  }

  /** Validate file format and size. Returns error message or null. */
  private validateFile(file: File): string | null {
    const extension = this.getFileExtension(file.name).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      return `Unsupported format. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return `File exceeds 50MB limit (${this.formatFileSize(file.size)})`;
    }
    return null;
  }

  /** Extract file extension including the dot. */
  private getFileExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    return lastDot >= 0 ? filename.substring(lastDot) : '';
  }

  /** Extract filename without extension. */
  private fileNameWithoutExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    return lastDot >= 0 ? filename.substring(0, lastDot) : filename;
  }

  /** Update a single item in the upload queue immutably. */
  private updateItem(index: number, updates: Partial<UploadItem>): void {
    this.uploadItems.update((items) =>
      items.map((item, i) => (i === index ? { ...item, ...updates } : item)),
    );
  }
}
