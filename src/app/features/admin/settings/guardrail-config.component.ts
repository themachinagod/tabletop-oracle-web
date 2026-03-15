import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ErrorBannerComponent } from '../../../shared/components/error-banner/error-banner.component';
import { AdminSettingsService } from '../../../core/services/admin-settings.service';
import { GuardrailConfig, GuardrailConfigUpdate } from '../../../models/guardrail-config.model';

/**
 * Guardrail configuration editor component.
 *
 * Displays the current guardrail settings with an inline form for
 * updating enforcement status and token/query limits. Limit fields
 * are visually muted when enforcement is disabled, but remain editable
 * so curators can pre-configure limits before enabling enforcement.
 *
 * Route: n/a (child of SettingsPageComponent)
 */
@Component({
  selector: 'app-guardrail-config',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, ErrorBannerComponent],
  templateUrl: './guardrail-config.component.html',
  styleUrl: './guardrail-config.component.scss',
})
export class GuardrailConfigComponent {
  private readonly settingsService = inject(AdminSettingsService);
  private readonly fb = new FormBuilder();

  /** Current guardrail config from the parent. */
  readonly config = input.required<GuardrailConfig>();

  /** Emitted with the updated config after a successful save. */
  readonly configUpdated = output<GuardrailConfig>();

  /** Whether the form is in edit mode. */
  readonly editing = signal(false);

  /** Whether a save operation is in progress. */
  readonly saving = signal(false);

  /** Error message from failed save, if any. */
  readonly error = signal<string | null>(null);

  /** Reactive form for guardrail fields. */
  readonly form = this.fb.group({
    enforcement_enabled: [false],
    max_tokens_per_query: [null as number | null, [Validators.min(1)]],
    max_model_calls_per_query: [null as number | null, [Validators.min(1)]],
    max_queries_per_session: [null as number | null, [Validators.min(1)]],
    daily_token_budget: [null as number | null, [Validators.min(1)]],
    daily_query_budget: [null as number | null, [Validators.min(1)]],
    per_document_ingestion_limit: [null as number | null, [Validators.min(1)]],
  });

  /** Whether enforcement is currently toggled on in the form. */
  readonly enforcementEnabled = signal(false);

  constructor() {
    effect(() => {
      const enabled = this.form.get('enforcement_enabled')?.value;
      this.enforcementEnabled.set(!!enabled);
    });
  }

  /** Track enforcement toggle changes. */
  onEnforcementChange(): void {
    const enabled = this.form.get('enforcement_enabled')?.value;
    this.enforcementEnabled.set(!!enabled);
  }

  /** Enter edit mode and populate form with current config. */
  startEditing(): void {
    const c = this.config();
    this.form.patchValue({
      enforcement_enabled: c.enforcement_enabled,
      max_tokens_per_query: c.max_tokens_per_query,
      max_model_calls_per_query: c.max_model_calls_per_query,
      max_queries_per_session: c.max_queries_per_session,
      daily_token_budget: c.daily_token_budget,
      daily_query_budget: c.daily_query_budget,
      per_document_ingestion_limit: c.per_document_ingestion_limit,
    });
    this.enforcementEnabled.set(c.enforcement_enabled);
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
    const update: GuardrailConfigUpdate = {
      enforcement_enabled: raw.enforcement_enabled ?? false,
      max_tokens_per_query: raw.max_tokens_per_query,
      max_model_calls_per_query: raw.max_model_calls_per_query,
      max_queries_per_session: raw.max_queries_per_session,
      daily_token_budget: raw.daily_token_budget,
      daily_query_budget: raw.daily_query_budget,
      per_document_ingestion_limit: raw.per_document_ingestion_limit,
    };

    this.saving.set(true);
    this.error.set(null);

    this.settingsService.updateGuardrailConfig(update).subscribe({
      next: (updated) => {
        this.configUpdated.emit(updated);
        this.editing.set(false);
        this.saving.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Failed to update guardrail configuration.');
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
