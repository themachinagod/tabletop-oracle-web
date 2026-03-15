import { Component, EventEmitter, Input, Output } from '@angular/core';

/**
 * Configurable empty state placeholder.
 *
 * Displays a centered message with an optional icon and action button.
 * Used for "No active sessions", "No games match your search", etc.
 */
@Component({
  selector: 'app-empty-state',
  standalone: true,
  template: `
    <div class="empty-state" role="status">
      @if (icon) {
        <span class="empty-state__icon" aria-hidden="true">{{ icon }}</span>
      }
      <p class="empty-state__message">{{ message }}</p>
      @if (actionLabel) {
        <button class="empty-state__action" (click)="actionClicked.emit()" type="button">
          {{ actionLabel }}
        </button>
      }
    </div>
  `,
  styleUrl: './empty-state.component.scss',
})
export class EmptyStateComponent {
  /** Primary message describing the empty state. */
  @Input({ required: true }) message!: string;

  /** Optional icon character or emoji displayed above the message. */
  @Input() icon: string | null = null;

  /** Optional action button label. When set, a button is rendered. */
  @Input() actionLabel: string | null = null;

  /** Emitted when the action button is clicked. */
  @Output() actionClicked = new EventEmitter<void>();
}
