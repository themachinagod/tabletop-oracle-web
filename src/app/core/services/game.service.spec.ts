import { HttpParams } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, throwError } from 'rxjs';
import { PaginatedResult } from '../../models/api.model';
import { GameDetail, GameSummary, TagCount } from '../../models/game.model';
import { ApiService } from '../api/api.service';
import { GameService } from './game.service';

describe('GameService', () => {
  let service: GameService;
  let mockApi: {
    getPaginated: ReturnType<typeof vi.fn>;
    get: ReturnType<typeof vi.fn>;
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
    cover_image_url: 'https://example.com/catan.jpg',
    complexity: 'medium',
    tags: ['strategy', 'trading'],
    is_active: true,
    document_count: 2,
    expansion_count: 3,
    created_at: '2026-03-14T00:00:00Z',
    updated_at: '2026-03-14T12:00:00Z',
  };

  const mockPaginatedResult: PaginatedResult<GameSummary> = {
    data: [mockGame],
    pagination: { page: 1, page_size: 12, total_items: 1, total_pages: 1 },
  };

  const mockGameDetail: GameDetail = {
    ...mockGame,
    created_by: 'user-1',
    archived_at: null,
    expansions: [
      {
        id: 'exp-1',
        name: 'Seafarers',
        description: 'Explore the seas',
        year_published: 1997,
        is_active: true,
      },
    ],
  };

  const mockTags: TagCount[] = [
    { tag: 'strategy', count: 5 },
    { tag: 'trading', count: 3 },
  ];

  beforeEach(() => {
    mockApi = {
      getPaginated: vi.fn().mockReturnValue(of(mockPaginatedResult)),
      get: vi.fn().mockReturnValue(of(mockGameDetail)),
    };

    TestBed.configureTestingModule({
      providers: [GameService, { provide: ApiService, useValue: mockApi }],
    });

    service = TestBed.inject(GameService);
  });

  describe('listGames', () => {
    it('listGames_NoFilters_CallsApiWithDefaultPageSize', async () => {
      const result = await firstValueFrom(service.listGames());

      expect(result).toEqual(mockPaginatedResult);
      expect(mockApi.getPaginated).toHaveBeenCalledWith('/games', expect.any(HttpParams));

      const params: HttpParams = mockApi.getPaginated.mock.calls[0][1];
      expect(params.get('page_size')).toBe('12');
      expect(params.has('search')).toBe(false);
      expect(params.has('player_count')).toBe(false);
      expect(params.has('complexity')).toBe(false);
      expect(params.has('tags')).toBe(false);
      expect(params.has('sort')).toBe(false);
    });

    it('listGames_WithSearch_IncludesSearchParam', async () => {
      await firstValueFrom(service.listGames({ search: 'catan' }));

      const params: HttpParams = mockApi.getPaginated.mock.calls[0][1];
      expect(params.get('search')).toBe('catan');
    });

    it('listGames_WithPlayerCount_IncludesPlayerCountParam', async () => {
      await firstValueFrom(service.listGames({ player_count: 4 }));

      const params: HttpParams = mockApi.getPaginated.mock.calls[0][1];
      expect(params.get('player_count')).toBe('4');
    });

    it('listGames_WithComplexity_JoinsAsCommaSeparated', async () => {
      await firstValueFrom(service.listGames({ complexity: ['light', 'medium'] }));

      const params: HttpParams = mockApi.getPaginated.mock.calls[0][1];
      expect(params.get('complexity')).toBe('light,medium');
    });

    it('listGames_WithEmptyComplexity_OmitsParam', async () => {
      await firstValueFrom(service.listGames({ complexity: [] }));

      const params: HttpParams = mockApi.getPaginated.mock.calls[0][1];
      expect(params.has('complexity')).toBe(false);
    });

    it('listGames_WithTags_JoinsAsCommaSeparated', async () => {
      await firstValueFrom(service.listGames({ tags: ['strategy', 'trading'] }));

      const params: HttpParams = mockApi.getPaginated.mock.calls[0][1];
      expect(params.get('tags')).toBe('strategy,trading');
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
      await firstValueFrom(service.listGames({ page_size: 24 }));

      const params: HttpParams = mockApi.getPaginated.mock.calls[0][1];
      expect(params.get('page_size')).toBe('24');
    });

    it('listGames_WithAllFilters_IncludesAllParams', async () => {
      await firstValueFrom(
        service.listGames({
          search: 'catan',
          player_count: 4,
          complexity: ['medium'],
          tags: ['strategy'],
          sort: 'name',
          page: 2,
          page_size: 24,
        }),
      );

      const params: HttpParams = mockApi.getPaginated.mock.calls[0][1];
      expect(params.get('search')).toBe('catan');
      expect(params.get('player_count')).toBe('4');
      expect(params.get('complexity')).toBe('medium');
      expect(params.get('tags')).toBe('strategy');
      expect(params.get('sort')).toBe('name');
      expect(params.get('page')).toBe('2');
      expect(params.get('page_size')).toBe('24');
    });

    it('listGames_ApiError_PropagatesError', async () => {
      const error = new Error('Network error');
      mockApi.getPaginated.mockReturnValue(throwError(() => error));

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

  describe('getTags', () => {
    it('getTags_Success_ReturnsTagCounts', async () => {
      mockApi.get.mockReturnValue(of(mockTags));

      const result = await firstValueFrom(service.getTags());

      expect(result).toEqual(mockTags);
      expect(mockApi.get).toHaveBeenCalledWith('/games/tags');
    });

    it('getTags_ApiError_PropagatesError', async () => {
      mockApi.get.mockReturnValue(throwError(() => new Error('Server error')));

      await expect(firstValueFrom(service.getTags())).rejects.toThrow('Server error');
    });
  });
});
