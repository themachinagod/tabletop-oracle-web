import { HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CapabilityUsage,
  DailyUsage,
  GameUsage,
  GuardrailStatus,
  UsageSummary,
  UserUsage,
} from '../../models/usage.model';
import { ApiService } from '../api/api.service';

/**
 * Admin usage analytics service.
 *
 * Provides read-only access to usage aggregation endpoints for the
 * admin dashboard. All endpoints require curator role (enforced
 * server-side via session auth).
 */
@Injectable({ providedIn: 'root' })
export class AdminUsageService {
  private readonly api = inject(ApiService);

  /**
   * Get usage summary for a date range.
   *
   * @param periodStart - Start date in YYYY-MM-DD format.
   * @param periodEnd - End date in YYYY-MM-DD format.
   * @returns Observable of usage summary statistics.
   */
  getSummary(periodStart: string, periodEnd: string): Observable<UsageSummary> {
    const params = this.buildPeriodParams(periodStart, periodEnd);
    return this.api.get<UsageSummary>('/admin/usage/summary', params);
  }

  /**
   * Get daily usage trend data for a date range.
   *
   * @param periodStart - Start date in YYYY-MM-DD format.
   * @param periodEnd - End date in YYYY-MM-DD format.
   * @returns Observable of daily usage entries ordered by date ascending.
   */
  getTrends(periodStart: string, periodEnd: string): Observable<DailyUsage[]> {
    const params = this.buildPeriodParams(periodStart, periodEnd);
    return this.api.get<DailyUsage[]>('/admin/usage/trends', params);
  }

  /**
   * Get usage breakdown by AI capability for a date range.
   *
   * @param periodStart - Start date in YYYY-MM-DD format.
   * @param periodEnd - End date in YYYY-MM-DD format.
   * @returns Observable of per-capability usage data.
   */
  getByCapability(periodStart: string, periodEnd: string): Observable<CapabilityUsage[]> {
    const params = this.buildPeriodParams(periodStart, periodEnd);
    return this.api.get<CapabilityUsage[]>('/admin/usage/by-capability', params);
  }

  /**
   * Get usage breakdown by game for a date range.
   *
   * @param periodStart - Start date in YYYY-MM-DD format.
   * @param periodEnd - End date in YYYY-MM-DD format.
   * @returns Observable of per-game usage data.
   */
  getByGame(periodStart: string, periodEnd: string): Observable<GameUsage[]> {
    const params = this.buildPeriodParams(periodStart, periodEnd);
    return this.api.get<GameUsage[]>('/admin/usage/by-game', params);
  }

  /**
   * Get usage breakdown by user for a date range.
   *
   * @param periodStart - Start date in YYYY-MM-DD format.
   * @param periodEnd - End date in YYYY-MM-DD format.
   * @returns Observable of per-user usage data.
   */
  getByUser(periodStart: string, periodEnd: string): Observable<UserUsage[]> {
    const params = this.buildPeriodParams(periodStart, periodEnd);
    return this.api.get<UserUsage[]>('/admin/usage/by-user', params);
  }

  /**
   * Get current guardrail usage vs limits.
   *
   * @returns Observable of guardrail status indicators.
   */
  getGuardrailStatus(): Observable<GuardrailStatus> {
    return this.api.get<GuardrailStatus>('/admin/usage/guardrail-status');
  }

  /** Build HttpParams for period-scoped endpoints. */
  private buildPeriodParams(periodStart: string, periodEnd: string): HttpParams {
    return new HttpParams().set('period_start', periodStart).set('period_end', periodEnd);
  }
}
