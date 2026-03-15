import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UsageSummary } from '../../../models/usage.model';
import { UsageSummaryCardsComponent } from './usage-summary-cards.component';

describe('UsageSummaryCardsComponent', () => {
  let component: UsageSummaryCardsComponent;
  let fixture: ComponentFixture<UsageSummaryCardsComponent>;

  const mockSummary: UsageSummary = {
    total_tokens: 1234567,
    input_tokens: 890000,
    output_tokens: 344567,
    total_queries: 2500,
    total_documents_processed: 45,
    period_start: '2026-02-14',
    period_end: '2026-03-14',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UsageSummaryCardsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(UsageSummaryCardsComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('summary', mockSummary);
    fixture.componentRef.setInput('periodLabel', 'Last 30 days');
  });

  it('formattedTokens_MillionRange_FormatsAsM', () => {
    fixture.detectChanges();

    expect(component.formattedTokens()).toBe('1.2M');
  });

  it('formattedTokens_ThousandRange_FormatsAsK', () => {
    fixture.componentRef.setInput('summary', { ...mockSummary, total_tokens: 45300 });
    fixture.detectChanges();

    expect(component.formattedTokens()).toBe('45.3K');
  });

  it('formattedTokens_SmallNumber_FormatsAsIs', () => {
    fixture.componentRef.setInput('summary', { ...mockSummary, total_tokens: 999 });
    fixture.detectChanges();

    expect(component.formattedTokens()).toBe('999');
  });

  it('avgTokensPerQuery_NonZeroQueries_CalculatesAverage', () => {
    fixture.detectChanges();

    expect(component.avgTokensPerQuery()).toBeCloseTo(1234567 / 2500, 1);
  });

  it('avgTokensPerQuery_ZeroQueries_ReturnsZero', () => {
    fixture.componentRef.setInput('summary', { ...mockSummary, total_queries: 0 });
    fixture.detectChanges();

    expect(component.avgTokensPerQuery()).toBe(0);
  });

  it('render_Success_DisplaysAllCards', () => {
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const cards = el.querySelectorAll('.summary-cards__card');
    expect(cards.length).toBe(4);
  });
});
