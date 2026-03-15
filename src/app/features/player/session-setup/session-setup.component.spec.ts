import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { GameDetail } from '../../../models/game.model';
import { SessionSummary } from '../../../models/session.model';
import { GameService } from '../../../core/services/game.service';
import { SessionService } from '../../../core/services/session.service';
import { SessionSetupComponent } from './session-setup.component';

describe('SessionSetupComponent', () => {
  let component: SessionSetupComponent;
  let fixture: ComponentFixture<SessionSetupComponent>;
  let mockGameService: { getGame: ReturnType<typeof vi.fn> };
  let mockSessionService: { createSession: ReturnType<typeof vi.fn> };
  let mockRouter: { navigate: ReturnType<typeof vi.fn> };

  const mockGameDetail: GameDetail = {
    id: 'game-1',
    name: 'Catan',
    publisher: 'Kosmos',
    year_published: 1995,
    edition: null,
    min_players: 3,
    max_players: 4,
    description: 'A trading game',
    cover_image_url: 'https://example.com/catan.jpg',
    complexity: 'medium',
    tags: ['strategy'],
    is_active: true,
    document_count: 2,
    expansion_count: 2,
    created_at: '2026-03-14T00:00:00Z',
    updated_at: '2026-03-14T12:00:00Z',
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
      {
        id: 'exp-2',
        name: 'Cities & Knights',
        description: 'Advanced play',
        year_published: 1998,
        is_active: true,
      },
    ],
  };

  const mockGameNoExpansions: GameDetail = {
    ...mockGameDetail,
    expansion_count: 0,
    expansions: [],
  };

  const mockCreatedSession: SessionSummary = {
    id: 'session-new',
    game_id: 'game-1',
    game_name: 'Catan',
    game_cover_image_url: 'https://example.com/catan.jpg',
    name: 'Catan -- Mar 15, 2026',
    player_count: 4,
    status: 'active',
    expansions: [{ id: 'exp-1', name: 'Seafarers' }],
    last_active_at: '2026-03-15T00:00:00Z',
    created_at: '2026-03-15T00:00:00Z',
    last_message_preview: null,
    message_count: 0,
  };

  function createComponent(
    gameId: string | null = 'game-1',
    game: GameDetail = mockGameDetail,
  ): void {
    mockGameService = { getGame: vi.fn().mockReturnValue(of(game)) };
    mockSessionService = { createSession: vi.fn().mockReturnValue(of(mockCreatedSession)) };
    mockRouter = { navigate: vi.fn() };

    TestBed.configureTestingModule({
      imports: [SessionSetupComponent],
      providers: [
        { provide: GameService, useValue: mockGameService },
        { provide: SessionService, useValue: mockSessionService },
        { provide: Router, useValue: mockRouter },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => (key === 'gameId' ? gameId : null),
              },
            },
          },
        },
      ],
    });

    fixture = TestBed.createComponent(SessionSetupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  describe('initialisation', () => {
    it('ngOnInit_ValidGameId_LoadsGameAndSetsDefaultName', () => {
      createComponent('game-1');

      expect(component.game()).toEqual(mockGameDetail);
      expect(component.loading()).toBe(false);
      expect(component.error()).toBeNull();
      expect(component.sessionName()).toContain('Catan --');
      expect(mockGameService.getGame).toHaveBeenCalledWith('game-1');
    });

    it('ngOnInit_NullGameId_SetsError', () => {
      createComponent(null);

      expect(component.error()).toBe('Game not found.');
      expect(component.loading()).toBe(false);
      expect(mockGameService.getGame).not.toHaveBeenCalled();
    });

    it('ngOnInit_ApiError_SetsErrorMessage', () => {
      mockGameService = { getGame: vi.fn().mockReturnValue(throwError(() => new Error('fail'))) };
      mockSessionService = { createSession: vi.fn() };
      mockRouter = { navigate: vi.fn() };

      TestBed.configureTestingModule({
        imports: [SessionSetupComponent],
        providers: [
          { provide: GameService, useValue: mockGameService },
          { provide: SessionService, useValue: mockSessionService },
          { provide: Router, useValue: mockRouter },
          {
            provide: ActivatedRoute,
            useValue: {
              snapshot: { paramMap: { get: () => 'game-1' } },
            },
          },
        ],
      });

      fixture = TestBed.createComponent(SessionSetupComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(component.error()).toBe('Failed to load game details. Please try again.');
      expect(component.loading()).toBe(false);
    });

    it('ngOnInit_InactiveGame_SetsError', () => {
      const inactiveGame = { ...mockGameDetail, is_active: false };
      createComponent('game-1', inactiveGame);

      expect(component.error()).toBe('This game is not currently available.');
      expect(component.game()).toBeNull();
    });
  });

  describe('expansion selection', () => {
    it('onExpansionChange_UpdatesSelectedIds', () => {
      createComponent();

      component.onExpansionChange(['exp-1', 'exp-2']);

      expect(component.selectedExpansionIds()).toEqual(['exp-1', 'exp-2']);
    });

    it('render_GameWithExpansions_ShowsExpansionSelection', () => {
      createComponent('game-1', mockGameDetail);

      const element: HTMLElement = fixture.nativeElement;
      const expansionSection = element.querySelector('app-expansion-selection');

      expect(expansionSection).not.toBeNull();
    });

    it('render_GameWithNoExpansions_HidesExpansionSelection', () => {
      createComponent('game-1', mockGameNoExpansions);

      const element: HTMLElement = fixture.nativeElement;
      const expansionSection = element.querySelector('app-expansion-selection');

      expect(expansionSection).toBeNull();
    });
  });

  describe('player count', () => {
    it('onPlayerCountChange_UpdatesPlayerCount', () => {
      createComponent();

      component.onPlayerCountChange(4);

      expect(component.playerCount()).toBe(4);
    });

    it('onPlayerCountChange_Null_ClearsPlayerCount', () => {
      createComponent();
      component.onPlayerCountChange(4);

      component.onPlayerCountChange(null);

      expect(component.playerCount()).toBeNull();
    });
  });

  describe('session name', () => {
    it('onNameInput_UpdatesSessionName', () => {
      createComponent();
      const event = { target: { value: 'My Custom Session' } } as unknown as Event;

      component.onNameInput(event);

      expect(component.sessionName()).toBe('My Custom Session');
    });

    it('ngOnInit_GeneratesDefaultName_ContainsGameName', () => {
      createComponent();

      expect(component.sessionName()).toContain('Catan');
    });
  });

  describe('session creation', () => {
    it('startSession_ValidForm_CreatesSessionAndNavigates', () => {
      createComponent();
      component.onExpansionChange(['exp-1']);
      component.onPlayerCountChange(4);

      component.startSession();

      expect(mockSessionService.createSession).toHaveBeenCalledWith({
        game_id: 'game-1',
        expansion_ids: ['exp-1'],
        player_count: 4,
        name: component.sessionName(),
      });
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/sessions', 'session-new']);
    });

    it('startSession_NoPlayerCount_OmitsPlayerCount', () => {
      createComponent();

      component.startSession();

      const callArgs = mockSessionService.createSession.mock.calls[0][0];
      expect(callArgs.player_count).toBeUndefined();
    });

    it('startSession_EmptyName_SetsError', () => {
      createComponent();
      component.onNameInput({ target: { value: '   ' } } as unknown as Event);

      component.startSession();

      expect(component.error()).toBe('Please enter a session name.');
      expect(mockSessionService.createSession).not.toHaveBeenCalled();
    });

    it('startSession_ApiError_SetsErrorAndStopsCreating', () => {
      createComponent();
      mockSessionService.createSession.mockReturnValue(throwError(() => new Error('fail')));

      component.startSession();

      expect(component.error()).toBe('Failed to create session. Please try again.');
      expect(component.creating()).toBe(false);
    });

    it('startSession_WhileCreating_DoesNotDoubleSubmit', () => {
      createComponent();
      component.startSession();
      mockSessionService.createSession.mockClear();

      component.startSession();

      expect(mockSessionService.createSession).not.toHaveBeenCalled();
    });

    it('startSession_NoGame_DoesNothing', () => {
      createComponent(null);

      component.startSession();

      expect(mockSessionService.createSession).not.toHaveBeenCalled();
    });
  });

  describe('navigation', () => {
    it('goBack_WithGame_NavigatesToGameDetail', () => {
      createComponent();

      component.goBack();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/games', 'game-1']);
    });

    it('goBack_WithoutGame_NavigatesToGameBrowser', () => {
      createComponent(null);

      component.goBack();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/games']);
    });
  });

  describe('error handling', () => {
    it('dismissError_ClearsError', () => {
      createComponent(null);

      component.dismissError();

      expect(component.error()).toBeNull();
    });
  });

  describe('render', () => {
    it('render_Loading_ShowsSpinner', () => {
      createComponent();
      component.loading.set(true);
      fixture.detectChanges();

      const element: HTMLElement = fixture.nativeElement;
      expect(element.querySelector('app-loading-spinner')).not.toBeNull();
    });

    it('render_GameLoaded_ShowsGameName', () => {
      createComponent();

      const element: HTMLElement = fixture.nativeElement;
      const gameName = element.querySelector('.session-setup__game-name');

      expect(gameName?.textContent).toContain('Catan');
    });

    it('render_GameLoaded_ShowsFormElements', () => {
      createComponent();

      const element: HTMLElement = fixture.nativeElement;
      expect(element.querySelector('#session-name')).not.toBeNull();
      expect(element.querySelector('app-player-count-input')).not.toBeNull();
      expect(element.querySelector('.session-setup__submit')).not.toBeNull();
    });

    it('render_Creating_DisablesSubmitButton', () => {
      createComponent();
      component.creating.set(true);
      fixture.detectChanges();

      const element: HTMLElement = fixture.nativeElement;
      const button = element.querySelector<HTMLButtonElement>('.session-setup__submit');

      expect(button?.disabled).toBe(true);
      expect(button?.textContent).toContain('Creating...');
    });

    it('render_GameWithCoverImage_ShowsImage', () => {
      createComponent();

      const element: HTMLElement = fixture.nativeElement;
      const img = element.querySelector<HTMLImageElement>('.session-setup__cover');

      expect(img).not.toBeNull();
      expect(img?.src).toContain('catan.jpg');
    });

    it('render_GameWithoutCoverImage_ShowsPlaceholder', () => {
      createComponent('game-1', { ...mockGameDetail, cover_image_url: null });

      const element: HTMLElement = fixture.nativeElement;
      expect(element.querySelector('.session-setup__placeholder')).not.toBeNull();
    });
  });
});
