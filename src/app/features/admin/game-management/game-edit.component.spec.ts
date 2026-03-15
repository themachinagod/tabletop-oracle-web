import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { GameCreate, GameDetail } from '../../../models/game.model';
import { AdminGameService } from '../../../core/services/admin-game.service';
import { GameEditComponent } from './game-edit.component';

describe('GameEditComponent', () => {
  let component: GameEditComponent;
  let fixture: ComponentFixture<GameEditComponent>;
  let mockAdminGameService: {
    getGame: ReturnType<typeof vi.fn>;
    updateGame: ReturnType<typeof vi.fn>;
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

  beforeEach(async () => {
    mockAdminGameService = {
      getGame: vi.fn().mockReturnValue(of(mockGameDetail)),
      updateGame: vi.fn().mockReturnValue(of(mockGameDetail)),
    };
    mockRouter = { navigate: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [GameEditComponent],
      providers: [
        { provide: AdminGameService, useValue: mockAdminGameService },
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

    fixture = TestBed.createComponent(GameEditComponent);
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
  });

  describe('update flow', () => {
    it('onUpdate_Success_NavigatesToGameDetail', () => {
      fixture.detectChanges();
      const payload: GameCreate = { name: 'Updated Catan' };

      component.onUpdate(payload);

      expect(mockAdminGameService.updateGame).toHaveBeenCalledWith('game-1', payload);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/admin/games', 'game-1']);
    });

    it('onUpdate_ApiError_SetsErrorMessage', () => {
      fixture.detectChanges();
      mockAdminGameService.updateGame.mockReturnValue(throwError(() => new Error('fail')));

      component.onUpdate({ name: 'Bad Update' });

      expect(component.error()).toBe('Failed to update game. Please try again.');
      expect(component.submitting()).toBe(false);
    });
  });

  describe('cancel', () => {
    it('onCancel_NavigatesToGameDetail', () => {
      fixture.detectChanges();

      component.onCancel();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/admin/games', 'game-1']);
    });
  });
});
