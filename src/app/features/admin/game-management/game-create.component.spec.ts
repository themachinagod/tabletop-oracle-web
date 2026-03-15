import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { GameCreate, GameDetail } from '../../../models/game.model';
import { AdminGameService } from '../../../core/services/admin-game.service';
import { GameCreateComponent } from './game-create.component';

describe('GameCreateComponent', () => {
  let component: GameCreateComponent;
  let fixture: ComponentFixture<GameCreateComponent>;
  let mockAdminGameService: {
    createGame: ReturnType<typeof vi.fn>;
  };
  let mockRouter: { navigate: ReturnType<typeof vi.fn> };

  const mockCreatedGame: GameDetail = {
    id: 'new-game-1',
    name: 'New Game',
    publisher: null,
    year_published: null,
    edition: null,
    min_players: null,
    max_players: null,
    description: null,
    cover_image_url: null,
    complexity: null,
    tags: [],
    is_active: true,
    document_count: 0,
    expansion_count: 0,
    created_at: '2026-03-15T00:00:00Z',
    updated_at: '2026-03-15T00:00:00Z',
    created_by: 'user-1',
    archived_at: null,
    expansions: [],
  };

  beforeEach(async () => {
    mockAdminGameService = {
      createGame: vi.fn().mockReturnValue(of(mockCreatedGame)),
    };
    mockRouter = { navigate: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [GameCreateComponent],
      providers: [
        { provide: AdminGameService, useValue: mockAdminGameService },
        { provide: Router, useValue: mockRouter },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GameCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('creation flow', () => {
    it('onCreate_Success_NavigatesToGameDetail', () => {
      const payload: GameCreate = { name: 'New Game' };

      component.onCreate(payload);

      expect(mockAdminGameService.createGame).toHaveBeenCalledWith(payload);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/admin/games', 'new-game-1']);
      expect(component.submitting()).toBe(false);
    });

    it('onCreate_ApiError_SetsErrorMessage', () => {
      mockAdminGameService.createGame.mockReturnValue(throwError(() => new Error('fail')));

      component.onCreate({ name: 'Bad Game' });

      expect(component.error()).toBe('Failed to create game. Please try again.');
      expect(component.submitting()).toBe(false);
    });

    it('onCreate_WhileSubmitting_SetsSubmittingTrue', () => {
      mockAdminGameService.createGame.mockReturnValue(of(mockCreatedGame));

      // Check that submitting was set during call
      let wasSubmitting = false;
      const origSet = component.submitting.set.bind(component.submitting);
      vi.spyOn(component.submitting, 'set').mockImplementation((v: boolean) => {
        if (v === true) {
          wasSubmitting = true;
        }
        origSet(v);
      });

      component.onCreate({ name: 'Test' });

      expect(wasSubmitting).toBe(true);
    });
  });

  describe('cancel', () => {
    it('onCancel_NavigatesToAdminHome', () => {
      component.onCancel();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/admin']);
    });
  });
});
