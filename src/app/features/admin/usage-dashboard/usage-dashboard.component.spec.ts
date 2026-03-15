import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AdminUsageService } from '../../../core/services/admin-usage.service';
import { AdminQualityService } from '../../../core/services/admin-quality.service';
import { AdminSettingsService } from '../../../core/services/admin-settings.service';
import {
  UsageSummary,
  DailyUsage,
  CapabilityUsage,
  GameUsage,
  UserUsage,
  GuardrailStatus,
} from '../../../models/usage.model';
import { GameQualityMetrics } from '../../../models/quality-metrics.model';
import { ModelSlot } from '../../../models/model-slot.model';
import { UsageDashboardComponent } from './usage-dashboard.component';

describe('UsageDashboardComponent', () => {
  let component: UsageDashboardComponent;
  let fixture: ComponentFixture<UsageDashboardComponent>;

  let mockUsageService: {
    getSummary: ReturnType<typeof vi.fn>;
    getTrends: ReturnType<typeof vi.fn>;
    getByCapability: ReturnType<typeof vi.fn>;
    getByGame: ReturnType<typeof vi.fn>;
    getByUser: ReturnType<typeof vi.fn>;
    getGuardrailStatus: ReturnType<typeof vi.fn>;
  };

  let mockQualityService: {
    getMetrics: ReturnType<typeof vi.fn>;
  };

  let mockSettingsService: {
    listModelSlots: ReturnType<typeof vi.fn>;
  };

  const mockSummary: UsageSummary = {
    total_tokens: 1234567,
    input_tokens: 890000,
    output_tokens: 344567,
    total_queries: 2500,
    total_documents_processed: 45,
    period_start: '2026-02-14',
    period_end: '2026-03-14',
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
    { user_id: 'uuid-2', display_name: 'Jane', total_tokens: 125000, query_count: 340 },
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

  const mockMetrics: GameQualityMetrics[] = [
    {
      game_id: 'uuid-1',
      game_name: 'Eclipse',
      total_answers: 500,
      low_confidence_rate: 0.08,
      clarification_rate: 0.12,
      avg_citations_per_answer: 2.4,
      feedback_positive_count: 180,
      feedback_negative_count: 22,
      confidence_distribution: { '0_to_25': 15, '25_to_50': 25, '50_to_75': 160, '75_to_100': 300 },
      avg_queries_per_session: 8.3,
    },
  ];

  const mockSlots: ModelSlot[] = [
    {
      capability: 'intent_analysis',
      provider: 'openai',
      model_id: 'gpt-4o',
      temperature: 0.7,
      max_tokens_per_call: 4096,
      fallback_provider: null,
      fallback_model_id: null,
      updated_at: '2026-03-14T00:00:00Z',
    },
  ];

  function setupMocks(): void {
    mockUsageService.getSummary.mockReturnValue(of(mockSummary));
    mockUsageService.getTrends.mockReturnValue(of(mockTrends));
    mockUsageService.getByCapability.mockReturnValue(of(mockCapabilities));
    mockUsageService.getByGame.mockReturnValue(of(mockGames));
    mockUsageService.getByUser.mockReturnValue(of(mockUsers));
    mockUsageService.getGuardrailStatus.mockReturnValue(of(mockGuardrailStatus));
    mockQualityService.getMetrics.mockReturnValue(of(mockMetrics));
    mockSettingsService.listModelSlots.mockReturnValue(of(mockSlots));
  }

  beforeEach(async () => {
    mockUsageService = {
      getSummary: vi.fn(),
      getTrends: vi.fn(),
      getByCapability: vi.fn(),
      getByGame: vi.fn(),
      getByUser: vi.fn(),
      getGuardrailStatus: vi.fn(),
    };

    mockQualityService = { getMetrics: vi.fn() };
    mockSettingsService = { listModelSlots: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [UsageDashboardComponent],
      providers: [
        provideRouter([]),
        { provide: AdminUsageService, useValue: mockUsageService },
        { provide: AdminQualityService, useValue: mockQualityService },
        { provide: AdminSettingsService, useValue: mockSettingsService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UsageDashboardComponent);
    component = fixture.componentInstance;
  });

  describe('initialization', () => {
    it('ngOnInit_Success_LoadsAllDashboardData', () => {
      setupMocks();

      fixture.detectChanges();

      expect(component.summary()).toEqual(mockSummary);
      expect(component.trends()).toEqual(mockTrends);
      expect(component.byCapability()).toEqual(mockCapabilities);
      expect(component.byGame()).toEqual(mockGames);
      expect(component.byUser()).toEqual(mockUsers);
      expect(component.guardrailStatus()).toEqual(mockGuardrailStatus);
      expect(component.qualityMetrics()).toEqual(mockMetrics);
      expect(component.modelSlots()).toEqual(mockSlots);
      expect(component.loading()).toBe(false);
      expect(component.error()).toBeNull();
    });

    it('ngOnInit_Default_SelectedPeriodIs30d', () => {
      setupMocks();

      fixture.detectChanges();

      expect(component.selectedPeriod()).toBe('30d');
    });

    it('ngOnInit_ApiError_SetsErrorAndStopsLoading', () => {
      setupMocks();
      mockUsageService.getSummary.mockReturnValue(
        throwError(() => ({ error: { message: 'Server error' } })),
      );

      fixture.detectChanges();

      expect(component.error()).toBe('Server error');
      expect(component.loading()).toBe(false);
    });

    it('ngOnInit_GenericError_ShowsFallbackMessage', () => {
      setupMocks();
      mockUsageService.getSummary.mockReturnValue(throwError(() => new Error('network')));

      fixture.detectChanges();

      expect(component.error()).toBe('Failed to load dashboard data.');
    });
  });

  describe('period changes', () => {
    it('onPeriodChange_NewPeriod_ReloadsDataWithNewRange', () => {
      setupMocks();
      fixture.detectChanges();

      expect(mockUsageService.getSummary).toHaveBeenCalledTimes(1);

      component.onPeriodChange('7d');

      expect(component.selectedPeriod()).toBe('7d');
      expect(mockUsageService.getSummary).toHaveBeenCalledTimes(2);
    });

    it('onPeriodChange_7d_PassesPeriodParams', () => {
      setupMocks();
      fixture.detectChanges();
      mockUsageService.getSummary.mockClear();

      component.onPeriodChange('7d');

      const [start, end] = mockUsageService.getSummary.mock.calls[0];
      const startDate = new Date(start);
      const endDate = new Date(end);
      const diffDays = Math.round(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      expect(diffDays).toBe(7);
    });
  });

  describe('retry', () => {
    it('retry_AfterError_ReloadsData', () => {
      setupMocks();
      mockUsageService.getSummary.mockReturnValue(
        throwError(() => ({ error: { message: 'fail' } })),
      );
      fixture.detectChanges();
      expect(component.error()).toBe('fail');

      setupMocks();
      component.retry();

      expect(component.error()).toBeNull();
      expect(component.summary()).toEqual(mockSummary);
    });
  });

  describe('periodLabel', () => {
    it('periodLabel_30d_ReturnsLast30Days', () => {
      setupMocks();
      fixture.detectChanges();

      expect(component.periodLabel()).toBe('Last 30 days');
    });

    it('periodLabel_7d_ReturnsLast7Days', () => {
      setupMocks();
      fixture.detectChanges();

      component.onPeriodChange('7d');

      expect(component.periodLabel()).toBe('Last 7 days');
    });
  });
});
