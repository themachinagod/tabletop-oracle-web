import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DecimalPipe, PercentPipe } from '@angular/common';
import { CapabilityUsage } from '../../../models/usage.model';

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
 * Capability breakdown table showing token usage per AI capability.
 *
 * Displays a table sorted by total tokens descending, with a
 * computed percentage-of-total column.
 */
@Component({
  selector: 'app-capability-breakdown',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe, PercentPipe],
  template: `
    <div class="breakdown">
      <h3 class="breakdown__title">Usage by Capability</h3>
      <div class="breakdown__table-wrap">
        <table class="breakdown__table">
          <thead>
            <tr>
              <th>Capability</th>
              <th class="breakdown__num">Total Tokens</th>
              <th class="breakdown__num">Calls</th>
              <th class="breakdown__num">% of Total</th>
            </tr>
          </thead>
          <tbody>
            @for (row of sortedData(); track row.capability) {
              <tr>
                <td>{{ capabilityLabel(row.capability) }}</td>
                <td class="breakdown__num">{{ row.total_tokens | number }}</td>
                <td class="breakdown__num">{{ row.call_count | number }}</td>
                <td class="breakdown__num">
                  {{ percentOfTotal(row.total_tokens) | percent: '1.1-1' }}
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styleUrl: './breakdown-table.component.scss',
})
export class CapabilityBreakdownComponent {
  /** Capability usage data from the API. */
  readonly data = input.required<CapabilityUsage[]>();

  /** Data sorted by total_tokens descending. */
  readonly sortedData = computed(() =>
    [...this.data()].sort((a, b) => b.total_tokens - a.total_tokens),
  );

  /** Sum of all tokens across capabilities. */
  private readonly totalTokens = computed(() =>
    this.data().reduce((sum, row) => sum + row.total_tokens, 0),
  );

  /** Get display-friendly label for a capability. */
  capabilityLabel(capability: string): string {
    return CAPABILITY_LABELS[capability] ?? capability;
  }

  /** Compute fraction of total tokens. */
  percentOfTotal(tokens: number): number {
    const total = this.totalTokens();
    return total > 0 ? tokens / total : 0;
  }
}
