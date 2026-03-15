import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  signal,
  SimpleChanges,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ExpansionCreate, ExpansionDetail } from '../../../models/game.model';

/**
 * Expansion add/edit dialog.
 *
 * Presentational modal overlay component for creating or editing an
 * expansion. Renders a reactive form with name, description, and
 * year published fields. Emits the form payload on save and a cancel
 * event on dismissal.
 */
@Component({
  selector: 'app-expansion-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    @if (open) {
      <div
        class="expansion-form__overlay"
        (click)="onCancel()"
        (keydown.escape)="onCancel()"
        role="presentation"
      >
        <div
          class="expansion-form__dialog"
          role="dialog"
          [attr.aria-label]="expansion ? 'Edit Expansion' : 'Add Expansion'"
          aria-modal="true"
          (click)="$event.stopPropagation()"
          (keydown)="$event.stopPropagation()"
        >
          <h2 class="expansion-form__title">
            {{ expansion ? 'Edit Expansion' : 'Add Expansion' }}
          </h2>

          <form class="expansion-form" [formGroup]="form" (ngSubmit)="onSubmit()">
            <div class="expansion-form__field">
              <label class="expansion-form__label" for="exp-name">
                Name <span class="expansion-form__required">*</span>
              </label>
              <input
                id="exp-name"
                class="expansion-form__input"
                [class.expansion-form__input--error]="hasError('name')"
                formControlName="name"
                type="text"
                placeholder="Expansion name"
                aria-required="true"
              />
              @if (hasError('name')) {
                <span class="expansion-form__error" role="alert">
                  Expansion name is required.
                </span>
              }
            </div>

            <div class="expansion-form__field">
              <label class="expansion-form__label" for="exp-year">Year Published</label>
              <input
                id="exp-year"
                class="expansion-form__input"
                formControlName="year_published"
                type="number"
                placeholder="e.g. 2024"
              />
            </div>

            <div class="expansion-form__field">
              <label class="expansion-form__label" for="exp-description">Description</label>
              <textarea
                id="exp-description"
                class="expansion-form__textarea"
                formControlName="description"
                placeholder="Brief description of the expansion"
                rows="3"
              ></textarea>
            </div>

            <div class="expansion-form__actions">
              <button class="expansion-form__cancel-btn" type="button" (click)="onCancel()">
                Cancel
              </button>
              <button class="expansion-form__submit-btn" type="submit" [disabled]="submitting">
                {{ submitting ? 'Saving...' : expansion ? 'Save Changes' : 'Add Expansion' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
  styleUrl: './expansion-form.component.scss',
})
export class ExpansionFormComponent implements OnChanges {
  private readonly fb = new FormBuilder();

  /** Whether the dialog is open. */
  @Input() open = false;

  /** Existing expansion for edit mode. Null for create mode. */
  @Input() expansion: ExpansionDetail | null = null;

  /** Whether the form is currently submitting. */
  @Input() submitting = false;

  /** Emitted with form data when the user saves. */
  @Output() saved = new EventEmitter<ExpansionCreate>();

  /** Emitted when the user cancels or dismisses the dialog. */
  @Output() cancelled = new EventEmitter<void>();

  /** Reactive form definition. */
  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(200)]],
    year_published: [null as number | null],
    description: [''],
  });

  /** Track whether the form has been submitted for validation display. */
  readonly submitted = signal(false);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open'] && this.open) {
      this.resetForm();
    }
    if (changes['expansion'] && this.expansion && this.open) {
      this.populateForm(this.expansion);
    }
  }

  /** Handle form submission. */
  onSubmit(): void {
    this.submitted.set(true);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const payload: ExpansionCreate = {
      name: raw.name!.trim(),
    };

    if (raw.description?.trim()) {
      payload.description = raw.description.trim();
    }
    if (raw.year_published != null) {
      payload.year_published = raw.year_published;
    }

    this.saved.emit(payload);
  }

  /** Handle cancel action. */
  onCancel(): void {
    this.cancelled.emit();
  }

  /** Check if a form field has an error and has been touched. */
  hasError(field: string): boolean {
    const control = this.form.get(field);
    return !!control && control.invalid && control.touched;
  }

  /** Reset the form to initial state. */
  private resetForm(): void {
    this.form.reset({ name: '', year_published: null, description: '' });
    this.submitted.set(false);
    if (this.expansion) {
      this.populateForm(this.expansion);
    }
  }

  /** Pre-populate form with existing expansion data. */
  private populateForm(expansion: ExpansionDetail): void {
    this.form.patchValue({
      name: expansion.name,
      year_published: expansion.year_published,
      description: expansion.description ?? '',
    });
  }
}
