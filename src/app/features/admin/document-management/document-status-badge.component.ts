import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { DocumentStatus } from '../../../models/document.model';

/**
 * Status badge for document processing state.
 *
 * Displays a colour-coded badge indicating the document's current
 * processing status: uploaded (grey), parsing (blue pulse), processed
 * (green), or error (red).
 */
@Component({
  selector: 'app-document-status-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="status-badge"
      [class.status-badge--uploaded]="status === 'uploaded'"
      [class.status-badge--parsing]="status === 'parsing'"
      [class.status-badge--processed]="status === 'processed'"
      [class.status-badge--error]="status === 'error'"
      [attr.aria-label]="'Status: ' + statusLabel"
    >
      {{ statusLabel }}
    </span>
  `,
  styleUrl: './document-status-badge.component.scss',
})
export class DocumentStatusBadgeComponent {
  /** Current document processing status. */
  @Input({ required: true }) status!: DocumentStatus;

  /** Human-readable label for the status. */
  get statusLabel(): string {
    switch (this.status) {
      case 'uploaded':
        return 'Uploaded';
      case 'parsing':
        return 'Processing';
      case 'processed':
        return 'Processed';
      case 'error':
        return 'Error';
      default:
        return 'Unknown';
    }
  }
}
