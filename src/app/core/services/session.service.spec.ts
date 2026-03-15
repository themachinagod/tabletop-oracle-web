import { HttpParams } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, throwError } from 'rxjs';
import { PaginatedResult } from '../../models/api.model';
import { SessionSummary } from '../../models/session.model';
import { ApiService } from '../api/api.service';
import { SessionService } from './session.service';

describe('SessionService', () => {
  let service: SessionService;
  let mockApi: {
    getPaginated: ReturnType<typeof vi.fn>;
    patch: ReturnType<typeof vi.fn>;
  };

  const mockSession: SessionSummary = {
    id: 'session-1',
    game_id: 'game-1',
    game_name: 'Catan',
    game_cover_image_url: 'https://example.com/catan.jpg',
    name: 'Friday night Catan',
    player_count: 4,
    status: 'active',
    expansions: [{ id: 'exp-1', name: 'Seafarers' }],
    last_active_at: '2026-03-15T00:00:00Z',
    created_at: '2026-03-14T00:00:00Z',
    last_message_preview: 'How do I trade wheat?',
    message_count: 12,
  };

  const mockPaginatedResult: PaginatedResult<SessionSummary> = {
    data: [mockSession],
    pagination: { page: 1, page_size: 25, total_items: 1, total_pages: 1 },
  };

  beforeEach(() => {
    mockApi = {
      getPaginated: vi.fn().mockReturnValue(of(mockPaginatedResult)),
      patch: vi.fn().mockReturnValue(of(mockSession)),
    };

    TestBed.configureTestingModule({
      providers: [SessionService, { provide: ApiService, useValue: mockApi }],
    });

    service = TestBed.inject(SessionService);
  });

  describe('listSessions', () => {
    it('listSessions_NoFilters_CallsApiWithDefaultPageSize', async () => {
      const result = await firstValueFrom(service.listSessions());

      expect(result).toEqual(mockPaginatedResult);
      expect(mockApi.getPaginated).toHaveBeenCalledWith('/sessions', expect.any(HttpParams));

      const params: HttpParams = mockApi.getPaginated.mock.calls[0][1];
      expect(params.get('page_size')).toBe('25');
      expect(params.has('status')).toBe(false);
      expect(params.has('game_id')).toBe(false);
      expect(params.has('sort')).toBe(false);
    });

    it('listSessions_WithStatusFilter_IncludesStatusParam', async () => {
      await firstValueFrom(service.listSessions({ status: 'active' }));

      const params: HttpParams = mockApi.getPaginated.mock.calls[0][1];
      expect(params.get('status')).toBe('active');
    });

    it('listSessions_WithGameIdFilter_IncludesGameIdParam', async () => {
      await firstValueFrom(service.listSessions({ game_id: 'game-1' }));

      const params: HttpParams = mockApi.getPaginated.mock.calls[0][1];
      expect(params.get('game_id')).toBe('game-1');
    });

    it('listSessions_WithSortFilter_IncludesSortParam', async () => {
      await firstValueFrom(service.listSessions({ sort: '-last_active_at' }));

      const params: HttpParams = mockApi.getPaginated.mock.calls[0][1];
      expect(params.get('sort')).toBe('-last_active_at');
    });

    it('listSessions_WithPage_IncludesPageParam', async () => {
      await firstValueFrom(service.listSessions({ page: 3 }));

      const params: HttpParams = mockApi.getPaginated.mock.calls[0][1];
      expect(params.get('page')).toBe('3');
    });

    it('listSessions_WithCustomPageSize_OverridesDefault', async () => {
      await firstValueFrom(service.listSessions({ page_size: 10 }));

      const params: HttpParams = mockApi.getPaginated.mock.calls[0][1];
      expect(params.get('page_size')).toBe('10');
    });

    it('listSessions_WithAllFilters_IncludesAllParams', async () => {
      await firstValueFrom(
        service.listSessions({
          status: 'archived',
          game_id: 'game-2',
          sort: '-created_at',
          page: 2,
          page_size: 50,
        }),
      );

      const params: HttpParams = mockApi.getPaginated.mock.calls[0][1];
      expect(params.get('status')).toBe('archived');
      expect(params.get('game_id')).toBe('game-2');
      expect(params.get('sort')).toBe('-created_at');
      expect(params.get('page')).toBe('2');
      expect(params.get('page_size')).toBe('50');
    });

    it('listSessions_ApiError_PropagatesError', async () => {
      const error = new Error('Network error');
      mockApi.getPaginated.mockReturnValue(throwError(() => error));

      await expect(firstValueFrom(service.listSessions())).rejects.toThrow('Network error');
    });
  });

  describe('updateSessionStatus', () => {
    it('updateSessionStatus_ToArchived_PatchesWithStatusBody', async () => {
      const result = await firstValueFrom(service.updateSessionStatus('session-1', 'archived'));

      expect(result).toEqual(mockSession);
      expect(mockApi.patch).toHaveBeenCalledWith('/sessions/session-1', {
        status: 'archived',
      });
    });

    it('updateSessionStatus_ToActive_PatchesWithActiveStatus', async () => {
      await firstValueFrom(service.updateSessionStatus('session-2', 'active'));

      expect(mockApi.patch).toHaveBeenCalledWith('/sessions/session-2', {
        status: 'active',
      });
    });

    it('updateSessionStatus_ApiError_PropagatesError', async () => {
      mockApi.patch.mockReturnValue(throwError(() => new Error('Server error')));

      await expect(
        firstValueFrom(service.updateSessionStatus('session-1', 'archived')),
      ).rejects.toThrow('Server error');
    });
  });
});
