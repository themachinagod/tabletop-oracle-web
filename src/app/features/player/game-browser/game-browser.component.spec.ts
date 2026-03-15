import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { PaginatedResult } from '../../../models/api.model';
import { GameSummary, TagCount } from '../../../models/game.model';
import { GameService } from '../../../core/services/game.service';
import { GameBrowserComponent } from './game-browser.component';

describe('GameBrowserComponent', () => {
  let component: GameBrowserComponent;
  let fixture: ComponentFixture<GameBrowserComponent>;
  let mockGameService: {
    listGames: ReturnType<typeof vi.fn>;
    getTags: ReturnType<typeof vi.fn>;
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
    description: 'A trading game',
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
    pagination: { page: 1, page_size: 12, total_items: 1, total_pages: 1 },
  };

  const mockTags: TagCount[] = [
    { tag: 'strategy', count: 5 },
    { tag: 'party', count: 3 },
  ];

  beforeEach(async () => {
    mockGameService = {
      listGames: vi.fn().mockReturnValue(of(mockPaginatedResult)),
      getTags: vi.fn().mockReturnValue(of(mockTags)),
    };
    mockRouter = { navigate: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [GameBrowserComponent],
      providers: [
        { provide: GameService, useValue: mockGameService },
        { provide: Router, useValue: mockRouter },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GameBrowserComponent);
    component = fixture.componentInstance;
  });

  describe('initialisation', () => {
    it('ngOnInit_Success_LoadsGamesAndTags', () => {
      fixture.detectChanges();

      expect(component.games()).toEqual([mockGame]);
      expect(component.availableTags()).toEqual(mockTags);
      expect(component.loading()).toBe(false);
      expect(component.error()).toBeNull();
    });

    it('ngOnInit_Success_SetsPagination', () => {
      fixture.detectChanges();

      expect(component.pagination()).toEqual(mockPaginatedResult.pagination);
    });

    it('ngOnInit_ApiError_SetsErrorMessage', () => {
      mockGameService.listGames.mockReturnValue(throwError(() => new Error('fail')));
      fixture.detectChanges();

      expect(component.error()).toBe('Failed to load games. Please try again.');
      expect(component.loading()).toBe(false);
    });
  });

  describe('filtering', () => {
    it('onFiltersChanged_WithSearch_ReloadsGames', () => {
      fixture.detectChanges();
      mockGameService.listGames.mockClear();

      component.onFiltersChanged({ search: 'catan' });

      expect(mockGameService.listGames).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'catan', page: 1 }),
      );
    });

    it('onFiltersChanged_WithFilters_SetsActiveFiltersTrue', () => {
      fixture.detectChanges();

      component.onFiltersChanged({ search: 'test' });

      expect(component.hasActiveFilters()).toBe(true);
    });

    it('onFiltersChanged_EmptyFilters_SetsActiveFiltersFalse', () => {
      fixture.detectChanges();

      component.onFiltersChanged({});

      expect(component.hasActiveFilters()).toBe(false);
    });
  });

  describe('pagination', () => {
    it('onPageChange_ToPage2_LoadsPage2', () => {
      fixture.detectChanges();
      mockGameService.listGames.mockClear();

      component.onPageChange(2);

      expect(mockGameService.listGames).toHaveBeenCalledWith(expect.objectContaining({ page: 2 }));
    });
  });

  describe('navigation', () => {
    it('onGameSelected_ValidGame_NavigatesToDetail', () => {
      fixture.detectChanges();

      component.onGameSelected(mockGame);

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/games', 'game-1']);
    });
  });

  describe('empty states', () => {
    it('noGames_NoActiveFilters_ShowsNoGamesAvailable', () => {
      const emptyResult: PaginatedResult<GameSummary> = {
        data: [],
        pagination: { page: 1, page_size: 12, total_items: 0, total_pages: 0 },
      };
      mockGameService.listGames.mockReturnValue(of(emptyResult));
      fixture.detectChanges();

      const emptyState = fixture.nativeElement.querySelector('app-empty-state');
      expect(emptyState).toBeTruthy();
    });

    it('noGames_WithActiveFilters_ShowsNoMatchMessage', () => {
      fixture.detectChanges();

      const emptyResult: PaginatedResult<GameSummary> = {
        data: [],
        pagination: { page: 1, page_size: 12, total_items: 0, total_pages: 0 },
      };
      mockGameService.listGames.mockReturnValue(of(emptyResult));

      component.onFiltersChanged({ search: 'nonexistent' });
      fixture.detectChanges();

      expect(component.hasActiveFilters()).toBe(true);
      expect(component.games().length).toBe(0);
    });
  });

  describe('tag loading failure', () => {
    it('ngOnInit_TagsApiFails_StillLoadsGames', () => {
      mockGameService.getTags.mockReturnValue(throwError(() => new Error('tags fail')));
      fixture.detectChanges();

      expect(component.games()).toEqual([mockGame]);
      expect(component.availableTags()).toEqual([]);
      expect(component.loading()).toBe(false);
      expect(component.error()).toBeNull();
    });
  });

  describe('error handling', () => {
    it('dismissError_ClearsError', () => {
      mockGameService.listGames.mockReturnValue(throwError(() => new Error('fail')));
      fixture.detectChanges();

      component.dismissError();

      expect(component.error()).toBeNull();
    });
  });
});
