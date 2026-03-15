import { HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GameQualityMetrics } from '../../models/quality-metrics.model';
import { ApiService } from '../api/api.service';

/**
 * Admin quality metrics service.
 *
 * Provides read-only access to quality metrics endpoints for the
 * admin dashboard. Quality metrics are computed from messages,
 * citations, and player feedback data. All endpoints require curator
 * role (enforced server-side via session auth).
 */
@Injectable({ providedIn: 'root' })
export class AdminQualityService {
  private readonly api = inject(ApiService);

  /**
   * Get quality metrics per game for a date range.
   *
   * @param periodStart - Start date in YYYY-MM-DD format.
   * @param periodEnd - End date in YYYY-MM-DD format.
   * @returns Observable of per-game quality metrics.
   */
  getMetrics(periodStart: string, periodEnd: string): Observable<GameQualityMetrics[]> {
    const params = new HttpParams().set('period_start', periodStart).set('period_end', periodEnd);
    return this.api.get<GameQualityMetrics[]>('/admin/quality/metrics', params);
  }
}
