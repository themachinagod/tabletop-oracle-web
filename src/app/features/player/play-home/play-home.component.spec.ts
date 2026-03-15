import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { PaginatedResult, PaginationMeta } from '../../../models/api.model';
import { SessionSummary } from '../../../models/session.model';
import { SessionService } from '../../../core/services/session.service';
import { PlayHomeComponent } from './play-home.component';

describe('PlayHomeComponent', () => {
  let component: PlayHomeComponent;
  let fixture: ComponentFixture<PlayHomeComponent>;
  let mockSessionService: {
    listSessions: ReturnType<typeof vi.fn>;
    updateSessionStatus: ReturnType<typeof vi.fn>;
  };
  let mockRouter: { navigate: ReturnType<typeof vi.fn> };

  const defaultPagination: PaginationMeta = {
    page: 1,
    page_size: 25,
    total_items: 2,
    total_pages: 1,
  };

  const mockSessions: SessionSummary[] = [
    {
      id: 'session-1',
      game_id: 'game-1',
      game_name: 'Catan',
      game_cover_image_url: null,
      name: 'Friday Catan',
      player_count: 4,
      status: 'active',
      expansions: [],
      last_active_at: '2026-03-15T00:00:00Z',
      created_at: '2026-03-14T00:00:00Z',
      last_message_preview: null,
      message_count: 5,
    },
    {
      id: 'session-2',
      game_id: 'game-2',
      game_name: 'Wingspan',
      game_cover_image_url: 'https://example.com/wingspan.jpg',
      name: 'Bird game',
      player_count: 2,
      status: 'active',
      expansions: [{ id: 'exp-1', name: 'European Expansion' }],
      last_active_at: '2026-03-14T12:00:00Z',
      created_at: '2026-03-13T00:00:00Z',
      last_message_preview: 'What birds score bonus?',
      message_count: 10,
    },
  ];

  const mockArchivedSessions: SessionSummary[] = [
    {
      id: 'session-3',
      game_id: 'game-1',
      game_name: 'Catan',
      game_cover_image_url: null,
      name: 'Old Catan game',
      player_count: 3,
      status: 'archived',
      expansions: [],
      last_active_at: '2026-03-10T00:00:00Z',
      created_at: '2026-03-09T00:00:00Z',
      last_message_preview: null,
      message_count: 20,
    },
  ];

  const buildResult = (
    data: SessionSummary[],
    pagination: PaginationMeta = defaultPagination,
  ): PaginatedResult<SessionSummary> => ({ data, pagination });

  beforeEach(async () => {
    mockSessionService = {
      listSessions: vi.fn().mockReturnValue(of(buildResult(mockSessions))),
      updateSessionStatus: vi.fn(),
    };
    mockRouter = { navigate: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [PlayHomeComponent],
      providers: [
        { provide: SessionService, useValue: mockSessionService },
        { provide: Router, useValue: mockRouter },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PlayHomeComponent);
    component = fixture.componentInstance;
  });

  describe('initialization', () => {
    it('ngOnInit_WithSessions_LoadsAndDisplaysSessions', () => {
      fixture.detectChanges();

      expect(mockSessionService.listSessions).toHaveBeenCalled();
      expect(component.activeSessions()).toEqual(mockSessions);
      expect(component.loading()).toBe(false);
    });

    it('ngOnInit_WithSessions_DisplaysTitle', () => {
      fixture.detectChanges();

      const title = fixture.nativeElement.querySelector('.play-home__title');
      expect(title.textContent).toBe('Your Sessions');
    });

    it('ngOnInit_WithSessions_DisplaysNewSessionButton', () => {
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('.play-home__new-session');
      expect(button).toBeTruthy();
      expect(button.textContent.trim()).toBe('New Session');
    });
  });

  describe('loading state', () => {
    it('loading_BeforeInit_IsTrue', () => {
      expect(component.loading()).toBe(true);
    });
  });

  describe('error handling', () => {
    it('listSessions_ApiError_DisplaysErrorBanner', () => {
      mockSessionService.listSessions.mockReturnValue(throwError(() => new Error('fail')));
      fixture.detectChanges();

      expect(component.error()).toBe('Failed to load sessions. Please try again.');

      const banner = fixture.nativeElement.querySelector('app-error-banner');
      expect(banner).toBeTruthy();
    });

    it('dismissError_AfterError_ClearsErrorBanner', () => {
      mockSessionService.listSessions.mockReturnValue(throwError(() => new Error('fail')));
      fixture.detectChanges();

      component.dismissError();
      fixture.detectChanges();

      expect(component.error()).toBeNull();
      const banner = fixture.nativeElement.querySelector('app-error-banner');
      expect(banner).toBeFalsy();
    });
  });

  describe('empty states', () => {
    it('noActiveSessions_GamesExist_ShowsNoSessionsEmptyState', () => {
      mockSessionService.listSessions.mockImplementation((filters: { page_size?: number }) => {
        if (filters?.page_size === 1) {
          // checkForGames: sessions exist somewhere
          return of(buildResult([], { page: 1, page_size: 1, total_items: 5, total_pages: 5 }));
        }
        return of(buildResult([]));
      });
      fixture.detectChanges();

      expect(component.showNoSessionsState()).toBe(true);
      expect(component.showNoGamesState()).toBe(false);

      const emptyState = fixture.nativeElement.querySelector('app-empty-state');
      expect(emptyState).toBeTruthy();
    });

    it('noGamesExist_ShowsNoGamesEmptyState', () => {
      mockSessionService.listSessions.mockReturnValue(
        of(buildResult([], { page: 1, page_size: 25, total_items: 0, total_pages: 0 })),
      );
      fixture.detectChanges();

      expect(component.showNoGamesState()).toBe(true);
      expect(component.showNoSessionsState()).toBe(false);
    });
  });

  describe('game filter', () => {
    it('gameFilterOptions_WithSessions_ExtractsUniqueGames', () => {
      fixture.detectChanges();

      const options = component.gameFilterOptions();
      expect(options.length).toBe(2);
      expect(options.map((o) => o.name)).toEqual(['Catan', 'Wingspan']);
    });

    it('gameFilterOptions_WithSessions_DisplaysDropdown', () => {
      fixture.detectChanges();

      const select = fixture.nativeElement.querySelector('.play-home__game-select');
      expect(select).toBeTruthy();
    });

    it('onGameFilterChange_WithGameId_ReloadsWithFilter', () => {
      fixture.detectChanges();
      mockSessionService.listSessions.mockClear();

      component.onGameFilterChange('game-1');

      expect(mockSessionService.listSessions).toHaveBeenCalledWith(
        expect.objectContaining({ game_id: 'game-1' }),
      );
    });

    it('onGameFilterChange_EmptyString_ReloadsWithoutGameId', () => {
      fixture.detectChanges();
      mockSessionService.listSessions.mockClear();

      component.onGameFilterChange('');

      const callArgs = mockSessionService.listSessions.mock.calls[0][0];
      expect(callArgs.game_id).toBeUndefined();
    });
  });

  describe('archived sessions', () => {
    it('toggleArchived_TurnsOn_LoadsArchivedSessions', () => {
      fixture.detectChanges();

      mockSessionService.listSessions.mockReturnValue(of(buildResult(mockArchivedSessions)));

      component.toggleArchived();
      fixture.detectChanges();

      expect(component.showArchived()).toBe(true);
      expect(component.archivedSessions().length).toBe(1);
    });

    it('toggleArchived_TurnsOff_ClearsArchivedSessions', () => {
      fixture.detectChanges();
      mockSessionService.listSessions.mockReturnValue(of(buildResult(mockArchivedSessions)));

      component.toggleArchived(); // on
      component.toggleArchived(); // off

      expect(component.showArchived()).toBe(false);
      expect(component.archivedSessions()).toEqual([]);
    });

    it('toggleArchived_WithNoArchived_ShowsNoArchivedMessage', () => {
      fixture.detectChanges();
      mockSessionService.listSessions.mockReturnValue(of(buildResult([])));

      component.toggleArchived();
      fixture.detectChanges();

      const noArchived = fixture.nativeElement.querySelector('.play-home__no-archived');
      expect(noArchived).toBeTruthy();
    });
  });

  describe('session navigation', () => {
    it('onSessionSelected_WithSession_NavigatesToChatView', () => {
      fixture.detectChanges();

      component.onSessionSelected(mockSessions[0]);

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/sessions', 'session-1']);
    });
  });

  describe('restore session', () => {
    it('onRestoreSession_Success_ReloadsActiveSessions', () => {
      const restoredSession = { ...mockArchivedSessions[0], status: 'active' as const };
      mockSessionService.updateSessionStatus.mockReturnValue(of(restoredSession));
      fixture.detectChanges();

      mockSessionService.listSessions.mockClear();
      component.onRestoreSession(mockArchivedSessions[0]);

      expect(mockSessionService.updateSessionStatus).toHaveBeenCalledWith('session-3', 'active');
      expect(mockSessionService.listSessions).toHaveBeenCalled();
    });

    it('onRestoreSession_ApiError_DisplaysError', () => {
      mockSessionService.updateSessionStatus.mockReturnValue(throwError(() => new Error('fail')));
      fixture.detectChanges();

      component.onRestoreSession(mockArchivedSessions[0]);

      expect(component.error()).toBe('Failed to restore session. Please try again.');
    });
  });

  describe('new session action', () => {
    it('navigateToGames_Called_NavigatesToGameBrowser', () => {
      component.navigateToGames();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/games']);
    });

    it('newSessionButton_Clicked_NavigatesToGameBrowser', () => {
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('.play-home__new-session');
      button.click();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/games']);
    });
  });

  describe('pagination', () => {
    it('onPageChange_WithMultiplePages_ShowsPagination', () => {
      mockSessionService.listSessions.mockReturnValue(
        of(
          buildResult(mockSessions, {
            page: 1,
            page_size: 25,
            total_items: 50,
            total_pages: 2,
          }),
        ),
      );
      fixture.detectChanges();

      const pagination = fixture.nativeElement.querySelector('app-pagination');
      expect(pagination).toBeTruthy();
    });

    it('onPageChange_WithSinglePage_HidesPagination', () => {
      fixture.detectChanges();

      const pagination = fixture.nativeElement.querySelector('app-pagination');
      expect(pagination).toBeFalsy();
    });

    it('onPageChange_WithNewPage_ReloadsWithPage', () => {
      fixture.detectChanges();
      mockSessionService.listSessions.mockClear();

      component.onPageChange(3);

      expect(mockSessionService.listSessions).toHaveBeenCalledWith(
        expect.objectContaining({ page: 3 }),
      );
    });
  });
});
