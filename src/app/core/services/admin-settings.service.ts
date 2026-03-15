import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GuardrailConfig, GuardrailConfigUpdate } from '../../models/guardrail-config.model';
import { ModelCapability, ModelSlot, ModelSlotUpdate } from '../../models/model-slot.model';
import { ApiService } from '../api/api.service';

/**
 * Admin settings service for model slot and guardrail configuration.
 *
 * Provides CRUD operations for the AI model configuration and
 * guardrail limits. All endpoints require curator role (enforced
 * server-side via session auth).
 */
@Injectable({ providedIn: 'root' })
export class AdminSettingsService {
  private readonly api = inject(ApiService);

  /**
   * List all model slot configurations.
   *
   * @returns Observable of all 6 capability model slots.
   */
  listModelSlots(): Observable<ModelSlot[]> {
    return this.api.get<ModelSlot[]>('/admin/model-slots');
  }

  /**
   * Update a single model slot by capability.
   *
   * @param capability - The capability slot to update.
   * @param update - Partial update payload.
   * @returns Observable of the updated model slot.
   */
  updateModelSlot(capability: ModelCapability, update: ModelSlotUpdate): Observable<ModelSlot> {
    return this.api.put<ModelSlot>(`/admin/model-slots/${capability}`, update);
  }

  /**
   * Get the current guardrail configuration.
   *
   * @returns Observable of the guardrail config.
   */
  getGuardrailConfig(): Observable<GuardrailConfig> {
    return this.api.get<GuardrailConfig>('/admin/guardrail-config');
  }

  /**
   * Update the guardrail configuration.
   *
   * @param update - Partial update payload.
   * @returns Observable of the updated guardrail config.
   */
  updateGuardrailConfig(update: GuardrailConfigUpdate): Observable<GuardrailConfig> {
    return this.api.put<GuardrailConfig>('/admin/guardrail-config', update);
  }
}
