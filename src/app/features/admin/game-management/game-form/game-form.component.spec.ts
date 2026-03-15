import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GameDetail } from '../../../../models/game.model';
import { GameFormComponent } from './game-form.component';

describe('GameFormComponent', () => {
  let component: GameFormComponent;
  let fixture: ComponentFixture<GameFormComponent>;

  const mockGameDetail: GameDetail = {
    id: 'game-1',
    name: 'Catan',
    publisher: 'Kosmos',
    year_published: 1995,
    edition: '5th Edition',
    min_players: 3,
    max_players: 4,
    description: 'A classic trading game',
    cover_image_url: null,
    complexity: 'medium',
    tags: ['strategy', 'trading'],
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
    await TestBed.configureTestingModule({
      imports: [GameFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GameFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('form creation', () => {
    it('init_NoGame_FormIsEmpty', () => {
      expect(component.form.get('name')?.value).toBe('');
      expect(component.tags()).toEqual([]);
    });

    it('init_FormIsInvalid_NameRequired', () => {
      expect(component.form.valid).toBe(false);
    });

    it('init_WithName_FormIsValid', () => {
      component.form.patchValue({ name: 'Test Game' });

      expect(component.form.valid).toBe(true);
    });
  });

  describe('edit mode pre-population', () => {
    it('ngOnChanges_WithGame_PopulatesForm', () => {
      component.game = mockGameDetail;
      component.ngOnChanges({
        game: {
          currentValue: mockGameDetail,
          previousValue: null,
          firstChange: true,
          isFirstChange: () => true,
        },
      });

      expect(component.form.get('name')?.value).toBe('Catan');
      expect(component.form.get('publisher')?.value).toBe('Kosmos');
      expect(component.form.get('year_published')?.value).toBe(1995);
      expect(component.form.get('complexity')?.value).toBe('medium');
      expect(component.tags()).toEqual(['strategy', 'trading']);
    });
  });

  describe('form submission', () => {
    it('onSubmit_ValidForm_EmitsFormData', () => {
      const emitSpy = vi.spyOn(component.formSubmitted, 'emit');
      component.form.patchValue({ name: 'New Game', publisher: 'Publisher' });

      component.onSubmit();

      expect(emitSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'New Game',
          publisher: 'Publisher',
        }),
      );
    });

    it('onSubmit_InvalidForm_DoesNotEmit', () => {
      const emitSpy = vi.spyOn(component.formSubmitted, 'emit');

      component.onSubmit();

      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('onSubmit_InvalidForm_MarksTouched', () => {
      component.onSubmit();

      expect(component.form.get('name')?.touched).toBe(true);
    });

    it('onSubmit_MinExceedsMax_DoesNotEmit', () => {
      const emitSpy = vi.spyOn(component.formSubmitted, 'emit');
      component.form.patchValue({
        name: 'Test',
        min_players: 5,
        max_players: 2,
      });

      component.onSubmit();

      expect(emitSpy).not.toHaveBeenCalled();
      expect(component.playerRangeError()).toBe(true);
    });

    it('onSubmit_WithTags_IncludesTagsInPayload', () => {
      const emitSpy = vi.spyOn(component.formSubmitted, 'emit');
      component.form.patchValue({ name: 'Tagged Game' });
      component.addTag(new Event('submit'));
      component.onTagInputChange('strategy');
      component.addTag(new Event('submit'));

      component.onSubmit();

      expect(emitSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Tagged Game',
          tags: ['strategy'],
        }),
      );
    });
  });

  describe('tag management', () => {
    it('addTag_ValidInput_AddsTag', () => {
      component.onTagInputChange('strategy');
      component.addTag(new Event('submit'));

      expect(component.tags()).toEqual(['strategy']);
      expect(component.tagInput()).toBe('');
    });

    it('addTag_DuplicateInput_DoesNotAddDuplicate', () => {
      component.onTagInputChange('strategy');
      component.addTag(new Event('submit'));
      component.onTagInputChange('strategy');
      component.addTag(new Event('submit'));

      expect(component.tags()).toEqual(['strategy']);
    });

    it('addTag_EmptyInput_DoesNotAddTag', () => {
      component.onTagInputChange('');
      component.addTag(new Event('submit'));

      expect(component.tags()).toEqual([]);
    });

    it('removeTag_ExistingTag_RemovesTag', () => {
      component.onTagInputChange('strategy');
      component.addTag(new Event('submit'));
      component.onTagInputChange('party');
      component.addTag(new Event('submit'));

      component.removeTag('strategy');

      expect(component.tags()).toEqual(['party']);
    });
  });

  describe('cancel', () => {
    it('onCancel_EmitsCancelledEvent', () => {
      const emitSpy = vi.spyOn(component.cancelled, 'emit');

      component.onCancel();

      expect(emitSpy).toHaveBeenCalled();
    });
  });

  describe('validation helpers', () => {
    it('hasError_UntouchedField_ReturnsFalse', () => {
      expect(component.hasError('name')).toBe(false);
    });

    it('hasError_TouchedInvalidField_ReturnsTrue', () => {
      component.form.get('name')?.markAsTouched();

      expect(component.hasError('name')).toBe(true);
    });
  });
});
