import { HttpParams } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, throwError } from 'rxjs';
import { PaginatedResult } from '../../models/api.model';
import { GameCreate, GameDetail, GameSummary } from '../../models/game.model';
import { ApiService } from '../api/api.service';
import { AdminGameService } from './admin-game.service';

describe('AdminGameService', () => {
  let service: AdminGameService;
  let mockApi: {
    getPaginated: ReturnType<typeof vi.fn>;
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    patch: ReturnType<typeof vi.fn>;
  };

  const mockGame: GameSummary = {
    id: 'game-1',
    name: 'Catan',
    publisher: 'Kosmos',
    year_published: 1995,
    edition: null,
    min_players: 3,
    max_players: 4,
    description: 'A classic trading game',
    cover_image_url: null,
    complexity: 'medium',
    tags: ['strategy'],
    is_active: true,
    document_count: 2,
    expansion_count: 1,
    created_at: '2026-03-14T00:00:00Z',
    updated_at: '2026-03-14T12:00:00Z',
  };

  const mockGameDetail: GameDetail = {
    ...mockGame,
    created_by: 'user-1',
    archived_at: null,
    expansions: [],
  };

  const mockPaginatedResult: PaginatedResult<GameSummary> = {
    data: [mockGame],
    pagination: { page: 1, page_size: 25, total_items: 1, total_pages: 1 },
  };

  beforeEach(() => {
    mockApi = {
      getPaginated: vi.fn().mockReturnValue(of(mockPaginatedResult)),
      get: vi.fn().mockReturnValue(of(mockGameDetail)),
      post: vi.fn().mockReturnValue(of(mockGameDetail)),
      patch: vi.fn().mockReturnValue(of(mockGameDetail)),
    };

    TestBed.configureTestingModule({
      providers: [AdminGameService, { provide: ApiService, useValue: mockApi }],
    });

    service = TestBed.inject(AdminGameService);
  });

  describe('listGames', () => {
    it('listGames_NoFilters_CallsApiWithDefaultPageSize', async () => {
      const result = await firstValueFrom(service.listGames());

      expect(result).toEqual(mockPaginatedResult);
      expect(mockApi.getPaginated).toHaveBeenCalledWith('/games', expect.any(HttpParams));

      const params: HttpParams = mockApi.getPaginated.mock.calls[0][1];
      expect(params.get('page_size')).toBe('25');
      expect(params.has('search')).toBe(false);
      expect(params.has('archived')).toBe(false);
    });

    it('listGames_WithSearch_IncludesSearchParam', async () => {
      await firstValueFrom(service.listGames({ search: 'catan' }));

      const params: HttpParams = mockApi.getPaginated.mock.calls[0][1];
      expect(params.get('search')).toBe('catan');
    });

    it('listGames_StatusActive_OmitsArchivedParam', async () => {
      await firstValueFrom(service.listGames({ status: 'active' }));

      const params: HttpParams = mockApi.getPaginated.mock.calls[0][1];
      expect(params.has('archived')).toBe(false);
    });

    it('listGames_StatusArchived_SetsArchivedOnly', async () => {
      await firstValueFrom(service.listGames({ status: 'archived' }));

      const params: HttpParams = mockApi.getPaginated.mock.calls[0][1];
      expect(params.get('archived')).toBe('only');
    });

    it('listGames_StatusAll_SetsArchivedTrue', async () => {
      await firstValueFrom(service.listGames({ status: 'all' }));

      const params: HttpParams = mockApi.getPaginated.mock.calls[0][1];
      expect(params.get('archived')).toBe('true');
    });

    it('listGames_WithSort_IncludesSortParam', async () => {
      await firstValueFrom(service.listGames({ sort: '-updated_at' }));

      const params: HttpParams = mockApi.getPaginated.mock.calls[0][1];
      expect(params.get('sort')).toBe('-updated_at');
    });

    it('listGames_WithPage_IncludesPageParam', async () => {
      await firstValueFrom(service.listGames({ page: 3 }));

      const params: HttpParams = mockApi.getPaginated.mock.calls[0][1];
      expect(params.get('page')).toBe('3');
    });

    it('listGames_WithCustomPageSize_OverridesDefault', async () => {
      await firstValueFrom(service.listGames({ page_size: 50 }));

      const params: HttpParams = mockApi.getPaginated.mock.calls[0][1];
      expect(params.get('page_size')).toBe('50');
    });

    it('listGames_ApiError_PropagatesError', async () => {
      mockApi.getPaginated.mockReturnValue(throwError(() => new Error('Network error')));

      await expect(firstValueFrom(service.listGames())).rejects.toThrow('Network error');
    });
  });

  describe('getGame', () => {
    it('getGame_ValidId_ReturnsGameDetail', async () => {
      const result = await firstValueFrom(service.getGame('game-1'));

      expect(result).toEqual(mockGameDetail);
      expect(mockApi.get).toHaveBeenCalledWith('/games/game-1');
    });

    it('getGame_ApiError_PropagatesError', async () => {
      mockApi.get.mockReturnValue(throwError(() => new Error('Not found')));

      await expect(firstValueFrom(service.getGame('bad-id'))).rejects.toThrow('Not found');
    });
  });

  describe('createGame', () => {
    it('createGame_ValidPayload_PostsAndReturnsGame', async () => {
      const payload: GameCreate = { name: 'New Game', publisher: 'Publisher' };
      const result = await firstValueFrom(service.createGame(payload));

      expect(result).toEqual(mockGameDetail);
      expect(mockApi.post).toHaveBeenCalledWith('/games', payload);
    });

    it('createGame_ApiError_PropagatesError', async () => {
      mockApi.post.mockReturnValue(throwError(() => new Error('Validation error')));

      await expect(firstValueFrom(service.createGame({ name: '' }))).rejects.toThrow(
        'Validation error',
      );
    });
  });

  describe('updateGame', () => {
    it('updateGame_ValidPayload_PatchesAndReturnsGame', async () => {
      const updates = { name: 'Updated Catan' };
      const result = await firstValueFrom(service.updateGame('game-1', updates));

      expect(result).toEqual(mockGameDetail);
      expect(mockApi.patch).toHaveBeenCalledWith('/games/game-1', updates);
    });
  });

  describe('archiveGame', () => {
    it('archiveGame_ValidId_PostsArchiveEndpoint', async () => {
      const result = await firstValueFrom(service.archiveGame('game-1'));

      expect(result).toEqual(mockGameDetail);
      expect(mockApi.post).toHaveBeenCalledWith('/games/game-1/archive', {});
    });
  });

  describe('restoreGame', () => {
    it('restoreGame_ValidId_PostsRestoreEndpoint', async () => {
      const result = await firstValueFrom(service.restoreGame('game-1'));

      expect(result).toEqual(mockGameDetail);
      expect(mockApi.post).toHaveBeenCalledWith('/games/game-1/restore', {});
    });
  });
});
