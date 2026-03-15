import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ErrorBannerComponent } from '../../../shared/components/error-banner/error-banner.component';
import { AdminSettingsService } from '../../../core/services/admin-settings.service';
import { ModelCapability, ModelSlot, ModelSlotUpdate } from '../../../models/model-slot.model';

/** Human-readable labels for each AI capability. */
const CAPABILITY_LABELS: Record<ModelCapability, string> = {
  intent_analysis: 'Intent Analysis',
  retrieval_augmentation: 'Retrieval Augmentation',
  answer_synthesis: 'Answer Synthesis',
  clarification_generation: 'Clarification Generation',
  concept_extraction: 'Concept Extraction',
  vision_processing: 'Vision Processing',
};

/**
 * Inline editor for a single model slot.
 *
 * Displays slot configuration in a card layout. Clicking "Edit" reveals
 * a form for updating provider, model, temperature, token limits, and
 * fallback settings. Emits the updated slot on successful save.
 *
 * Route: n/a (child of SettingsPageComponent)
 */
@Component({
  selector: 'app-model-slot-editor',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, ErrorBannerComponent],
  templateUrl: './model-slot-editor.component.html',
  styleUrl: './model-slot-editor.component.scss',
})
export class ModelSlotEditorComponent {
  private readonly settingsService = inject(AdminSettingsService);
  private readonly fb = new FormBuilder();

  /** The model slot to display/edit. */
  readonly slot = input.required<ModelSlot>();

  /** Emitted with the updated slot after a successful save. */
  readonly slotUpdated = output<ModelSlot>();

  /** Whether the edit form is visible. */
  readonly editing = signal(false);

  /** Whether a save operation is in progress. */
  readonly saving = signal(false);

  /** Error message from failed save, if any. */
  readonly error = signal<string | null>(null);

  /** Display-friendly capability label. */
  readonly capabilityLabel = computed(() => CAPABILITY_LABELS[this.slot().capability]);

  /** Reactive form for editing slot fields. */
  readonly form = this.fb.group({
    provider: ['', [Validators.required]],
    model_id: ['', [Validators.required]],
    temperature: [null as number | null, [Validators.min(0), Validators.max(2)]],
    max_tokens_per_call: [null as number | null, [Validators.min(1)]],
    fallback_provider: [''],
    fallback_model_id: [''],
  });

  /** Enter edit mode and populate form with current slot values. */
  startEditing(): void {
    const s = this.slot();
    this.form.patchValue({
      provider: s.provider,
      model_id: s.model_id,
      temperature: s.temperature,
      max_tokens_per_call: s.max_tokens_per_call,
      fallback_provider: s.fallback_provider ?? '',
      fallback_model_id: s.fallback_model_id ?? '',
    });
    this.error.set(null);
    this.editing.set(true);
  }

  /** Cancel editing without saving. */
  cancelEditing(): void {
    this.editing.set(false);
    this.error.set(null);
  }

  /** Save the form values as a partial update. */
  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const update: ModelSlotUpdate = {
      provider: raw.provider!.trim(),
      model_id: raw.model_id!.trim(),
      temperature: raw.temperature,
      max_tokens_per_call: raw.max_tokens_per_call,
      fallback_provider: raw.fallback_provider?.trim() || null,
      fallback_model_id: raw.fallback_model_id?.trim() || null,
    };

    this.saving.set(true);
    this.error.set(null);

    this.settingsService.updateModelSlot(this.slot().capability, update).subscribe({
      next: (updated) => {
        this.slotUpdated.emit(updated);
        this.editing.set(false);
        this.saving.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Failed to update model slot.');
        this.saving.set(false);
      },
    });
  }

  /** Check if a form field has a validation error and has been touched. */
  hasError(field: string): boolean {
    const control = this.form.get(field);
    return !!control && control.invalid && control.touched;
  }
}
