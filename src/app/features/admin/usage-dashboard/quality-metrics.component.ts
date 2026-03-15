import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DecimalPipe, PercentPipe } from '@angular/common';
import { GameQualityMetrics, ConfidenceDistribution } from '../../../models/quality-metrics.model';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

/**
 * Quality metrics table showing per-game quality indicators.
 *
 * Displays low-confidence rate, clarification rate, citation average,
 * feedback ratio, confidence distribution, and queries-per-session
 * for each game. Color-coded thresholds indicate quality levels.
 */
@Component({
  selector: 'app-quality-metrics',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe, PercentPipe, EmptyStateComponent],
  template: `
    <div class="quality">
      <h3 class="quality__title">Quality Metrics</h3>

      @if (sortedData().length === 0) {
        <app-empty-state
          message="No quality data for this period. Quality metrics are computed from game sessions."
        />
      } @else {
        <div class="quality__table-wrap">
          <table class="quality__table">
            <thead>
              <tr>
                <th>Game</th>
                <th class="quality__num">Low Conf.</th>
                <th class="quality__num">Clarification</th>
                <th class="quality__num">Avg Citations</th>
                <th class="quality__num">Feedback</th>
                <th>Confidence Dist.</th>
                <th class="quality__num">Queries/Session</th>
              </tr>
            </thead>
            <tbody>
              @for (row of sortedData(); track row.game_id) {
                <tr>
                  <td>{{ row.game_name }}</td>
                  <td class="quality__num">
                    <span
                      [class]="
                        'quality__indicator quality__indicator--' +
                        lowConfLevel(row.low_confidence_rate)
                      "
                    >
                      {{ row.low_confidence_rate | percent: '1.1-1' }}
                    </span>
                  </td>
                  <td class="quality__num">
                    <span
                      [class]="
                        'quality__indicator quality__indicator--' +
                        clarLevel(row.clarification_rate)
                      "
                    >
                      {{ row.clarification_rate | percent: '1.1-1' }}
                    </span>
                  </td>
                  <td class="quality__num">{{ row.avg_citations_per_answer | number: '1.1-1' }}</td>
                  <td class="quality__num">
                    <span class="quality__feedback">
                      <span class="quality__feedback-pos">{{ row.feedback_positive_count }}</span>
                      /
                      <span class="quality__feedback-neg">{{ row.feedback_negative_count }}</span>
                    </span>
                  </td>
                  <td>
                    <div class="quality__dist" [title]="distTitle(row.confidence_distribution)">
                      @for (seg of distSegments(row.confidence_distribution); track seg.label) {
                        <div
                          class="quality__dist-seg"
                          [class]="'quality__dist-seg--' + seg.level"
                          [style.flex]="seg.value"
                        ></div>
                      }
                    </div>
                  </td>
                  <td class="quality__num">{{ row.avg_queries_per_session | number: '1.1-1' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
  styleUrl: './quality-metrics.component.scss',
})
export class QualityMetricsComponent {
  /** Quality metrics data from the API. */
  readonly data = input.required<GameQualityMetrics[]>();

  /** Data sorted by game name. */
  readonly sortedData = computed(() =>
    [...this.data()].sort((a, b) => a.game_name.localeCompare(b.game_name)),
  );

  /** Threshold level for low-confidence rate. */
  lowConfLevel(rate: number): string {
    if (rate < 0.1) return 'green';
    if (rate < 0.25) return 'amber';
    return 'red';
  }

  /** Threshold level for clarification rate. */
  clarLevel(rate: number): string {
    if (rate < 0.15) return 'green';
    if (rate < 0.3) return 'amber';
    return 'red';
  }

  /** Build confidence distribution segments for the mini-bar. */
  distSegments(dist: ConfidenceDistribution): { label: string; value: number; level: string }[] {
    return [
      { label: '0-25%', value: dist['0_to_25'], level: 'red' },
      { label: '25-50%', value: dist['25_to_50'], level: 'amber' },
      { label: '50-75%', value: dist['50_to_75'], level: 'ok' },
      { label: '75-100%', value: dist['75_to_100'], level: 'green' },
    ];
  }

  /** Build tooltip text for the confidence distribution bar. */
  distTitle(dist: ConfidenceDistribution): string {
    return `0-25%: ${dist['0_to_25']}, 25-50%: ${dist['25_to_50']}, 50-75%: ${dist['50_to_75']}, 75-100%: ${dist['75_to_100']}`;
  }
}
