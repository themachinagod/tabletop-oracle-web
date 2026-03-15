import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoadingSpinnerComponent } from './loading-spinner.component';

describe('LoadingSpinnerComponent', () => {
  let fixture: ComponentFixture<LoadingSpinnerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoadingSpinnerComponent],
    }).compileComponents();
  });

  function createWith(message = 'Loading...'): LoadingSpinnerComponent {
    fixture = TestBed.createComponent(LoadingSpinnerComponent);
    const component = fixture.componentInstance;
    component.message = message;
    fixture.detectChanges();
    return component;
  }

  it('render_DefaultMessage_ShowsLoading', () => {
    createWith();
    expect(fixture.nativeElement.textContent).toContain('Loading...');
  });

  it('render_CustomMessage_ShowsCustomText', () => {
    createWith('Fetching games...');
    expect(fixture.nativeElement.textContent).toContain('Fetching games...');
  });

  it('render_Always_HasStatusRole', () => {
    createWith();
    expect(fixture.nativeElement.querySelector('[role="status"]')).toBeTruthy();
  });

  it('render_Always_HasAriaLive', () => {
    createWith();
    expect(fixture.nativeElement.querySelector('[aria-live="polite"]')).toBeTruthy();
  });

  it('render_SpinnerCircle_HasAriaHidden', () => {
    createWith();
    const circle = fixture.nativeElement.querySelector('.loading-spinner__circle');
    expect(circle?.getAttribute('aria-hidden')).toBe('true');
  });
});
