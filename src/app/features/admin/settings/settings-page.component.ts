import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ErrorBannerComponent } from '../../../shared/components/error-banner/error-banner.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { AdminSettingsService } from '../../../core/services/admin-settings.service';
import { GuardrailConfig } from '../../../models/guardrail-config.model';
import { ModelSlot } from '../../../models/model-slot.model';
import { GuardrailConfigComponent } from './guardrail-config.component';
import { ModelSlotEditorComponent } from './model-slot-editor.component';

/**
 * Settings page container component.
 *
 * Replaces SettingsPlaceholderComponent. Loads model slot and guardrail
 * configuration data and delegates display/editing to child components.
 * Handles top-level loading and error states for initial data fetch.
 *
 * Route: /admin/settings
 */
@Component({
  selector: 'app-settings-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ModelSlotEditorComponent,
    GuardrailConfigComponent,
    LoadingSpinnerComponent,
    ErrorBannerComponent,
  ],
  templateUrl: './settings-page.component.html',
  styleUrl: './settings-page.component.scss',
})
export class SettingsPageComponent implements OnInit {
  private readonly settingsService = inject(AdminSettingsService);

  /** Loaded model slots, null while loading. */
  readonly modelSlots = signal<ModelSlot[] | null>(null);

  /** Loaded guardrail config, null while loading. */
  readonly guardrailConfig = signal<GuardrailConfig | null>(null);

  /** Error message for model slot loading failure. */
  readonly slotsError = signal<string | null>(null);

  /** Error message for guardrail config loading failure. */
  readonly guardrailError = signal<string | null>(null);

  ngOnInit(): void {
    this.loadModelSlots();
    this.loadGuardrailConfig();
  }

  /** Reload model slots (e.g., after dismissing an error). */
  retryLoadSlots(): void {
    this.slotsError.set(null);
    this.modelSlots.set(null);
    this.loadModelSlots();
  }

  /** Reload guardrail config (e.g., after dismissing an error). */
  retryLoadGuardrail(): void {
    this.guardrailError.set(null);
    this.guardrailConfig.set(null);
    this.loadGuardrailConfig();
  }

  /** Update local slot state after a child component saves successfully. */
  onSlotUpdated(updated: ModelSlot): void {
    this.modelSlots.update(
      (slots) => slots?.map((s) => (s.capability === updated.capability ? updated : s)) ?? null,
    );
  }

  /** Update local guardrail config after a child component saves. */
  onConfigUpdated(updated: GuardrailConfig): void {
    this.guardrailConfig.set(updated);
  }

  private loadModelSlots(): void {
    this.settingsService.listModelSlots().subscribe({
      next: (slots) => this.modelSlots.set(slots),
      error: (err) => this.slotsError.set(err?.error?.message ?? 'Failed to load model slots.'),
    });
  }

  private loadGuardrailConfig(): void {
    this.settingsService.getGuardrailConfig().subscribe({
      next: (config) => this.guardrailConfig.set(config),
      error: (err) =>
        this.guardrailError.set(err?.error?.message ?? 'Failed to load guardrail configuration.'),
    });
  }
}
