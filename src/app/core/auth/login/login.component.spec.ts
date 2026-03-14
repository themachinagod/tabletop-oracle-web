import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { LoginComponent } from './login.component';
import { AuthService } from '../auth.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authService: AuthService;

  function createComponent(queryParams: Record<string, string> = {}): void {
    TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: (key: string) => queryParams[key] ?? null,
              },
            },
          },
        },
      ],
    });

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService);
    fixture.detectChanges();
  }

  describe('without error params', () => {
    beforeEach(() => createComponent());

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should not display error message', () => {
      expect(component.errorMessage).toBeNull();
      const errorBanner = fixture.nativeElement.querySelector('.error-banner');
      expect(errorBanner).toBeNull();
    });

    it('should render Google login button', () => {
      const buttons = fixture.nativeElement.querySelectorAll('.login-btn');
      const googleBtn = Array.from(buttons).find((b) =>
        (b as HTMLElement).textContent?.includes('Google'),
      );
      expect(googleBtn).toBeTruthy();
    });

    it('should render Microsoft login button', () => {
      const buttons = fixture.nativeElement.querySelectorAll('.login-btn');
      const msBtn = Array.from(buttons).find((b) =>
        (b as HTMLElement).textContent?.includes('Microsoft'),
      );
      expect(msBtn).toBeTruthy();
    });

    it('should call authService.login with google when Google button clicked', () => {
      const loginSpy = vi.spyOn(authService, 'login');
      const googleBtn = fixture.nativeElement.querySelector('.login-btn.google');

      googleBtn.click();

      expect(loginSpy).toHaveBeenCalledWith('google');
    });

    it('should call authService.login with microsoft when Microsoft button clicked', () => {
      const loginSpy = vi.spyOn(authService, 'login');
      const msBtn = fixture.nativeElement.querySelector('.login-btn.microsoft');

      msBtn.click();

      expect(loginSpy).toHaveBeenCalledWith('microsoft');
    });
  });

  describe('with auth_failed error', () => {
    beforeEach(() => createComponent({ error: 'auth_failed' }));

    it('should display auth failed error message', () => {
      expect(component.errorMessage).toBe('Authentication failed. Please try again.');
    });

    it('should render error banner in DOM', () => {
      const errorBanner = fixture.nativeElement.querySelector('.error-banner');
      expect(errorBanner).toBeTruthy();
      expect(errorBanner.textContent).toContain('Authentication failed');
    });

    it('should have role="alert" on error banner', () => {
      const errorBanner = fixture.nativeElement.querySelector('.error-banner');
      expect(errorBanner.getAttribute('role')).toBe('alert');
    });
  });

  describe('with account_conflict error', () => {
    beforeEach(() => createComponent({ error: 'account_conflict' }));

    it('should display account conflict error message', () => {
      expect(component.errorMessage).toBe(
        'An account with this email already exists via another provider.',
      );
    });
  });

  describe('with unknown error param', () => {
    beforeEach(() => createComponent({ error: 'unknown_error' }));

    it('should not display error message for unknown error codes', () => {
      expect(component.errorMessage).toBeNull();
    });
  });
});
