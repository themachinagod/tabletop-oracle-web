import { HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PaginatedResult } from '../../models/api.model';
import { GameDetail, GameFilters, GameSummary, TagCount } from '../../models/game.model';
import { ApiService } from '../api/api.service';

/** Default page size for game listings. */
const DEFAULT_PAGE_SIZE = 12;

/**
 * Domain service for game catalogue operations.
 *
 * Provides typed methods for listing, filtering, and retrieving
 * games from the API. Follows the F001 envelope pattern via
 * ApiService's automatic unwrapping.
 */
@Injectable({ providedIn: 'root' })
export class GameService {
  private readonly api = inject(ApiService);

  /**
   * List games with filtering, sorting, and pagination.
   *
   * @param filters - Optional filters (search, player_count, complexity, tags, sort, page, page_size).
   * @returns Observable of paginated game summaries.
   */
  listGames(filters: GameFilters = {}): Observable<PaginatedResult<GameSummary>> {
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
   * Retrieve all available tags with usage counts.
   *
   * @returns Observable of tag count array.
   */
  getTags(): Observable<TagCount[]> {
    return this.api.get<TagCount[]>('/games/tags');
  }

  /**
   * Build HTTP query parameters from game filters.
   *
   * Only includes parameters that have defined values; omits
   * undefined/null entries to keep query strings clean.
   */
  private buildFilterParams(filters: GameFilters): HttpParams {
    let params = new HttpParams();

    if (filters.search) {
      params = params.set('search', filters.search);
    }
    if (filters.player_count != null) {
      params = params.set('player_count', filters.player_count.toString());
    }
    if (filters.complexity && filters.complexity.length > 0) {
      params = params.set('complexity', filters.complexity.join(','));
    }
    if (filters.tags && filters.tags.length > 0) {
      params = params.set('tags', filters.tags.join(','));
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
