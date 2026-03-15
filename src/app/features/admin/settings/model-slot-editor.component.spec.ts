import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComponentRef } from '@angular/core';
import { of, throwError } from 'rxjs';
import { AdminSettingsService } from '../../../core/services/admin-settings.service';
import { ModelSlot } from '../../../models/model-slot.model';
import { ModelSlotEditorComponent } from './model-slot-editor.component';

describe('ModelSlotEditorComponent', () => {
  let component: ModelSlotEditorComponent;
  let componentRef: ComponentRef<ModelSlotEditorComponent>;
  let fixture: ComponentFixture<ModelSlotEditorComponent>;
  let mockService: {
    updateModelSlot: ReturnType<typeof vi.fn>;
  };

  const mockSlot: ModelSlot = {
    capability: 'intent_analysis',
    provider: 'openai',
    model_id: 'gpt-4o',
    temperature: 0.7,
    max_tokens_per_call: 4096,
    fallback_provider: 'anthropic',
    fallback_model_id: 'claude-3-sonnet',
    updated_at: '2026-03-14T00:00:00Z',
  };

  beforeEach(async () => {
    mockService = {
      updateModelSlot: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ModelSlotEditorComponent],
      providers: [{ provide: AdminSettingsService, useValue: mockService }],
    }).compileComponents();

    fixture = TestBed.createComponent(ModelSlotEditorComponent);
    component = fixture.componentInstance;
    componentRef = fixture.componentRef;
    componentRef.setInput('slot', mockSlot);
    fixture.detectChanges();
  });

  describe('display mode', () => {
    it('init_DisplaysCapabilityLabel', () => {
      expect(component.capabilityLabel()).toBe('Intent Analysis');
    });

    it('init_NotInEditMode', () => {
      expect(component.editing()).toBe(false);
    });
  });

  describe('edit mode', () => {
    it('startEditing_PopulatesFormWithSlotValues', () => {
      component.startEditing();

      expect(component.editing()).toBe(true);
      expect(component.form.get('provider')?.value).toBe('openai');
      expect(component.form.get('model_id')?.value).toBe('gpt-4o');
      expect(component.form.get('temperature')?.value).toBe(0.7);
      expect(component.form.get('max_tokens_per_call')?.value).toBe(4096);
      expect(component.form.get('fallback_provider')?.value).toBe('anthropic');
      expect(component.form.get('fallback_model_id')?.value).toBe('claude-3-sonnet');
    });

    it('cancelEditing_ExitsEditMode', () => {
      component.startEditing();
      component.cancelEditing();

      expect(component.editing()).toBe(false);
    });

    it('startEditing_ClearsError', () => {
      component.error.set('some error');
      component.startEditing();

      expect(component.error()).toBeNull();
    });
  });

  describe('validation', () => {
    it('save_EmptyProvider_MarksFormTouched', () => {
      component.startEditing();
      component.form.patchValue({ provider: '', model_id: 'gpt-4o' });

      component.save();

      expect(component.form.get('provider')?.touched).toBe(true);
      expect(mockService.updateModelSlot).not.toHaveBeenCalled();
    });

    it('save_EmptyModelId_DoesNotCallService', () => {
      component.startEditing();
      component.form.patchValue({ provider: 'openai', model_id: '' });

      component.save();

      expect(mockService.updateModelSlot).not.toHaveBeenCalled();
    });

    it('save_TemperatureAboveMax_DoesNotCallService', () => {
      component.startEditing();
      component.form.patchValue({ provider: 'openai', model_id: 'gpt-4o', temperature: 3 });

      component.save();

      expect(mockService.updateModelSlot).not.toHaveBeenCalled();
    });

    it('hasError_InvalidTouchedField_ReturnsTrue', () => {
      component.startEditing();
      component.form.patchValue({ provider: '' });
      component.form.get('provider')?.markAsTouched();

      expect(component.hasError('provider')).toBe(true);
    });

    it('hasError_ValidField_ReturnsFalse', () => {
      component.startEditing();
      component.form.patchValue({ provider: 'openai' });

      expect(component.hasError('provider')).toBe(false);
    });
  });

  describe('save flow', () => {
    it('save_ValidForm_CallsServiceAndEmitsUpdate', () => {
      const updatedSlot: ModelSlot = { ...mockSlot, provider: 'anthropic' };
      mockService.updateModelSlot.mockReturnValue(of(updatedSlot));
      const emitSpy = vi.spyOn(component.slotUpdated, 'emit');

      component.startEditing();
      component.form.patchValue({ provider: 'anthropic', model_id: 'claude-3' });
      component.save();

      expect(mockService.updateModelSlot).toHaveBeenCalledWith('intent_analysis', {
        provider: 'anthropic',
        model_id: 'claude-3',
        temperature: 0.7,
        max_tokens_per_call: 4096,
        fallback_provider: 'anthropic',
        fallback_model_id: 'claude-3-sonnet',
      });
      expect(emitSpy).toHaveBeenCalledWith(updatedSlot);
      expect(component.editing()).toBe(false);
      expect(component.saving()).toBe(false);
    });

    it('save_SetsAndResetsSaving', () => {
      mockService.updateModelSlot.mockReturnValue(of(mockSlot));

      component.startEditing();
      component.save();

      expect(component.saving()).toBe(false);
    });

    it('save_ApiError_SetsErrorAndStopsSaving', () => {
      mockService.updateModelSlot.mockReturnValue(
        throwError(() => ({ error: { message: 'Validation failed' } })),
      );

      component.startEditing();
      component.save();

      expect(component.error()).toBe('Validation failed');
      expect(component.saving()).toBe(false);
      expect(component.editing()).toBe(true);
    });

    it('save_GenericError_ShowsFallbackMessage', () => {
      mockService.updateModelSlot.mockReturnValue(throwError(() => new Error('network')));

      component.startEditing();
      component.save();

      expect(component.error()).toBe('Failed to update model slot.');
    });

    it('save_EmptyFallbackFields_SendsNull', () => {
      mockService.updateModelSlot.mockReturnValue(of(mockSlot));

      component.startEditing();
      component.form.patchValue({ fallback_provider: '', fallback_model_id: '  ' });
      component.save();

      const updateArg = mockService.updateModelSlot.mock.calls[0][1];
      expect(updateArg.fallback_provider).toBeNull();
      expect(updateArg.fallback_model_id).toBeNull();
    });
  });
});
