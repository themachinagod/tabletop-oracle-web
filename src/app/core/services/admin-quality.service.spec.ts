import { HttpParams } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, throwError } from 'rxjs';
import { GameQualityMetrics } from '../../models/quality-metrics.model';
import { ApiService } from '../api/api.service';
import { AdminQualityService } from './admin-quality.service';

describe('AdminQualityService', () => {
  let service: AdminQualityService;
  let mockApi: { get: ReturnType<typeof vi.fn> };

  const start = '2026-02-14';
  const end = '2026-03-14';

  const mockMetrics: GameQualityMetrics[] = [
    {
      game_id: 'uuid-1',
      game_name: 'Eclipse: Second Dawn',
      total_answers: 500,
      low_confidence_rate: 0.08,
      clarification_rate: 0.12,
      avg_citations_per_answer: 2.4,
      feedback_positive_count: 180,
      feedback_negative_count: 22,
      confidence_distribution: {
        '0_to_25': 15,
        '25_to_50': 25,
        '50_to_75': 160,
        '75_to_100': 300,
      },
      avg_queries_per_session: 8.3,
    },
  ];

  beforeEach(() => {
    mockApi = { get: vi.fn() };

    TestBed.configureTestingModule({
      providers: [AdminQualityService, { provide: ApiService, useValue: mockApi }],
    });

    service = TestBed.inject(AdminQualityService);
  });

  describe('getMetrics', () => {
    it('getMetrics_ValidPeriod_CallsCorrectEndpointWithParams', async () => {
      mockApi.get.mockReturnValue(of(mockMetrics));

      const result = await firstValueFrom(service.getMetrics(start, end));

      expect(result).toEqual(mockMetrics);
      expect(mockApi.get).toHaveBeenCalledWith('/admin/quality/metrics', expect.any(HttpParams));
      const params: HttpParams = mockApi.get.mock.calls[0][1];
      expect(params.get('period_start')).toBe(start);
      expect(params.get('period_end')).toBe(end);
    });

    it('getMetrics_ApiError_PropagatesError', async () => {
      mockApi.get.mockReturnValue(throwError(() => new Error('Server error')));

      await expect(firstValueFrom(service.getMetrics(start, end))).rejects.toThrow('Server error');
    });
  });
});
