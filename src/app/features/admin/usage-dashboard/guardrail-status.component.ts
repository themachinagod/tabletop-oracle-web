import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { GuardrailStatus, GuardrailItem, GuardrailStatusLevel } from '../../../models/usage.model';

/**
 * Guardrail status indicators with progress bars.
 *
 * Displays each daily guardrail as a labeled progress bar colored
 * by status (green/amber/red). Shows enforcement state and a
 * banner when enforcement is disabled.
 */
@Component({
  selector: 'app-guardrail-status',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe],
  template: `
    <div class="guardrail-status">
      <h3 class="guardrail-status__title">Guardrail Status</h3>

      @if (!status().enforcement_enabled) {
        <div class="guardrail-status__banner" role="alert">
          Guardrail enforcement is disabled. Usage is tracked but limits are not enforced.
        </div>
      }

      @for (item of status().guardrails; track item.name) {
        <div class="guardrail-status__row">
          <div class="guardrail-status__header">
            <span class="guardrail-status__label">{{ item.label }}</span>
            <span
              class="guardrail-status__badge"
              [class]="'guardrail-status__badge--' + item.status"
            >
              {{ badgeText(item.status) }}
            </span>
          </div>
          <div class="guardrail-status__bar-track">
            <div
              class="guardrail-status__bar-fill"
              [class]="'guardrail-status__bar-fill--' + item.status"
              [style.width.%]="barWidth(item)"
            ></div>
          </div>
          <span class="guardrail-status__numbers">
            {{ item.current | number }} / {{ item.limit | number }}
          </span>
        </div>
      }
    </div>
  `,
  styleUrl: './guardrail-status.component.scss',
})
export class GuardrailStatusComponent {
  /** Guardrail status data from the API. */
  readonly status = input.required<GuardrailStatus>();

  /** Compute bar fill width as percentage of limit. */
  barWidth(item: GuardrailItem): number {
    if (item.status === 'disabled' || item.limit <= 0) return 0;
    return Math.min((item.current / item.limit) * 100, 100);
  }

  /** User-friendly badge text for each status level. */
  badgeText(status: GuardrailStatusLevel): string {
    const labels: Record<GuardrailStatusLevel, string> = {
      green: 'OK',
      amber: 'Warning',
      red: 'Critical',
      disabled: 'Disabled',
    };
    return labels[status];
  }
}
