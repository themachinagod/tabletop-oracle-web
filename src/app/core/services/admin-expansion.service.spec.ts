import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, throwError } from 'rxjs';
import { ExpansionCreate, ExpansionDetail } from '../../models/game.model';
import { ApiService } from '../api/api.service';
import { AdminExpansionService } from './admin-expansion.service';

describe('AdminExpansionService', () => {
  let service: AdminExpansionService;
  let mockApi: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    patch: ReturnType<typeof vi.fn>;
  };

  const mockExpansion: ExpansionDetail = {
    id: 'exp-1',
    name: 'Seafarers',
    description: 'Sail the seas',
    year_published: 1997,
    is_active: true,
  };

  const archivedExpansion: ExpansionDetail = {
    ...mockExpansion,
    is_active: false,
  };

  beforeEach(() => {
    mockApi = {
      get: vi.fn().mockReturnValue(of([mockExpansion])),
      post: vi.fn().mockReturnValue(of(mockExpansion)),
      patch: vi.fn().mockReturnValue(of(mockExpansion)),
    };

    TestBed.configureTestingModule({
      providers: [AdminExpansionService, { provide: ApiService, useValue: mockApi }],
    });

    service = TestBed.inject(AdminExpansionService);
  });

  describe('listExpansions', () => {
    it('listExpansions_ValidGameId_CallsCorrectEndpoint', async () => {
      const result = await firstValueFrom(service.listExpansions('game-1'));

      expect(result).toEqual([mockExpansion]);
      expect(mockApi.get).toHaveBeenCalledWith('/games/game-1/expansions');
    });

    it('listExpansions_ApiError_PropagatesError', async () => {
      mockApi.get.mockReturnValue(throwError(() => new Error('Network error')));

      await expect(firstValueFrom(service.listExpansions('game-1'))).rejects.toThrow(
        'Network error',
      );
    });
  });

  describe('createExpansion', () => {
    it('createExpansion_ValidPayload_PostsAndReturnsExpansion', async () => {
      const payload: ExpansionCreate = { name: 'Cities & Knights', description: 'Advanced play' };
      const result = await firstValueFrom(service.createExpansion('game-1', payload));

      expect(result).toEqual(mockExpansion);
      expect(mockApi.post).toHaveBeenCalledWith('/games/game-1/expansions', payload);
    });

    it('createExpansion_ApiError_PropagatesError', async () => {
      mockApi.post.mockReturnValue(throwError(() => new Error('Validation error')));

      await expect(firstValueFrom(service.createExpansion('game-1', { name: '' }))).rejects.toThrow(
        'Validation error',
      );
    });
  });

  describe('updateExpansion', () => {
    it('updateExpansion_ValidPayload_PatchesAndReturnsExpansion', async () => {
      const updates = { name: 'Updated Seafarers' };
      const result = await firstValueFrom(service.updateExpansion('game-1', 'exp-1', updates));

      expect(result).toEqual(mockExpansion);
      expect(mockApi.patch).toHaveBeenCalledWith('/games/game-1/expansions/exp-1', updates);
    });

    it('updateExpansion_ApiError_PropagatesError', async () => {
      mockApi.patch.mockReturnValue(throwError(() => new Error('Not found')));

      await expect(
        firstValueFrom(service.updateExpansion('game-1', 'bad-id', { name: 'x' })),
      ).rejects.toThrow('Not found');
    });
  });

  describe('archiveExpansion', () => {
    it('archiveExpansion_ValidIds_PostsArchiveEndpoint', async () => {
      mockApi.post.mockReturnValue(of(archivedExpansion));
      const result = await firstValueFrom(service.archiveExpansion('game-1', 'exp-1'));

      expect(result).toEqual(archivedExpansion);
      expect(mockApi.post).toHaveBeenCalledWith('/games/game-1/expansions/exp-1/archive', {});
    });

    it('archiveExpansion_ApiError_PropagatesError', async () => {
      mockApi.post.mockReturnValue(throwError(() => new Error('Server error')));

      await expect(firstValueFrom(service.archiveExpansion('game-1', 'exp-1'))).rejects.toThrow(
        'Server error',
      );
    });
  });

  describe('restoreExpansion', () => {
    it('restoreExpansion_ValidIds_PostsRestoreEndpoint', async () => {
      const result = await firstValueFrom(service.restoreExpansion('game-1', 'exp-1'));

      expect(result).toEqual(mockExpansion);
      expect(mockApi.post).toHaveBeenCalledWith('/games/game-1/expansions/exp-1/restore', {});
    });

    it('restoreExpansion_ApiError_PropagatesError', async () => {
      mockApi.post.mockReturnValue(throwError(() => new Error('Server error')));

      await expect(firstValueFrom(service.restoreExpansion('game-1', 'exp-1'))).rejects.toThrow(
        'Server error',
      );
    });
  });
});
