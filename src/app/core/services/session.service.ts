import { HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PaginatedResult } from '../../models/api.model';
import {
  SessionFilters,
  SessionStatus,
  SessionStatusUpdate,
  SessionSummary,
} from '../../models/session.model';
import { ApiService } from '../api/api.service';

/** Default page size for session listings. */
const DEFAULT_PAGE_SIZE = 25;

/**
 * Domain service for session operations.
 *
 * Wraps ApiService with typed methods for listing, filtering,
 * and managing player sessions. Follows the F001 envelope pattern
 * via ApiService's automatic unwrapping.
 */
@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly api = inject(ApiService);

  /**
   * List sessions with filtering, sorting, and pagination.
   *
   * @param filters - Optional filters (status, game_id, sort, page, page_size).
   * @returns Observable of paginated session summaries.
   */
  listSessions(filters: SessionFilters = {}): Observable<PaginatedResult<SessionSummary>> {
    const params = this.buildFilterParams(filters);
    return this.api.getPaginated<SessionSummary>('/sessions', params);
  }

  /**
   * Update a session's status (e.g., archive or restore).
   *
   * @param sessionId - The session ID to update.
   * @param status - The new status ('active' or 'archived').
   * @returns Observable of the updated session summary.
   */
  updateSessionStatus(sessionId: string, status: SessionStatus): Observable<SessionSummary> {
    const body: SessionStatusUpdate = { status };
    return this.api.patch<SessionSummary>(`/sessions/${sessionId}`, body);
  }

  /**
   * Build HTTP query parameters from session filters.
   *
   * Only includes parameters that have defined values; omits
   * undefined/null entries to keep query strings clean.
   */
  private buildFilterParams(filters: SessionFilters): HttpParams {
    let params = new HttpParams();

    if (filters.status) {
      params = params.set('status', filters.status);
    }
    if (filters.game_id) {
      params = params.set('game_id', filters.game_id);
    }
    if (filters.sort) {
      params = params.set('sort', filters.sort);
    }
    if (filters.page) {
      params = params.set('page', filters.page.toString());
    }

    params = params.set('page_size', (filters.page_size ?? DEFAULT_PAGE_SIZE).toString());

    return params;
  }
}
