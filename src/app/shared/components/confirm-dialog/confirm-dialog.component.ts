import { Component, EventEmitter, Input, Output } from '@angular/core';

/**
 * Modal confirmation dialog.
 *
 * Used for archive/delete actions that require user confirmation.
 * Renders a centered dialog with a backdrop overlay. Supports keyboard
 * dismissal (Escape to cancel) and overlay click to cancel.
 */
@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  template: `
    @if (open) {
      <div
        class="confirm-dialog__overlay"
        (click)="onCancel()"
        (keydown.escape)="onCancel()"
        role="presentation"
      >
        <div
          class="confirm-dialog"
          role="alertdialog"
          [attr.aria-label]="title"
          aria-modal="true"
          (click)="$event.stopPropagation()"
          (keydown)="$event.stopPropagation()"
        >
          <h2 class="confirm-dialog__title">{{ title }}</h2>
          <p class="confirm-dialog__message">{{ message }}</p>
          <div class="confirm-dialog__actions">
            <button class="confirm-dialog__cancel" (click)="onCancel()" type="button">
              {{ cancelLabel }}
            </button>
            <button
              class="confirm-dialog__confirm"
              [class.confirm-dialog__confirm--destructive]="destructive"
              (click)="onConfirm()"
              type="button"
            >
              {{ confirmLabel }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styleUrl: './confirm-dialog.component.scss',
})
export class ConfirmDialogComponent {
  /** Whether the dialog is open. */
  @Input() open = false;

  /** Dialog title. */
  @Input({ required: true }) title!: string;

  /** Dialog body message. */
  @Input({ required: true }) message!: string;

  /** Label for the confirm button. */
  @Input() confirmLabel = 'Confirm';

  /** Label for the cancel button. */
  @Input() cancelLabel = 'Cancel';

  /** Whether the action is destructive (styles confirm button red). */
  @Input() destructive = false;

  /** Emitted when the user confirms. */
  @Output() confirmed = new EventEmitter<void>();

  /** Emitted when the user cancels. */
  @Output() cancelled = new EventEmitter<void>();

  /** Handle confirm action. */
  onConfirm(): void {
    this.confirmed.emit();
  }

  /** Handle cancel action. */
  onCancel(): void {
    this.cancelled.emit();
  }
}
