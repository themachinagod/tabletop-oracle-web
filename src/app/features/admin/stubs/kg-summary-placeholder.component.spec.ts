import { ComponentFixture, TestBed } from '@angular/core/testing';
import { KgSummaryPlaceholderComponent } from './kg-summary-placeholder.component';

describe('KgSummaryPlaceholderComponent', () => {
  let fixture: ComponentFixture<KgSummaryPlaceholderComponent>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KgSummaryPlaceholderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(KgSummaryPlaceholderComponent);
    fixture.detectChanges();
    element = fixture.nativeElement;
  });

  it('renders_Component_ShowsTitle', () => {
    const title = element.querySelector('.stub-page__title');
    expect(title?.textContent?.trim()).toBe('Knowledge Graph');
  });

  it('renders_Component_ShowsComingSoonMessage', () => {
    const message = element.querySelector('.empty-state__message');
    expect(message?.textContent).toContain('Knowledge Graph summary is coming soon');
  });

  it('renders_Component_ShowsEmptyStateIcon', () => {
    const icon = element.querySelector('.empty-state__icon');
    expect(icon).toBeTruthy();
  });
});
