import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SessionBrowserPlaceholderComponent } from './session-browser-placeholder.component';

describe('SessionBrowserPlaceholderComponent', () => {
  let fixture: ComponentFixture<SessionBrowserPlaceholderComponent>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SessionBrowserPlaceholderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SessionBrowserPlaceholderComponent);
    fixture.detectChanges();
    element = fixture.nativeElement;
  });

  it('renders_Component_ShowsTitle', () => {
    const title = element.querySelector('.stub-page__title');
    expect(title?.textContent?.trim()).toBe('Session Browser');
  });

  it('renders_Component_ShowsComingSoonMessage', () => {
    const message = element.querySelector('.empty-state__message');
    expect(message?.textContent).toContain('Session Browser is coming soon');
  });

  it('renders_Component_ShowsEmptyStateIcon', () => {
    const icon = element.querySelector('.empty-state__icon');
    expect(icon).toBeTruthy();
  });
});
