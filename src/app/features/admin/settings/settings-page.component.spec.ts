import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AdminSettingsService } from '../../../core/services/admin-settings.service';
import { GuardrailConfig } from '../../../models/guardrail-config.model';
import { ModelSlot } from '../../../models/model-slot.model';
import { SettingsPageComponent } from './settings-page.component';

describe('SettingsPageComponent', () => {
  let component: SettingsPageComponent;
  let fixture: ComponentFixture<SettingsPageComponent>;
  let mockService: {
    listModelSlots: ReturnType<typeof vi.fn>;
    getGuardrailConfig: ReturnType<typeof vi.fn>;
  };

  const mockSlot: ModelSlot = {
    capability: 'intent_analysis',
    provider: 'openai',
    model_id: 'gpt-4o',
    temperature: 0.7,
    max_tokens_per_call: 4096,
    fallback_provider: null,
    fallback_model_id: null,
    updated_at: '2026-03-14T00:00:00Z',
  };

  const mockSlots: ModelSlot[] = [mockSlot, { ...mockSlot, capability: 'answer_synthesis' }];

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
      listModelSlots: vi.fn().mockReturnValue(of(mockSlots)),
      getGuardrailConfig: vi.fn().mockReturnValue(of(mockConfig)),
    };

    await TestBed.configureTestingModule({
      imports: [SettingsPageComponent],
      providers: [{ provide: AdminSettingsService, useValue: mockService }],
    }).compileComponents();

    fixture = TestBed.createComponent(SettingsPageComponent);
    component = fixture.componentInstance;
  });

  describe('initialization', () => {
    it('ngOnInit_Success_LoadsModelSlotsAndGuardrailConfig', () => {
      fixture.detectChanges();

      expect(component.modelSlots()).toEqual(mockSlots);
      expect(component.guardrailConfig()).toEqual(mockConfig);
      expect(component.slotsError()).toBeNull();
      expect(component.guardrailError()).toBeNull();
    });

    it('ngOnInit_SlotsFail_SetsErrorAndLeavesNull', () => {
      mockService.listModelSlots.mockReturnValue(
        throwError(() => ({ error: { message: 'Server error' } })),
      );

      fixture.detectChanges();

      expect(component.modelSlots()).toBeNull();
      expect(component.slotsError()).toBe('Server error');
      expect(component.guardrailConfig()).toEqual(mockConfig);
    });

    it('ngOnInit_GuardrailFails_SetsErrorAndLeavesNull', () => {
      mockService.getGuardrailConfig.mockReturnValue(
        throwError(() => ({ error: { message: 'Config error' } })),
      );

      fixture.detectChanges();

      expect(component.guardrailConfig()).toBeNull();
      expect(component.guardrailError()).toBe('Config error');
      expect(component.modelSlots()).toEqual(mockSlots);
    });

    it('ngOnInit_GenericError_ShowsFallbackMessage', () => {
      mockService.listModelSlots.mockReturnValue(throwError(() => new Error('network')));

      fixture.detectChanges();

      expect(component.slotsError()).toBe('Failed to load model slots.');
    });
  });

  describe('slot updates', () => {
    it('onSlotUpdated_UpdatesMatchingSlot', () => {
      fixture.detectChanges();
      const updated: ModelSlot = { ...mockSlot, provider: 'anthropic', model_id: 'claude-3' };

      component.onSlotUpdated(updated);

      const slots = component.modelSlots();
      expect(slots?.[0].provider).toBe('anthropic');
      expect(slots?.[0].model_id).toBe('claude-3');
      expect(slots?.[1].provider).toBe('openai');
    });
  });

  describe('config updates', () => {
    it('onConfigUpdated_ReplacesConfig', () => {
      fixture.detectChanges();
      const updated: GuardrailConfig = { ...mockConfig, enforcement_enabled: false };

      component.onConfigUpdated(updated);

      expect(component.guardrailConfig()?.enforcement_enabled).toBe(false);
    });
  });

  describe('retry', () => {
    it('retryLoadSlots_ClearsErrorAndReloads', () => {
      mockService.listModelSlots.mockReturnValue(
        throwError(() => ({ error: { message: 'fail' } })),
      );
      fixture.detectChanges();
      expect(component.slotsError()).toBe('fail');

      mockService.listModelSlots.mockReturnValue(of(mockSlots));
      component.retryLoadSlots();

      expect(component.slotsError()).toBeNull();
      expect(component.modelSlots()).toEqual(mockSlots);
    });

    it('retryLoadGuardrail_ClearsErrorAndReloads', () => {
      mockService.getGuardrailConfig.mockReturnValue(
        throwError(() => ({ error: { message: 'fail' } })),
      );
      fixture.detectChanges();
      expect(component.guardrailError()).toBe('fail');

      mockService.getGuardrailConfig.mockReturnValue(of(mockConfig));
      component.retryLoadGuardrail();

      expect(component.guardrailError()).toBeNull();
      expect(component.guardrailConfig()).toEqual(mockConfig);
    });
  });
});
