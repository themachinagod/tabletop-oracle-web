import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { UsageSummary } from '../../../models/usage.model';

/**
 * Summary cards showing key usage metrics.
 *
 * Displays total tokens, queries, documents processed, and a token
 * breakdown (input/output) as a row of highlight cards.
 */
@Component({
  selector: 'app-usage-summary-cards',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe],
  template: `
    <div class="summary-cards">
      <div class="summary-cards__card">
        <span class="summary-cards__label">Total Tokens</span>
        <span class="summary-cards__value">{{ formattedTokens() }}</span>
        <span class="summary-cards__detail">
          In: {{ summary().input_tokens | number }} / Out: {{ summary().output_tokens | number }}
        </span>
      </div>

      <div class="summary-cards__card">
        <span class="summary-cards__label">Queries</span>
        <span class="summary-cards__value">{{ summary().total_queries | number }}</span>
        <span class="summary-cards__detail">{{ periodLabel() }}</span>
      </div>

      <div class="summary-cards__card">
        <span class="summary-cards__label">Documents Processed</span>
        <span class="summary-cards__value">{{ summary().total_documents_processed | number }}</span>
        <span class="summary-cards__detail">{{ periodLabel() }}</span>
      </div>

      <div class="summary-cards__card">
        <span class="summary-cards__label">Avg Tokens / Query</span>
        <span class="summary-cards__value">{{ avgTokensPerQuery() | number: '1.0-0' }}</span>
        <span class="summary-cards__detail">{{ periodLabel() }}</span>
      </div>
    </div>
  `,
  styleUrl: './usage-summary-cards.component.scss',
})
export class UsageSummaryCardsComponent {
  /** Usage summary data from the API. */
  readonly summary = input.required<UsageSummary>();

  /** Period label for context (e.g., "Last 30 days"). */
  readonly periodLabel = input.required<string>();

  /** Format large token counts compactly (e.g., 1.2M, 45.3K). */
  readonly formattedTokens = computed(() => {
    const tokens = this.summary().total_tokens;
    if (tokens >= 1_000_000) {
      return `${(tokens / 1_000_000).toFixed(1)}M`;
    }
    if (tokens >= 1_000) {
      return `${(tokens / 1_000).toFixed(1)}K`;
    }
    return tokens.toString();
  });

  /** Average tokens consumed per query. */
  readonly avgTokensPerQuery = computed(() => {
    const { total_tokens, total_queries } = this.summary();
    return total_queries > 0 ? total_tokens / total_queries : 0;
  });
}
