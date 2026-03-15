import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { GameDetail } from '../../../models/game.model';
import { GameService } from '../../../core/services/game.service';
import { GameDetailComponent } from './game-detail.component';

describe('GameDetailComponent', () => {
  let component: GameDetailComponent;
  let fixture: ComponentFixture<GameDetailComponent>;
  let mockGameService: { getGame: ReturnType<typeof vi.fn> };
  let mockRouter: { navigate: ReturnType<typeof vi.fn> };

  const mockGameDetail: GameDetail = {
    id: 'game-1',
    name: 'Catan',
    publisher: 'Kosmos',
    year_published: 1995,
    edition: '5th Edition',
    min_players: 3,
    max_players: 4,
    description: 'A classic trading and building game.',
    cover_image_url: 'https://example.com/catan.jpg',
    complexity: 'medium',
    tags: ['strategy', 'trading'],
    is_active: true,
    document_count: 2,
    expansion_count: 1,
    created_at: '2026-03-14T00:00:00Z',
    updated_at: '2026-03-14T12:00:00Z',
    created_by: 'user-1',
    archived_at: null,
    expansions: [
      {
        id: 'exp-1',
        name: 'Seafarers',
        description: 'Explore the seas of Catan',
        year_published: 1997,
        is_active: true,
      },
    ],
  };

  function createComponent(gameId: string | null = 'game-1'): void {
    mockGameService = { getGame: vi.fn().mockReturnValue(of(mockGameDetail)) };
    mockRouter = { navigate: vi.fn() };

    TestBed.configureTestingModule({
      imports: [GameDetailComponent],
      providers: [
        { provide: GameService, useValue: mockGameService },
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

    fixture = TestBed.createComponent(GameDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  describe('initialisation', () => {
    it('ngOnInit_ValidGameId_LoadsGameDetail', () => {
      createComponent('game-1');

      expect(component.game()).toEqual(mockGameDetail);
      expect(component.loading()).toBe(false);
      expect(component.error()).toBeNull();
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
      mockRouter = { navigate: vi.fn() };

      TestBed.configureTestingModule({
        imports: [GameDetailComponent],
        providers: [
          { provide: GameService, useValue: mockGameService },
          { provide: Router, useValue: mockRouter },
          {
            provide: ActivatedRoute,
            useValue: {
              snapshot: { paramMap: { get: () => 'game-1' } },
            },
          },
        ],
      });

      fixture = TestBed.createComponent(GameDetailComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(component.error()).toBe('Failed to load game details. Please try again.');
      expect(component.loading()).toBe(false);
    });
  });

  describe('playerCountDisplay', () => {
    it('playerCountDisplay_Range_FormatsAsRange', () => {
      createComponent();

      expect(component.playerCountDisplay).toBe('3-4 players');
    });

    it('playerCountDisplay_SameMinMax_FormatsSingle', () => {
      createComponent();
      component.game.set({ ...mockGameDetail, min_players: 2, max_players: 2 });

      expect(component.playerCountDisplay).toBe('2 players');
    });

    it('playerCountDisplay_NullPlayers_ReturnsNull', () => {
      createComponent();
      component.game.set({ ...mockGameDetail, min_players: null, max_players: null });

      expect(component.playerCountDisplay).toBeNull();
    });

    it('playerCountDisplay_NoGame_ReturnsNull', () => {
      createComponent(null);

      expect(component.playerCountDisplay).toBeNull();
    });
  });

  describe('publisherYear', () => {
    it('publisherYear_BothSet_FormatsComplete', () => {
      createComponent();

      expect(component.publisherYear).toBe('Kosmos (1995)');
    });

    it('publisherYear_OnlyPublisher_ReturnsPublisher', () => {
      createComponent();
      component.game.set({ ...mockGameDetail, year_published: null });

      expect(component.publisherYear).toBe('Kosmos');
    });

    it('publisherYear_OnlyYear_ReturnsYear', () => {
      createComponent();
      component.game.set({ ...mockGameDetail, publisher: null });

      expect(component.publisherYear).toBe('(1995)');
    });

    it('publisherYear_NeitherSet_ReturnsNull', () => {
      createComponent();
      component.game.set({ ...mockGameDetail, publisher: null, year_published: null });

      expect(component.publisherYear).toBeNull();
    });
  });

  describe('navigation', () => {
    it('startSession_NavigatesToNewSession', () => {
      createComponent();

      component.startSession();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/games', 'game-1', 'new-session']);
    });

    it('goBack_NavigatesToGameBrowser', () => {
      createComponent();

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
});
