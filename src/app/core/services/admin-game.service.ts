import { HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PaginatedResult } from '../../models/api.model';
import {
  AdminGameFilters,
  GameCreate,
  GameDetail,
  GameSummary,
  GameUpdate,
} from '../../models/game.model';
import { ApiService } from '../api/api.service';

/** Default page size for admin game listings. */
const DEFAULT_PAGE_SIZE = 25;

/**
 * Curator-scoped game management service.
 *
 * Provides CRUD operations plus archive/restore for the admin game
 * library view. Distinct from the player-facing GameService because
 * curators need archived game visibility, create, update, and
 * archive/restore capabilities.
 */
@Injectable({ providedIn: 'root' })
export class AdminGameService {
  private readonly api = inject(ApiService);

  /**
   * List games with admin-specific filtering (includes archived).
   *
   * @param filters - Optional admin filters (search, status, sort, page, page_size).
   * @returns Observable of paginated game summaries.
   */
  listGames(filters: AdminGameFilters = {}): Observable<PaginatedResult<GameSummary>> {
    const params = this.buildFilterParams(filters);
    return this.api.getPaginated<GameSummary>('/games', params);
  }

  /**
   * Retrieve full game detail including expansions.
   *
   * @param gameId - The game ID to retrieve.
   * @returns Observable of the game detail.
   */
  getGame(gameId: string): Observable<GameDetail> {
    return this.api.get<GameDetail>(`/games/${gameId}`);
  }

  /**
   * Create a new game.
   *
   * @param game - Game creation payload.
   * @returns Observable of the created game detail.
   */
  createGame(game: GameCreate): Observable<GameDetail> {
    return this.api.post<GameDetail>('/games', game);
  }

  /**
   * Update game metadata.
   *
   * @param gameId - The game ID to update.
   * @param updates - Partial game update payload.
   * @returns Observable of the updated game detail.
   */
  updateGame(gameId: string, updates: GameUpdate): Observable<GameDetail> {
    return this.api.patch<GameDetail>(`/games/${gameId}`, updates);
  }

  /**
   * Archive a game (soft delete).
   *
   * @param gameId - The game ID to archive.
   * @returns Observable of the archived game detail.
   */
  archiveGame(gameId: string): Observable<GameDetail> {
    return this.api.post<GameDetail>(`/games/${gameId}/archive`, {});
  }

  /**
   * Restore an archived game.
   *
   * @param gameId - The game ID to restore.
   * @returns Observable of the restored game detail.
   */
  restoreGame(gameId: string): Observable<GameDetail> {
    return this.api.post<GameDetail>(`/games/${gameId}/restore`, {});
  }

  /**
   * Build HTTP query parameters from admin game filters.
   *
   * Maps the status filter to the API's `archived` parameter:
   * - 'active' (default): omit archived param (API returns active only)
   * - 'archived': archived=only (API returns archived only)
   * - 'all': archived=true (API includes archived in results)
   */
  private buildFilterParams(filters: AdminGameFilters): HttpParams {
    let params = new HttpParams();

    if (filters.search) {
      params = params.set('search', filters.search);
    }

    const status = filters.status ?? 'active';
    if (status === 'archived') {
      params = params.set('archived', 'only');
    } else if (status === 'all') {
      params = params.set('archived', 'true');
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
