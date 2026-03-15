import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ErrorBannerComponent } from './error-banner.component';

describe('ErrorBannerComponent', () => {
  let fixture: ComponentFixture<ErrorBannerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ErrorBannerComponent],
    }).compileComponents();
  });

  function createWith(message: string, dismissible = true): ErrorBannerComponent {
    fixture = TestBed.createComponent(ErrorBannerComponent);
    const component = fixture.componentInstance;
    component.message = message;
    component.dismissible = dismissible;
    fixture.detectChanges();
    return component;
  }

  it('render_WithMessage_DisplaysMessage', () => {
    createWith('Something went wrong');
    expect(fixture.nativeElement.textContent).toContain('Something went wrong');
  });

  it('render_Always_HasAlertRole', () => {
    createWith('Error');
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeTruthy();
  });

  it('render_DismissibleTrue_ShowsDismissButton', () => {
    createWith('Error', true);
    expect(fixture.nativeElement.querySelector('.error-banner__dismiss')).toBeTruthy();
  });

  it('render_DismissibleFalse_HidesDismissButton', () => {
    createWith('Error', false);
    expect(fixture.nativeElement.querySelector('.error-banner__dismiss')).toBeNull();
  });

  it('dismiss_OnClick_EmitsDismissedEvent', () => {
    const component = createWith('Error', true);
    const spy = vi.spyOn(component.dismissed, 'emit');
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('.error-banner__dismiss');
    button.click();
    expect(spy).toHaveBeenCalled();
  });

  it('dismiss_Button_HasAriaLabel', () => {
    createWith('Error', true);
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('.error-banner__dismiss');
    expect(button.getAttribute('aria-label')).toBe('Dismiss error');
  });
});
