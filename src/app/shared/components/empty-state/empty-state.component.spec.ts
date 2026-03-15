import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EmptyStateComponent } from './empty-state.component';

describe('EmptyStateComponent', () => {
  let fixture: ComponentFixture<EmptyStateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmptyStateComponent],
    }).compileComponents();
  });

  function createWith(opts: {
    message: string;
    icon?: string | null;
    actionLabel?: string | null;
  }): EmptyStateComponent {
    fixture = TestBed.createComponent(EmptyStateComponent);
    const component = fixture.componentInstance;
    component.message = opts.message;
    if (opts.icon !== undefined) component.icon = opts.icon;
    if (opts.actionLabel !== undefined) component.actionLabel = opts.actionLabel;
    fixture.detectChanges();
    return component;
  }

  it('render_WithMessage_DisplaysMessage', () => {
    createWith({ message: 'No sessions found' });
    expect(fixture.nativeElement.textContent).toContain('No sessions found');
  });

  it('render_WithIcon_ShowsIcon', () => {
    createWith({ message: 'No results', icon: 'X' });
    const icon = fixture.nativeElement.querySelector('.empty-state__icon');
    expect(icon).toBeTruthy();
    expect(icon.textContent.trim()).toBe('X');
  });

  it('render_WithoutIcon_HidesIcon', () => {
    createWith({ message: 'No results', icon: null });
    expect(fixture.nativeElement.querySelector('.empty-state__icon')).toBeNull();
  });

  it('render_WithActionLabel_ShowsButton', () => {
    createWith({ message: 'No results', actionLabel: 'Browse Games' });
    const button = fixture.nativeElement.querySelector('.empty-state__action');
    expect(button).toBeTruthy();
    expect(button.textContent.trim()).toBe('Browse Games');
  });

  it('render_WithoutActionLabel_HidesButton', () => {
    createWith({ message: 'No results', actionLabel: null });
    expect(fixture.nativeElement.querySelector('.empty-state__action')).toBeNull();
  });

  it('action_OnClick_EmitsEvent', () => {
    const component = createWith({ message: 'No results', actionLabel: 'Try Again' });
    const spy = vi.spyOn(component.actionClicked, 'emit');
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('.empty-state__action');
    button.click();
    expect(spy).toHaveBeenCalled();
  });

  it('render_Always_HasStatusRole', () => {
    createWith({ message: 'No results' });
    expect(fixture.nativeElement.querySelector('[role="status"]')).toBeTruthy();
  });

  it('render_Icon_HasAriaHidden', () => {
    createWith({ message: 'No results', icon: 'Y' });
    const icon = fixture.nativeElement.querySelector('.empty-state__icon');
    expect(icon.getAttribute('aria-hidden')).toBe('true');
  });
});
