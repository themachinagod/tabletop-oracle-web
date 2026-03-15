import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComponentRef } from '@angular/core';
import { of, throwError } from 'rxjs';
import { AdminSettingsService } from '../../../core/services/admin-settings.service';
import { GuardrailConfig } from '../../../models/guardrail-config.model';
import { GuardrailConfigComponent } from './guardrail-config.component';

describe('GuardrailConfigComponent', () => {
  let component: GuardrailConfigComponent;
  let componentRef: ComponentRef<GuardrailConfigComponent>;
  let fixture: ComponentFixture<GuardrailConfigComponent>;
  let mockService: {
    updateGuardrailConfig: ReturnType<typeof vi.fn>;
  };

  const mockConfig: GuardrailConfig = {
    enforcement_enabled: true,
    max_tokens_per_query: 10000,
    max_model_calls_per_query: 5,
    max_queries_per_session: 50,
    daily_token_budget: 1000000,
    daily_query_budget: 500,
    per_document_ingestion_limit: 50000,
    updated_at: '2026-03-14T00:00:00Z',
  };

  beforeEach(async () => {
    mockService = {
      updateGuardrailConfig: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [GuardrailConfigComponent],
      providers: [{ provide: AdminSettingsService, useValue: mockService }],
    }).compileComponents();

    fixture = TestBed.createComponent(GuardrailConfigComponent);
    component = fixture.componentInstance;
    componentRef = fixture.componentRef;
    componentRef.setInput('config', mockConfig);
    fixture.detectChanges();
  });

  describe('display mode', () => {
    it('init_NotInEditMode', () => {
      expect(component.editing()).toBe(false);
    });
  });

  describe('edit mode', () => {
    it('startEditing_PopulatesFormWithConfigValues', () => {
      component.startEditing();

      expect(component.editing()).toBe(true);
      expect(component.form.get('enforcement_enabled')?.value).toBe(true);
      expect(component.form.get('max_tokens_per_query')?.value).toBe(10000);
      expect(component.form.get('daily_token_budget')?.value).toBe(1000000);
      expect(component.form.get('per_document_ingestion_limit')?.value).toBe(50000);
    });

    it('startEditing_SetsEnforcementSignal', () => {
      component.startEditing();

      expect(component.enforcementEnabled()).toBe(true);
    });

    it('cancelEditing_ExitsEditMode', () => {
      component.startEditing();
      component.cancelEditing();

      expect(component.editing()).toBe(false);
    });
  });

  describe('enforcement toggle', () => {
    it('onEnforcementChange_UpdatesSignal', () => {
      component.startEditing();
      component.form.patchValue({ enforcement_enabled: false });
      component.onEnforcementChange();

      expect(component.enforcementEnabled()).toBe(false);
    });
  });

  describe('validation', () => {
    it('save_NegativeLimit_DoesNotCallService', () => {
      component.startEditing();
      component.form.patchValue({ max_tokens_per_query: -1 });

      component.save();

      expect(mockService.updateGuardrailConfig).not.toHaveBeenCalled();
    });

    it('save_ZeroLimit_DoesNotCallService', () => {
      component.startEditing();
      component.form.patchValue({ daily_token_budget: 0 });

      component.save();

      expect(mockService.updateGuardrailConfig).not.toHaveBeenCalled();
    });

    it('hasError_InvalidTouchedField_ReturnsTrue', () => {
      component.startEditing();
      component.form.patchValue({ max_tokens_per_query: -5 });
      component.form.get('max_tokens_per_query')?.markAsTouched();

      expect(component.hasError('max_tokens_per_query')).toBe(true);
    });
  });

  describe('save flow', () => {
    it('save_ValidForm_CallsServiceAndEmitsUpdate', () => {
      const updatedConfig: GuardrailConfig = { ...mockConfig, enforcement_enabled: false };
      mockService.updateGuardrailConfig.mockReturnValue(of(updatedConfig));
      const emitSpy = vi.spyOn(component.configUpdated, 'emit');

      component.startEditing();
      component.form.patchValue({ enforcement_enabled: false });
      component.save();

      expect(mockService.updateGuardrailConfig).toHaveBeenCalledWith({
        enforcement_enabled: false,
        max_tokens_per_query: 10000,
        max_model_calls_per_query: 5,
        max_queries_per_session: 50,
        daily_token_budget: 1000000,
        daily_query_budget: 500,
        per_document_ingestion_limit: 50000,
      });
      expect(emitSpy).toHaveBeenCalledWith(updatedConfig);
      expect(component.editing()).toBe(false);
      expect(component.saving()).toBe(false);
    });

    it('save_ApiError_SetsErrorAndStopsSaving', () => {
      mockService.updateGuardrailConfig.mockReturnValue(
        throwError(() => ({ error: { message: 'Update failed' } })),
      );

      component.startEditing();
      component.save();

      expect(component.error()).toBe('Update failed');
      expect(component.saving()).toBe(false);
      expect(component.editing()).toBe(true);
    });

    it('save_GenericError_ShowsFallbackMessage', () => {
      mockService.updateGuardrailConfig.mockReturnValue(throwError(() => new Error('network')));

      component.startEditing();
      component.save();

      expect(component.error()).toBe('Failed to update guardrail configuration.');
    });

    it('save_NullLimits_SendsNullValues', () => {
      mockService.updateGuardrailConfig.mockReturnValue(of(mockConfig));

      component.startEditing();
      component.form.patchValue({
        max_tokens_per_query: null,
        daily_token_budget: null,
      });
      component.save();

      const updateArg = mockService.updateGuardrailConfig.mock.calls[0][0];
      expect(updateArg.max_tokens_per_query).toBeNull();
      expect(updateArg.daily_token_budget).toBeNull();
    });
  });
});
