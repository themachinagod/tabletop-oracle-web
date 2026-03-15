import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { GameDetail } from '../../../models/game.model';
import { AdminGameService } from '../../../core/services/admin-game.service';
import { AdminExpansionService } from '../../../core/services/admin-expansion.service';
import { AdminGameDetailComponent } from './admin-game-detail.component';

describe('AdminGameDetailComponent', () => {
  let component: AdminGameDetailComponent;
  let fixture: ComponentFixture<AdminGameDetailComponent>;
  let mockAdminGameService: {
    getGame: ReturnType<typeof vi.fn>;
    archiveGame: ReturnType<typeof vi.fn>;
    restoreGame: ReturnType<typeof vi.fn>;
  };
  let mockRouter: { navigate: ReturnType<typeof vi.fn> };

  const mockGameDetail: GameDetail = {
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
    created_by: 'user-1',
    archived_at: null,
    expansions: [],
  };

  const archivedGame: GameDetail = {
    ...mockGameDetail,
    is_active: false,
    archived_at: '2026-03-15T00:00:00Z',
  };

  beforeEach(async () => {
    mockAdminGameService = {
      getGame: vi.fn().mockReturnValue(of(mockGameDetail)),
      archiveGame: vi.fn().mockReturnValue(of(archivedGame)),
      restoreGame: vi.fn().mockReturnValue(of(mockGameDetail)),
    };
    mockRouter = { navigate: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [AdminGameDetailComponent],
      providers: [
        { provide: AdminGameService, useValue: mockAdminGameService },
        {
          provide: AdminExpansionService,
          useValue: {
            listExpansions: vi.fn().mockReturnValue(of([])),
            createExpansion: vi.fn(),
            updateExpansion: vi.fn(),
            archiveExpansion: vi.fn(),
            restoreExpansion: vi.fn(),
          },
        },
        { provide: Router, useValue: mockRouter },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => (key === 'gameId' ? 'game-1' : null),
              },
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminGameDetailComponent);
    component = fixture.componentInstance;
  });

  describe('initialisation', () => {
    it('ngOnInit_Success_LoadsGame', () => {
      fixture.detectChanges();

      expect(component.game()).toEqual(mockGameDetail);
      expect(component.loading()).toBe(false);
      expect(component.error()).toBeNull();
    });

    it('ngOnInit_ApiError_SetsErrorMessage', () => {
      mockAdminGameService.getGame.mockReturnValue(throwError(() => new Error('fail')));
      fixture.detectChanges();

      expect(component.error()).toBe('Failed to load game. Please try again.');
      expect(component.loading()).toBe(false);
    });

    it('ngOnInit_DefaultTab_IsOverview', () => {
      fixture.detectChanges();

      expect(component.activeTab()).toBe('overview');
    });
  });

  describe('tab navigation', () => {
    it('selectTab_Documents_SwitchesToDocuments', () => {
      fixture.detectChanges();

      component.selectTab('documents');

      expect(component.activeTab()).toBe('documents');
    });

    it('selectTab_Expansions_SwitchesToExpansions', () => {
      fixture.detectChanges();

      component.selectTab('expansions');

      expect(component.activeTab()).toBe('expansions');
    });
  });

  describe('archive flow', () => {
    it('confirmArchive_OpensDialog', () => {
      fixture.detectChanges();

      component.confirmArchive();

      expect(component.showArchiveDialog()).toBe(true);
    });

    it('onArchiveConfirmed_Success_UpdatesGame', () => {
      fixture.detectChanges();

      component.onArchiveConfirmed();

      expect(mockAdminGameService.archiveGame).toHaveBeenCalledWith('game-1');
      expect(component.game()?.is_active).toBe(false);
      expect(component.showArchiveDialog()).toBe(false);
    });

    it('onArchiveConfirmed_ApiError_SetsErrorMessage', () => {
      fixture.detectChanges();
      mockAdminGameService.archiveGame.mockReturnValue(throwError(() => new Error('fail')));

      component.onArchiveConfirmed();

      expect(component.error()).toBe('Failed to archive game. Please try again.');
    });

    it('onArchiveCancelled_ClosesDialog', () => {
      fixture.detectChanges();
      component.confirmArchive();

      component.onArchiveCancelled();

      expect(component.showArchiveDialog()).toBe(false);
    });
  });

  describe('restore flow', () => {
    it('confirmRestore_OpensDialog', () => {
      fixture.detectChanges();

      component.confirmRestore();

      expect(component.showRestoreDialog()).toBe(true);
    });

    it('onRestoreConfirmed_Success_UpdatesGame', () => {
      fixture.detectChanges();

      component.onRestoreConfirmed();

      expect(mockAdminGameService.restoreGame).toHaveBeenCalledWith('game-1');
      expect(component.game()?.is_active).toBe(true);
      expect(component.showRestoreDialog()).toBe(false);
    });

    it('onRestoreConfirmed_ApiError_SetsErrorMessage', () => {
      fixture.detectChanges();
      mockAdminGameService.restoreGame.mockReturnValue(throwError(() => new Error('fail')));

      component.onRestoreConfirmed();

      expect(component.error()).toBe('Failed to restore game. Please try again.');
    });
  });

  describe('navigation', () => {
    it('editGame_NavigatesToEditRoute', () => {
      fixture.detectChanges();

      component.editGame();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/admin/games', 'game-1', 'edit']);
    });

    it('goBack_NavigatesToAdminHome', () => {
      fixture.detectChanges();

      component.goBack();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/admin']);
    });
  });

  describe('player count display', () => {
    it('playerCountDisplay_Range_ShowsRange', () => {
      fixture.detectChanges();

      expect(component.playerCountDisplay).toBe('3-4 players');
    });

    it('playerCountDisplay_SameMinMax_ShowsSingle', () => {
      const samePlayerGame = { ...mockGameDetail, min_players: 4, max_players: 4 };
      mockAdminGameService.getGame.mockReturnValue(of(samePlayerGame));
      fixture.detectChanges();

      expect(component.playerCountDisplay).toBe('4 players');
    });

    it('playerCountDisplay_NullPlayers_ReturnsNull', () => {
      const noPlayerGame = { ...mockGameDetail, min_players: null, max_players: null };
      mockAdminGameService.getGame.mockReturnValue(of(noPlayerGame));
      fixture.detectChanges();

      expect(component.playerCountDisplay).toBeNull();
    });
  });

  describe('error handling', () => {
    it('dismissError_ClearsError', () => {
      mockAdminGameService.getGame.mockReturnValue(throwError(() => new Error('fail')));
      fixture.detectChanges();

      component.dismissError();

      expect(component.error()).toBeNull();
    });
  });
});
