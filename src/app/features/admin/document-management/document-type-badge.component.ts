import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { DocumentType, DOCUMENT_TYPE_LABELS } from '../../../models/document.model';

/**
 * Colour-coded badge for document type classification.
 *
 * Displays a styled badge with the document type label. Colours follow
 * the design spec: Core Rules=blue, FAQ=green, Errata=red,
 * Expansion Rules=purple, Strategy=amber, Other=grey.
 */
@Component({
  selector: 'app-document-type-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="type-badge" [class]="'type-badge type-badge--' + type">
      {{ label }}
    </span>
  `,
  styleUrl: './document-type-badge.component.scss',
})
export class DocumentTypeBadgeComponent {
  /** Document type to display. */
  @Input({ required: true }) type!: DocumentType;

  /** Human-readable label for the type. */
  get label(): string {
    return DOCUMENT_TYPE_LABELS[this.type] ?? 'Unknown';
  }
}
