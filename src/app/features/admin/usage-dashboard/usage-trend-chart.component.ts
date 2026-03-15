import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { DailyUsage } from '../../../models/usage.model';

/**
 * Usage trend chart using CSS bars.
 *
 * Displays daily token usage as a responsive bar chart. Each bar
 * represents one day's total tokens, scaled relative to the maximum
 * daily value. Hovering shows the exact value.
 *
 * Uses pure CSS rendering rather than a charting library to avoid
 * an additional dependency. Can be upgraded to Chart.js/ng2-charts
 * if richer chart interactions are needed.
 */
@Component({
  selector: 'app-usage-trend-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe],
  template: `
    <div class="trend-chart">
      <h3 class="trend-chart__title">Token Usage Trend</h3>
      <div class="trend-chart__chart" role="img" aria-label="Daily token usage trend">
        @for (day of trends(); track day.date) {
          <div
            class="trend-chart__bar-container"
            [title]="day.date + ': ' + (day.total_tokens | number) + ' tokens'"
          >
            <div class="trend-chart__bar" [style.height.%]="barHeight(day)"></div>
          </div>
        }
      </div>
      <div class="trend-chart__axis">
        <span>{{ firstDate() }}</span>
        <span>{{ lastDate() }}</span>
      </div>
      <div class="trend-chart__legend">
        <span class="trend-chart__legend-item"> Peak: {{ maxTokens() | number }} tokens/day </span>
      </div>
    </div>
  `,
  styleUrl: './usage-trend-chart.component.scss',
})
export class UsageTrendChartComponent {
  /** Daily usage trend data from the API. */
  readonly trends = input.required<DailyUsage[]>();

  /** Maximum token count across all days, used for scaling bars. */
  readonly maxTokens = computed(() => {
    const data = this.trends();
    if (data.length === 0) return 0;
    return Math.max(...data.map((d) => d.total_tokens));
  });

  /** First date label for the x-axis. */
  readonly firstDate = computed(() => {
    const data = this.trends();
    return data.length > 0 ? data[0].date : '';
  });

  /** Last date label for the x-axis. */
  readonly lastDate = computed(() => {
    const data = this.trends();
    return data.length > 0 ? data[data.length - 1].date : '';
  });

  /** Compute bar height as a percentage of the maximum. */
  barHeight(day: DailyUsage): number {
    const max = this.maxTokens();
    if (max === 0) return 0;
    return (day.total_tokens / max) * 100;
  }
}
