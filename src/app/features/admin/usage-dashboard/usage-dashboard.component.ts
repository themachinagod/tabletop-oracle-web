import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, forkJoin, Subject } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AdminUsageService } from '../../../core/services/admin-usage.service';
import { AdminQualityService } from '../../../core/services/admin-quality.service';
import { AdminSettingsService } from '../../../core/services/admin-settings.service';
import {
  CapabilityUsage,
  DailyUsage,
  GameUsage,
  GuardrailStatus,
  PeriodOption,
  UsageSummary,
  UserUsage,
} from '../../../models/usage.model';
import { GameQualityMetrics } from '../../../models/quality-metrics.model';
import { ModelSlot } from '../../../models/model-slot.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ErrorBannerComponent } from '../../../shared/components/error-banner/error-banner.component';
import { UsageSummaryCardsComponent } from './usage-summary-cards.component';
import { UsageTrendChartComponent } from './usage-trend-chart.component';
import { CapabilityBreakdownComponent } from './capability-breakdown.component';
import { GameBreakdownComponent } from './game-breakdown.component';
import { GuardrailStatusComponent } from './guardrail-status.component';
import { ActiveModelConfigComponent } from './active-model-config.component';
import { QualityMetricsComponent } from './quality-metrics.component';

/** Map period option to a human-readable label. */
const PERIOD_LABELS: Record<PeriodOption, string> = {
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  '90d': 'Last 90 days',
};

/**
 * Usage dashboard container component.
 *
 * Replaces UsageDashboardPlaceholderComponent. Manages period selection
 * and orchestrates data loading for all child dashboard sections.
 * Uses switchMap on period changes to cancel in-flight requests.
 *
 * Route: /admin/usage
 */
@Component({
  selector: 'app-usage-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    LoadingSpinnerComponent,
    ErrorBannerComponent,
    UsageSummaryCardsComponent,
    UsageTrendChartComponent,
    CapabilityBreakdownComponent,
    GameBreakdownComponent,
    GuardrailStatusComponent,
    ActiveModelConfigComponent,
    QualityMetricsComponent,
  ],
  templateUrl: './usage-dashboard.component.html',
  styleUrl: './usage-dashboard.component.scss',
})
export class UsageDashboardComponent implements OnInit {
  private readonly usageService = inject(AdminUsageService);
  private readonly qualityService = inject(AdminQualityService);
  private readonly settingsService = inject(AdminSettingsService);
  private readonly destroyRef = inject(DestroyRef);

  /** Available period options for the selector. */
  readonly periodOptions: PeriodOption[] = ['7d', '30d', '90d'];

  /** Currently selected period. */
  readonly selectedPeriod = signal<PeriodOption>('30d');

  /** Human-readable label for the current period. */
  readonly periodLabel = computed(() => PERIOD_LABELS[this.selectedPeriod()]);

  /** Subject that emits when period changes, driving switchMap. */
  private readonly periodChange$ = new Subject<PeriodOption>();

  /** Whether the dashboard is in loading state. */
  readonly loading = signal(true);

  /** Error message if data loading fails. */
  readonly error = signal<string | null>(null);

  /** Usage summary data. */
  readonly summary = signal<UsageSummary | null>(null);

  /** Daily trend data. */
  readonly trends = signal<DailyUsage[] | null>(null);

  /** Capability breakdown data. */
  readonly byCapability = signal<CapabilityUsage[] | null>(null);

  /** Game breakdown data. */
  readonly byGame = signal<GameUsage[] | null>(null);

  /** User breakdown data. */
  readonly byUser = signal<UserUsage[] | null>(null);

  /** Guardrail status data. */
  readonly guardrailStatus = signal<GuardrailStatus | null>(null);

  /** Quality metrics data. */
  readonly qualityMetrics = signal<GameQualityMetrics[] | null>(null);

  /** Model slot configuration data. */
  readonly modelSlots = signal<ModelSlot[] | null>(null);

  ngOnInit(): void {
    this.periodChange$
      .pipe(
        switchMap((period) => {
          this.loading.set(true);
          this.error.set(null);
          const { start, end } = this.computeDateRange(period);
          return forkJoin({
            summary: this.usageService.getSummary(start, end),
            trends: this.usageService.getTrends(start, end),
            byCapability: this.usageService.getByCapability(start, end),
            byGame: this.usageService.getByGame(start, end),
            byUser: this.usageService.getByUser(start, end),
            guardrailStatus: this.usageService.getGuardrailStatus(),
            qualityMetrics: this.qualityService.getMetrics(start, end),
            modelSlots: this.settingsService.listModelSlots(),
          }).pipe(
            catchError((err) => {
              this.error.set(err?.error?.message ?? 'Failed to load dashboard data.');
              this.loading.set(false);
              return EMPTY;
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (data) => {
          this.summary.set(data.summary);
          this.trends.set(data.trends);
          this.byCapability.set(data.byCapability);
          this.byGame.set(data.byGame);
          this.byUser.set(data.byUser);
          this.guardrailStatus.set(data.guardrailStatus);
          this.qualityMetrics.set(data.qualityMetrics);
          this.modelSlots.set(data.modelSlots);
          this.loading.set(false);
        },
      });

    // Trigger initial load
    this.periodChange$.next(this.selectedPeriod());
  }

  /** Handle period selector change. */
  onPeriodChange(period: PeriodOption): void {
    this.selectedPeriod.set(period);
    this.periodChange$.next(period);
  }

  /** Retry after an error. */
  retry(): void {
    this.periodChange$.next(this.selectedPeriod());
  }

  /** Get display label for a period option. */
  periodOptionLabel(period: PeriodOption): string {
    return PERIOD_LABELS[period];
  }

  /** Compute ISO date strings for a period relative to today. */
  private computeDateRange(period: PeriodOption): { start: string; end: string } {
    const end = new Date();
    const start = new Date();
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    start.setDate(end.getDate() - days);
    return {
      start: this.formatDate(start),
      end: this.formatDate(end),
    };
  }

  /** Format a Date as YYYY-MM-DD. */
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
