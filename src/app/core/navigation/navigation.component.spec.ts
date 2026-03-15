import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { NavigationComponent } from './navigation.component';
import { AuthService } from '../auth/auth.service';
import { User } from '../auth/user.model';

describe('NavigationComponent', () => {
  let component: NavigationComponent;
  let fixture: ComponentFixture<NavigationComponent>;
  let mockAuthService: {
    user$: BehaviorSubject<User | null>;
    logout: ReturnType<typeof vi.fn>;
  };

  const mockUser: User = {
    id: '123',
    email: 'alice@example.com',
    display_name: 'Alice Smith',
    role: 'player',
    created_at: '2026-03-14T10:00:00Z',
    last_login_at: '2026-03-14T12:00:00Z',
  };

  beforeEach(async () => {
    mockAuthService = {
      user$: new BehaviorSubject<User | null>(mockUser),
      logout: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [NavigationComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: mockAuthService }],
    }).compileComponents();

    fixture = TestBed.createComponent(NavigationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('top navigation', () => {
    it('should render the app title', () => {
      const titleEl = fixture.nativeElement.querySelector('.top-nav__title');
      expect(titleEl.textContent).toContain('Tabletop Oracle');
    });

    it('should render Home and Games nav links', () => {
      const links = fixture.nativeElement.querySelectorAll('.top-nav__link');
      expect(links.length).toBe(2);
      expect(links[0].textContent.trim()).toBe('Home');
      expect(links[1].textContent.trim()).toBe('Games');
    });

    it('should display user display name in user menu button', () => {
      const userButton = fixture.nativeElement.querySelector('.top-nav__user-button');
      expect(userButton.textContent.trim()).toBe('Alice Smith');
    });

    it('should not show user menu when no user', () => {
      mockAuthService.user$.next(null);
      fixture.detectChanges();

      const userButton = fixture.nativeElement.querySelector('.top-nav__user-button');
      expect(userButton).toBeNull();
    });
  });

  describe('user menu', () => {
    it('should not show dropdown by default', () => {
      const dropdown = fixture.nativeElement.querySelector('.top-nav__dropdown');
      expect(dropdown).toBeNull();
    });

    it('should toggle dropdown on button click', () => {
      const button: HTMLButtonElement =
        fixture.nativeElement.querySelector('.top-nav__user-button');
      button.click();
      fixture.detectChanges();

      let dropdown = fixture.nativeElement.querySelector('.top-nav__dropdown');
      expect(dropdown).not.toBeNull();

      button.click();
      fixture.detectChanges();

      dropdown = fixture.nativeElement.querySelector('.top-nav__dropdown');
      expect(dropdown).toBeNull();
    });

    it('should show sign out option in dropdown', () => {
      const button: HTMLButtonElement =
        fixture.nativeElement.querySelector('.top-nav__user-button');
      button.click();
      fixture.detectChanges();

      const item = fixture.nativeElement.querySelector('.top-nav__dropdown-item');
      expect(item.textContent.trim()).toBe('Sign out');
    });

    it('should call logout and close menu on sign out click', () => {
      const button: HTMLButtonElement =
        fixture.nativeElement.querySelector('.top-nav__user-button');
      button.click();
      fixture.detectChanges();

      const item: HTMLButtonElement =
        fixture.nativeElement.querySelector('.top-nav__dropdown-item');
      item.click();
      fixture.detectChanges();

      expect(mockAuthService.logout).toHaveBeenCalled();
      expect(component.userMenuOpen).toBe(false);
    });

    it('should set aria-expanded attribute correctly', () => {
      const button: HTMLButtonElement =
        fixture.nativeElement.querySelector('.top-nav__user-button');
      expect(button.getAttribute('aria-expanded')).toBe('false');

      button.click();
      fixture.detectChanges();

      expect(button.getAttribute('aria-expanded')).toBe('true');
    });
  });

  describe('bottom navigation', () => {
    it('should render Home and Games links', () => {
      const links = fixture.nativeElement.querySelectorAll('.bottom-nav__link');
      expect(links.length).toBe(2);

      const labels = fixture.nativeElement.querySelectorAll('.bottom-nav__label');
      expect(labels[0].textContent.trim()).toBe('Home');
      expect(labels[1].textContent.trim()).toBe('Games');
    });

    it('should have aria-label on bottom nav', () => {
      const nav = fixture.nativeElement.querySelector('.bottom-nav');
      expect(nav.getAttribute('aria-label')).toBe('Mobile navigation');
    });
  });

  describe('closeUserMenu', () => {
    it('should set userMenuOpen to false', () => {
      component.userMenuOpen = true;
      component.closeUserMenu();
      expect(component.userMenuOpen).toBe(false);
    });
  });
});
