import { Component, EventEmitter, Input, Output } from '@angular/core';

/**
 * Dismissible error banner for operational errors.
 *
 * Displays a prominent error message with an optional dismiss button.
 * Used for API errors, network failures, and other transient problems
 * that the user should be aware of but can dismiss.
 */
@Component({
  selector: 'app-error-banner',
  standalone: true,
  template: `
    <div class="error-banner" role="alert">
      <span class="error-banner__message">{{ message }}</span>
      @if (dismissible) {
        <button
          class="error-banner__dismiss"
          (click)="dismissed.emit()"
          aria-label="Dismiss error"
          type="button"
        >
          &times;
        </button>
      }
    </div>
  `,
  styleUrl: './error-banner.component.scss',
})
export class ErrorBannerComponent {
  /** Error message to display. */
  @Input({ required: true }) message!: string;

  /** Whether the banner can be dismissed. */
  @Input() dismissible = true;

  /** Emitted when the user dismisses the banner. */
  @Output() dismissed = new EventEmitter<void>();
}
