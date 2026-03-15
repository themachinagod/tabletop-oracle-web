import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { PaginatedResult } from '../../../models/api.model';
import { GameSummary } from '../../../models/game.model';
import { AdminGameService } from '../../../core/services/admin-game.service';
import { AdminHomeComponent } from './admin-home.component';

describe('AdminHomeComponent', () => {
  let component: AdminHomeComponent;
  let fixture: ComponentFixture<AdminHomeComponent>;
  let mockAdminGameService: {
    listGames: ReturnType<typeof vi.fn>;
  };
  let mockRouter: { navigate: ReturnType<typeof vi.fn> };

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

  const mockPaginatedResult: PaginatedResult<GameSummary> = {
    data: [mockGame],
    pagination: { page: 1, page_size: 25, total_items: 1, total_pages: 1 },
  };

  beforeEach(async () => {
    mockAdminGameService = {
      listGames: vi.fn().mockReturnValue(of(mockPaginatedResult)),
    };
    mockRouter = { navigate: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [AdminHomeComponent],
      providers: [
        { provide: AdminGameService, useValue: mockAdminGameService },
        { provide: Router, useValue: mockRouter },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminHomeComponent);
    component = fixture.componentInstance;
  });

  describe('initialisation', () => {
    it('ngOnInit_Success_LoadsGames', () => {
      fixture.detectChanges();

      expect(component.games()).toEqual([mockGame]);
      expect(component.loading()).toBe(false);
      expect(component.error()).toBeNull();
    });

    it('ngOnInit_Success_SetsPagination', () => {
      fixture.detectChanges();

      expect(component.pagination()).toEqual(mockPaginatedResult.pagination);
    });

    it('ngOnInit_ApiError_SetsErrorMessage', () => {
      mockAdminGameService.listGames.mockReturnValue(throwError(() => new Error('fail')));
      fixture.detectChanges();

      expect(component.error()).toBe('Failed to load games. Please try again.');
      expect(component.loading()).toBe(false);
    });

    it('ngOnInit_DefaultFilters_UsesActiveStatusAndUpdatedSort', () => {
      fixture.detectChanges();

      expect(mockAdminGameService.listGames).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'active',
          sort: '-updated_at',
          page: 1,
        }),
      );
    });
  });

  describe('status filtering', () => {
    it('onStatusChange_Archived_ReloadsWithArchivedStatus', () => {
      fixture.detectChanges();
      mockAdminGameService.listGames.mockClear();

      component.onStatusChange('archived');

      expect(mockAdminGameService.listGames).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'archived', page: 1 }),
      );
    });

    it('onStatusChange_All_ReloadsWithAllStatus', () => {
      fixture.detectChanges();
      mockAdminGameService.listGames.mockClear();

      component.onStatusChange('all');

      expect(mockAdminGameService.listGames).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'all', page: 1 }),
      );
    });

    it('onStatusChange_NonDefault_SetsActiveFiltersTrue', () => {
      fixture.detectChanges();

      component.onStatusChange('archived');

      expect(component.hasActiveFilters()).toBe(true);
    });
  });

  describe('pagination', () => {
    it('onPageChange_ToPage2_LoadsPage2', () => {
      fixture.detectChanges();
      mockAdminGameService.listGames.mockClear();

      component.onPageChange(2);

      expect(mockAdminGameService.listGames).toHaveBeenCalledWith(
        expect.objectContaining({ page: 2 }),
      );
    });
  });

  describe('navigation', () => {
    it('viewGame_ValidGame_NavigatesToDetail', () => {
      fixture.detectChanges();

      component.viewGame(mockGame);

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/admin/games', 'game-1']);
    });

    it('editGame_ValidGame_NavigatesToEdit', () => {
      fixture.detectChanges();
      const event = new Event('click');
      vi.spyOn(event, 'stopPropagation');

      component.editGame(mockGame, event);

      expect(event.stopPropagation).toHaveBeenCalled();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/admin/games', 'game-1', 'edit']);
    });

    it('createGame_NavigatesToNew', () => {
      fixture.detectChanges();

      component.createGame();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/admin/games/new']);
    });
  });

  describe('empty states', () => {
    it('noGames_NoActiveFilters_ShowsEmptyState', () => {
      const emptyResult: PaginatedResult<GameSummary> = {
        data: [],
        pagination: { page: 1, page_size: 25, total_items: 0, total_pages: 0 },
      };
      mockAdminGameService.listGames.mockReturnValue(of(emptyResult));
      fixture.detectChanges();

      const emptyState = fixture.nativeElement.querySelector('app-empty-state');
      expect(emptyState).toBeTruthy();
    });
  });

  describe('error handling', () => {
    it('dismissError_ClearsError', () => {
      mockAdminGameService.listGames.mockReturnValue(throwError(() => new Error('fail')));
      fixture.detectChanges();

      component.dismissError();

      expect(component.error()).toBeNull();
    });
  });
});
