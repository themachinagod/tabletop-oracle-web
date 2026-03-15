import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ModelSlot } from '../../../models/model-slot.model';

/** Display-friendly labels for AI capabilities. */
const CAPABILITY_LABELS: Record<string, string> = {
  intent_analysis: 'Intent Analysis',
  retrieval_augmentation: 'Retrieval Augmentation',
  answer_synthesis: 'Answer Synthesis',
  clarification_generation: 'Clarification Generation',
  concept_extraction: 'Concept Extraction',
  vision_processing: 'Vision Processing',
};

/**
 * Active model configuration display.
 *
 * Read-only display of which AI model is assigned to each capability.
 * Includes a link to the Settings page for editing.
 */
@Component({
  selector: 'app-active-model-config',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div class="model-config">
      <div class="model-config__header">
        <h3 class="model-config__title">Active Model Configuration</h3>
        <a class="model-config__link" routerLink="/admin/settings">Edit in Settings</a>
      </div>
      <div class="model-config__grid">
        @for (slot of slots(); track slot.capability) {
          <div class="model-config__slot">
            <span class="model-config__capability">
              {{ capabilityLabel(slot.capability) }}
            </span>
            <span class="model-config__model"> {{ slot.provider }} / {{ slot.model_id }} </span>
            <span class="model-config__params">
              @if (slot.temperature !== null) {
                temp: {{ slot.temperature }}
              }
              @if (slot.max_tokens_per_call !== null) {
                &middot; max: {{ slot.max_tokens_per_call }}
              }
            </span>
          </div>
        }
      </div>
    </div>
  `,
  styleUrl: './active-model-config.component.scss',
})
export class ActiveModelConfigComponent {
  /** Model slot data from the settings service. */
  readonly slots = input.required<ModelSlot[]>();

  /** Get display-friendly label for a capability. */
  capabilityLabel(capability: string): string {
    return CAPABILITY_LABELS[capability] ?? capability;
  }
}
