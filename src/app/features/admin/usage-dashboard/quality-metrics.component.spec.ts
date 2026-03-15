import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GameQualityMetrics } from '../../../models/quality-metrics.model';
import { QualityMetricsComponent } from './quality-metrics.component';

describe('QualityMetricsComponent', () => {
  let component: QualityMetricsComponent;
  let fixture: ComponentFixture<QualityMetricsComponent>;

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
    {
      game_id: 'uuid-2',
      game_name: 'Azul',
      total_answers: 200,
      low_confidence_rate: 0.3,
      clarification_rate: 0.35,
      avg_citations_per_answer: 1.2,
      feedback_positive_count: 50,
      feedback_negative_count: 40,
      confidence_distribution: { '0_to_25': 30, '25_to_50': 30, '50_to_75': 80, '75_to_100': 60 },
      avg_queries_per_session: 3.1,
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QualityMetricsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(QualityMetricsComponent);
    component = fixture.componentInstance;
  });

  it('sortedData_MultipleGames_SortsByNameAscending', () => {
    fixture.componentRef.setInput('data', mockMetrics);
    fixture.detectChanges();

    const sorted = component.sortedData();
    expect(sorted[0].game_name).toBe('Azul');
    expect(sorted[1].game_name).toBe('Eclipse');
  });

  it('lowConfLevel_Below10Percent_ReturnsGreen', () => {
    expect(component.lowConfLevel(0.05)).toBe('green');
  });

  it('lowConfLevel_Between10And25Percent_ReturnsAmber', () => {
    expect(component.lowConfLevel(0.15)).toBe('amber');
  });

  it('lowConfLevel_Above25Percent_ReturnsRed', () => {
    expect(component.lowConfLevel(0.3)).toBe('red');
  });

  it('clarLevel_Below15Percent_ReturnsGreen', () => {
    expect(component.clarLevel(0.1)).toBe('green');
  });

  it('clarLevel_Between15And30Percent_ReturnsAmber', () => {
    expect(component.clarLevel(0.2)).toBe('amber');
  });

  it('clarLevel_Above30Percent_ReturnsRed', () => {
    expect(component.clarLevel(0.35)).toBe('red');
  });

  it('render_EmptyData_ShowsEmptyState', () => {
    fixture.componentRef.setInput('data', []);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('app-empty-state')).toBeTruthy();
    expect(el.querySelector('.quality__table')).toBeNull();
  });

  it('render_WithData_ShowsTable', () => {
    fixture.componentRef.setInput('data', mockMetrics);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.quality__table')).toBeTruthy();
    const rows = el.querySelectorAll('.quality__table tbody tr');
    expect(rows.length).toBe(2);
  });

  it('distSegments_ValidDistribution_ReturnsFourSegments', () => {
    const segments = component.distSegments(mockMetrics[0].confidence_distribution);
    expect(segments.length).toBe(4);
    expect(segments[0].level).toBe('red');
    expect(segments[3].level).toBe('green');
  });
});
