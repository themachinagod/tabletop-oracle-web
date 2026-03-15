import { Component, Input } from '@angular/core';

/**
 * Full-view loading indicator.
 *
 * Displays a centered spinner with an optional message.
 * Used as the primary loading state for view-level data fetches.
 */
@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  template: `
    <div class="loading-spinner" role="status" aria-live="polite">
      <div class="loading-spinner__circle" aria-hidden="true"></div>
      <span class="loading-spinner__message">{{ message }}</span>
    </div>
  `,
  styleUrl: './loading-spinner.component.scss',
})
export class LoadingSpinnerComponent {
  /** Message displayed below the spinner. */
  @Input() message = 'Loading...';
}
