import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GuardrailStatus } from '../../../models/usage.model';
import { GuardrailStatusComponent } from './guardrail-status.component';

describe('GuardrailStatusComponent', () => {
  let component: GuardrailStatusComponent;
  let fixture: ComponentFixture<GuardrailStatusComponent>;

  const mockStatus: GuardrailStatus = {
    enforcement_enabled: true,
    guardrails: [
      {
        name: 'daily_token_budget',
        label: 'Daily Token Budget',
        current: 456000,
        limit: 1000000,
        status: 'green',
      },
      {
        name: 'daily_query_budget',
        label: 'Daily Query Budget',
        current: 4500,
        limit: 5000,
        status: 'red',
      },
    ],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GuardrailStatusComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GuardrailStatusComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('status', mockStatus);
  });

  it('barWidth_GreenStatus_ReturnsCorrectPercentage', () => {
    fixture.detectChanges();
    const width = component.barWidth(mockStatus.guardrails[0]);
    expect(width).toBeCloseTo(45.6, 0);
  });

  it('barWidth_DisabledStatus_ReturnsZero', () => {
    const result = component.barWidth({
      name: 'test',
      label: 'Test',
      current: 0,
      limit: 100,
      status: 'disabled',
    });
    expect(result).toBe(0);
  });

  it('barWidth_ExceedsLimit_CapsAt100', () => {
    const result = component.barWidth({
      name: 'test',
      label: 'Test',
      current: 1500,
      limit: 1000,
      status: 'red',
    });
    expect(result).toBe(100);
  });

  it('badgeText_AllStatuses_ReturnsCorrectLabels', () => {
    expect(component.badgeText('green')).toBe('OK');
    expect(component.badgeText('amber')).toBe('Warning');
    expect(component.badgeText('red')).toBe('Critical');
    expect(component.badgeText('disabled')).toBe('Disabled');
  });

  it('render_EnforcementDisabled_ShowsBanner', () => {
    fixture.componentRef.setInput('status', { ...mockStatus, enforcement_enabled: false });
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const banner = el.querySelector('.guardrail-status__banner');
    expect(banner).toBeTruthy();
    expect(banner!.textContent).toContain('enforcement is disabled');
  });

  it('render_EnforcementEnabled_NoBanner', () => {
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const banner = el.querySelector('.guardrail-status__banner');
    expect(banner).toBeNull();
  });

  it('render_MultipleGuardrails_RendersAllRows', () => {
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const rows = el.querySelectorAll('.guardrail-status__row');
    expect(rows.length).toBe(2);
  });
});
