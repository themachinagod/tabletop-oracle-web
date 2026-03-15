import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, throwError } from 'rxjs';
import { GuardrailConfig, GuardrailConfigUpdate } from '../../models/guardrail-config.model';
import { ModelSlot, ModelSlotUpdate } from '../../models/model-slot.model';
import { ApiService } from '../api/api.service';
import { AdminSettingsService } from './admin-settings.service';

describe('AdminSettingsService', () => {
  let service: AdminSettingsService;
  let mockApi: {
    get: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
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

  const mockSlots: ModelSlot[] = [
    mockSlot,
    {
      ...mockSlot,
      capability: 'answer_synthesis',
      provider: 'anthropic',
      model_id: 'claude-3-opus',
    },
  ];

  const mockGuardrailConfig: GuardrailConfig = {
    enforcement_enabled: true,
    max_tokens_per_query: 10000,
    max_model_calls_per_query: 5,
    max_queries_per_session: 50,
    daily_token_budget: 1000000,
    daily_query_budget: 500,
    per_document_ingestion_limit: 50000,
    updated_at: '2026-03-14T00:00:00Z',
  };

  beforeEach(() => {
    mockApi = {
      get: vi.fn(),
      put: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [AdminSettingsService, { provide: ApiService, useValue: mockApi }],
    });

    service = TestBed.inject(AdminSettingsService);
  });

  describe('listModelSlots', () => {
    it('listModelSlots_Success_CallsCorrectEndpoint', async () => {
      mockApi.get.mockReturnValue(of(mockSlots));

      const result = await firstValueFrom(service.listModelSlots());

      expect(result).toEqual(mockSlots);
      expect(mockApi.get).toHaveBeenCalledWith('/admin/model-slots');
    });

    it('listModelSlots_ApiError_PropagatesError', async () => {
      mockApi.get.mockReturnValue(throwError(() => new Error('Network error')));

      await expect(firstValueFrom(service.listModelSlots())).rejects.toThrow('Network error');
    });
  });

  describe('updateModelSlot', () => {
    it('updateModelSlot_ValidPayload_PutsToCorrectEndpoint', async () => {
      const update: ModelSlotUpdate = { provider: 'anthropic', model_id: 'claude-3-opus' };
      mockApi.put.mockReturnValue(of(mockSlot));

      const result = await firstValueFrom(service.updateModelSlot('intent_analysis', update));

      expect(result).toEqual(mockSlot);
      expect(mockApi.put).toHaveBeenCalledWith('/admin/model-slots/intent_analysis', update);
    });

    it('updateModelSlot_ApiError_PropagatesError', async () => {
      mockApi.put.mockReturnValue(throwError(() => new Error('Validation error')));

      await expect(
        firstValueFrom(service.updateModelSlot('intent_analysis', { provider: '' })),
      ).rejects.toThrow('Validation error');
    });
  });

  describe('getGuardrailConfig', () => {
    it('getGuardrailConfig_Success_CallsCorrectEndpoint', async () => {
      mockApi.get.mockReturnValue(of(mockGuardrailConfig));

      const result = await firstValueFrom(service.getGuardrailConfig());

      expect(result).toEqual(mockGuardrailConfig);
      expect(mockApi.get).toHaveBeenCalledWith('/admin/guardrail-config');
    });

    it('getGuardrailConfig_ApiError_PropagatesError', async () => {
      mockApi.get.mockReturnValue(throwError(() => new Error('Not found')));

      await expect(firstValueFrom(service.getGuardrailConfig())).rejects.toThrow('Not found');
    });
  });

  describe('updateGuardrailConfig', () => {
    it('updateGuardrailConfig_ValidPayload_PutsToCorrectEndpoint', async () => {
      const update: GuardrailConfigUpdate = { enforcement_enabled: false };
      mockApi.put.mockReturnValue(of(mockGuardrailConfig));

      const result = await firstValueFrom(service.updateGuardrailConfig(update));

      expect(result).toEqual(mockGuardrailConfig);
      expect(mockApi.put).toHaveBeenCalledWith('/admin/guardrail-config', update);
    });

    it('updateGuardrailConfig_ApiError_PropagatesError', async () => {
      mockApi.put.mockReturnValue(throwError(() => new Error('Server error')));

      await expect(
        firstValueFrom(service.updateGuardrailConfig({ enforcement_enabled: true })),
      ).rejects.toThrow('Server error');
    });
  });
});
