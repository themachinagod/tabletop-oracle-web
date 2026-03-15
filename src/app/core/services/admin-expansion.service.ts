import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ExpansionCreate, ExpansionDetail, ExpansionUpdate } from '../../models/game.model';
import { ApiService } from '../api/api.service';

/**
 * Curator-scoped expansion management service.
 *
 * Provides CRUD operations plus archive/restore for expansions
 * within a game context. All endpoints are scoped to a parent game ID.
 */
@Injectable({ providedIn: 'root' })
export class AdminExpansionService {
  private readonly api = inject(ApiService);

  /**
   * List all expansions for a game.
   *
   * @param gameId - The parent game ID.
   * @returns Observable of expansion details array.
   */
  listExpansions(gameId: string): Observable<ExpansionDetail[]> {
    return this.api.get<ExpansionDetail[]>(`/games/${gameId}/expansions`);
  }

  /**
   * Create a new expansion for a game.
   *
   * @param gameId - The parent game ID.
   * @param expansion - Expansion creation payload.
   * @returns Observable of the created expansion detail.
   */
  createExpansion(gameId: string, expansion: ExpansionCreate): Observable<ExpansionDetail> {
    return this.api.post<ExpansionDetail>(`/games/${gameId}/expansions`, expansion);
  }

  /**
   * Update expansion metadata.
   *
   * @param gameId - The parent game ID.
   * @param expansionId - The expansion ID to update.
   * @param updates - Partial expansion update payload.
   * @returns Observable of the updated expansion detail.
   */
  updateExpansion(
    gameId: string,
    expansionId: string,
    updates: ExpansionUpdate,
  ): Observable<ExpansionDetail> {
    return this.api.patch<ExpansionDetail>(
      `/games/${gameId}/expansions/${expansionId}`,
      updates,
    );
  }

  /**
   * Archive an expansion (soft delete).
   *
   * @param gameId - The parent game ID.
   * @param expansionId - The expansion ID to archive.
   * @returns Observable of the archived expansion detail.
   */
  archiveExpansion(gameId: string, expansionId: string): Observable<ExpansionDetail> {
    return this.api.post<ExpansionDetail>(
      `/games/${gameId}/expansions/${expansionId}/archive`,
      {},
    );
  }

  /**
   * Restore an archived expansion.
   *
   * @param gameId - The parent game ID.
   * @param expansionId - The expansion ID to restore.
   * @returns Observable of the restored expansion detail.
   */
  restoreExpansion(gameId: string, expansionId: string): Observable<ExpansionDetail> {
    return this.api.post<ExpansionDetail>(
      `/games/${gameId}/expansions/${expansionId}/restore`,
      {},
    );
  }
}
