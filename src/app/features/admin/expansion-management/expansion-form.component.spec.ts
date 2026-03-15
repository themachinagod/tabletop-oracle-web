import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ExpansionDetail } from '../../../models/game.model';
import { ExpansionFormComponent } from './expansion-form.component';

describe('ExpansionFormComponent', () => {
  let component: ExpansionFormComponent;
  let fixture: ComponentFixture<ExpansionFormComponent>;

  const mockExpansion: ExpansionDetail = {
    id: 'exp-1',
    name: 'Seafarers',
    description: 'Sail the seas',
    year_published: 1997,
    is_active: true,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExpansionFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ExpansionFormComponent);
    component = fixture.componentInstance;
  });

  describe('create mode', () => {
    it('onSubmit_EmptyName_DoesNotEmit', () => {
      const savedSpy = vi.spyOn(component.saved, 'emit');
      component.open = true;
      component.expansion = null;
      fixture.detectChanges();

      component.onSubmit();

      expect(savedSpy).not.toHaveBeenCalled();
    });

    it('onSubmit_ValidName_EmitsPayload', () => {
      const savedSpy = vi.spyOn(component.saved, 'emit');
      component.open = true;
      component.expansion = null;
      fixture.detectChanges();

      component.form.patchValue({ name: 'Cities & Knights' });
      component.onSubmit();

      expect(savedSpy).toHaveBeenCalledWith({ name: 'Cities & Knights' });
    });

    it('onSubmit_AllFields_EmitsFullPayload', () => {
      const savedSpy = vi.spyOn(component.saved, 'emit');
      component.open = true;
      component.expansion = null;
      fixture.detectChanges();

      component.form.patchValue({
        name: 'Traders & Barbarians',
        description: 'Advanced trading',
        year_published: 2007,
      });
      component.onSubmit();

      expect(savedSpy).toHaveBeenCalledWith({
        name: 'Traders & Barbarians',
        description: 'Advanced trading',
        year_published: 2007,
      });
    });

    it('onSubmit_WhitespaceOnlyDescription_OmitsDescription', () => {
      const savedSpy = vi.spyOn(component.saved, 'emit');
      component.open = true;
      component.expansion = null;
      fixture.detectChanges();

      component.form.patchValue({ name: 'Test', description: '   ' });
      component.onSubmit();

      expect(savedSpy).toHaveBeenCalledWith({ name: 'Test' });
    });
  });

  describe('edit mode', () => {
    it('ngOnChanges_WithExpansion_PopulatesForm', () => {
      component.open = true;
      component.expansion = mockExpansion;
      component.ngOnChanges({
        open: { currentValue: true, previousValue: false, firstChange: true, isFirstChange: () => true },
        expansion: { currentValue: mockExpansion, previousValue: null, firstChange: true, isFirstChange: () => true },
      });

      expect(component.form.get('name')?.value).toBe('Seafarers');
      expect(component.form.get('description')?.value).toBe('Sail the seas');
      expect(component.form.get('year_published')?.value).toBe(1997);
    });
  });

  describe('cancel', () => {
    it('onCancel_EmitsCancelledEvent', () => {
      const cancelSpy = vi.spyOn(component.cancelled, 'emit');

      component.onCancel();

      expect(cancelSpy).toHaveBeenCalled();
    });
  });

  describe('hasError', () => {
    it('hasError_UntouchedField_ReturnsFalse', () => {
      expect(component.hasError('name')).toBe(false);
    });

    it('hasError_TouchedEmptyRequired_ReturnsTrue', () => {
      const nameControl = component.form.get('name');
      nameControl?.markAsTouched();

      expect(component.hasError('name')).toBe(true);
    });

    it('hasError_TouchedValidField_ReturnsFalse', () => {
      component.form.patchValue({ name: 'Valid Name' });
      component.form.get('name')?.markAsTouched();

      expect(component.hasError('name')).toBe(false);
    });
  });

  describe('form reset', () => {
    it('ngOnChanges_OpenWithoutExpansion_ResetsForm', () => {
      component.form.patchValue({ name: 'Old Value' });

      component.open = true;
      component.expansion = null;
      component.ngOnChanges({
        open: { currentValue: true, previousValue: false, firstChange: false, isFirstChange: () => false },
      });

      expect(component.form.get('name')?.value).toBe('');
    });
  });
});
