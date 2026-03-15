import { HttpParams } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, throwError } from 'rxjs';
import {
  CapabilityUsage,
  DailyUsage,
  GameUsage,
  GuardrailStatus,
  UsageSummary,
  UserUsage,
} from '../../models/usage.model';
import { ApiService } from '../api/api.service';
import { AdminUsageService } from './admin-usage.service';

describe('AdminUsageService', () => {
  let service: AdminUsageService;
  let mockApi: { get: ReturnType<typeof vi.fn> };

  const start = '2026-02-14';
  const end = '2026-03-14';

  const mockSummary: UsageSummary = {
    total_tokens: 1234567,
    input_tokens: 890000,
    output_tokens: 344567,
    total_queries: 2500,
    total_documents_processed: 45,
    period_start: start,
    period_end: end,
  };

  const mockTrends: DailyUsage[] = [
    {
      date: '2026-03-01',
      total_tokens: 45000,
      input_tokens: 30000,
      output_tokens: 15000,
      query_count: 120,
      document_count: 3,
    },
  ];

  const mockCapabilities: CapabilityUsage[] = [
    {
      capability: 'answer_synthesis',
      total_tokens: 500000,
      input_tokens: 350000,
      output_tokens: 150000,
      call_count: 2500,
    },
  ];

  const mockGames: GameUsage[] = [
    {
      game_id: 'uuid-1',
      game_name: 'Eclipse',
      query_tokens: 300000,
      ingestion_tokens: 150000,
      query_count: 800,
    },
  ];

  const mockUsers: UserUsage[] = [
    {
      user_id: 'uuid-2',
      display_name: 'Jane Smith',
      total_tokens: 125000,
      query_count: 340,
    },
  ];

  const mockGuardrailStatus: GuardrailStatus = {
    enforcement_enabled: true,
    guardrails: [
      {
        name: 'daily_token_budget',
        label: 'Daily Token Budget',
        current: 456000,
        limit: 1000000,
        status: 'green',
      },
    ],
  };

  beforeEach(() => {
    mockApi = { get: vi.fn() };

    TestBed.configureTestingModule({
      providers: [AdminUsageService, { provide: ApiService, useValue: mockApi }],
    });

    service = TestBed.inject(AdminUsageService);
  });

  describe('getSummary', () => {
    it('getSummary_ValidPeriod_CallsCorrectEndpointWithParams', async () => {
      mockApi.get.mockReturnValue(of(mockSummary));

      const result = await firstValueFrom(service.getSummary(start, end));

      expect(result).toEqual(mockSummary);
      expect(mockApi.get).toHaveBeenCalledWith('/admin/usage/summary', expect.any(HttpParams));
      const params: HttpParams = mockApi.get.mock.calls[0][1];
      expect(params.get('period_start')).toBe(start);
      expect(params.get('period_end')).toBe(end);
    });

    it('getSummary_ApiError_PropagatesError', async () => {
      mockApi.get.mockReturnValue(throwError(() => new Error('Network error')));

      await expect(firstValueFrom(service.getSummary(start, end))).rejects.toThrow('Network error');
    });
  });

  describe('getTrends', () => {
    it('getTrends_ValidPeriod_CallsCorrectEndpointWithParams', async () => {
      mockApi.get.mockReturnValue(of(mockTrends));

      const result = await firstValueFrom(service.getTrends(start, end));

      expect(result).toEqual(mockTrends);
      expect(mockApi.get).toHaveBeenCalledWith('/admin/usage/trends', expect.any(HttpParams));
    });
  });

  describe('getByCapability', () => {
    it('getByCapability_ValidPeriod_CallsCorrectEndpointWithParams', async () => {
      mockApi.get.mockReturnValue(of(mockCapabilities));

      const result = await firstValueFrom(service.getByCapability(start, end));

      expect(result).toEqual(mockCapabilities);
      expect(mockApi.get).toHaveBeenCalledWith(
        '/admin/usage/by-capability',
        expect.any(HttpParams),
      );
    });
  });

  describe('getByGame', () => {
    it('getByGame_ValidPeriod_CallsCorrectEndpointWithParams', async () => {
      mockApi.get.mockReturnValue(of(mockGames));

      const result = await firstValueFrom(service.getByGame(start, end));

      expect(result).toEqual(mockGames);
      expect(mockApi.get).toHaveBeenCalledWith('/admin/usage/by-game', expect.any(HttpParams));
    });
  });

  describe('getByUser', () => {
    it('getByUser_ValidPeriod_CallsCorrectEndpointWithParams', async () => {
      mockApi.get.mockReturnValue(of(mockUsers));

      const result = await firstValueFrom(service.getByUser(start, end));

      expect(result).toEqual(mockUsers);
      expect(mockApi.get).toHaveBeenCalledWith('/admin/usage/by-user', expect.any(HttpParams));
    });
  });

  describe('getGuardrailStatus', () => {
    it('getGuardrailStatus_Success_CallsEndpointWithNoParams', async () => {
      mockApi.get.mockReturnValue(of(mockGuardrailStatus));

      const result = await firstValueFrom(service.getGuardrailStatus());

      expect(result).toEqual(mockGuardrailStatus);
      expect(mockApi.get).toHaveBeenCalledWith('/admin/usage/guardrail-status');
    });

    it('getGuardrailStatus_ApiError_PropagatesError', async () => {
      mockApi.get.mockReturnValue(throwError(() => new Error('Forbidden')));

      await expect(firstValueFrom(service.getGuardrailStatus())).rejects.toThrow('Forbidden');
    });
  });
});
