import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';
import { User } from './user.model';
import { environment } from '../config/environment';

/** Stub component for test route configuration. */
@Component({ standalone: true, template: '' })
class StubComponent {}

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let router: Router;

  const mockUser: User = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'alice@example.com',
    display_name: 'Alice Smith',
    role: 'player',
    created_at: '2026-03-14T10:00:00Z',
    last_login_at: '2026-03-14T12:00:00Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: 'login', component: StubComponent }]),
      ],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('initial state', () => {
    it('should have null currentUser', () => {
      expect(service.currentUser).toBeNull();
    });

    it('should emit false for isAuthenticated$', async () => {
      const isAuth = await firstValueFrom(service.isAuthenticated$);
      expect(isAuth).toBe(false);
    });

    it('should emit null for role$', async () => {
      const role = await firstValueFrom(service.role$);
      expect(role).toBeNull();
    });
  });

  describe('login', () => {
    it('should set location.href to backend OAuth endpoint for google', () => {
      // jsdom doesn't allow spying on location.href setter, so we
      // replace window.location entirely for this test
      const originalLocation = window.location;
      const mockLocation = { ...originalLocation, href: '' } as Location;
      Object.defineProperty(window, 'location', {
        value: mockLocation,
        writable: true,
        configurable: true,
      });

      service.login('google');

      expect(window.location.href).toBe(`${environment.apiUrl}/auth/login/google`);

      Object.defineProperty(window, 'location', {
        value: originalLocation,
        writable: true,
        configurable: true,
      });
    });

    it('should set location.href to backend OAuth endpoint for microsoft', () => {
      const originalLocation = window.location;
      const mockLocation = { ...originalLocation, href: '' } as Location;
      Object.defineProperty(window, 'location', {
        value: mockLocation,
        writable: true,
        configurable: true,
      });

      service.login('microsoft');

      expect(window.location.href).toBe(`${environment.apiUrl}/auth/login/microsoft`);

      Object.defineProperty(window, 'location', {
        value: originalLocation,
        writable: true,
        configurable: true,
      });
    });
  });

  describe('loadUser', () => {
    it('should populate user state on successful response', async () => {
      const loadPromise = firstValueFrom(service.loadUser());

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/me`);
      expect(req.request.withCredentials).toBe(true);
      req.flush({ data: mockUser });

      const result = await loadPromise;
      expect(result).toEqual(mockUser);
      expect(service.currentUser).toEqual(mockUser);
    });

    it('should emit user through user$ observable', async () => {
      const userPromise = new Promise<User | null>((resolve) => {
        // Skip the initial null emission, take the first non-null
        const sub = service.user$.subscribe((u) => {
          if (u !== null) {
            resolve(u);
            sub.unsubscribe();
          }
        });
      });

      service.loadUser().subscribe();
      const req = httpMock.expectOne(`${environment.apiUrl}/auth/me`);
      req.flush({ data: mockUser });

      const user = await userPromise;
      expect(user).toEqual(mockUser);
    });

    it('should emit true for isAuthenticated$ after loading user', async () => {
      service.loadUser().subscribe();
      const req = httpMock.expectOne(`${environment.apiUrl}/auth/me`);
      req.flush({ data: mockUser });

      const isAuth = await firstValueFrom(service.isAuthenticated$);
      expect(isAuth).toBe(true);
    });

    it('should emit role through role$ after loading user', async () => {
      service.loadUser().subscribe();
      const req = httpMock.expectOne(`${environment.apiUrl}/auth/me`);
      req.flush({ data: mockUser });

      const role = await firstValueFrom(service.role$);
      expect(role).toBe('player');
    });

    it('should set user to null on 401 response', async () => {
      const loadPromise = firstValueFrom(service.loadUser());

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/me`);
      req.flush(null, { status: 401, statusText: 'Unauthorized' });

      const result = await loadPromise;
      expect(result).toBeNull();
      expect(service.currentUser).toBeNull();
    });

    it('should set user to null on network error', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {
        /* suppress */
      });

      const loadPromise = firstValueFrom(service.loadUser());

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/me`);
      req.flush(null, { status: 500, statusText: 'Server Error' });

      const result = await loadPromise;
      expect(result).toBeNull();
      expect(service.currentUser).toBeNull();

      consoleSpy.mockRestore();
    });
  });

  describe('logout', () => {
    it('should POST to logout endpoint and clear user state', () => {
      // First, populate user state
      service.loadUser().subscribe();
      httpMock.expectOne(`${environment.apiUrl}/auth/me`).flush({ data: mockUser });
      expect(service.currentUser).toEqual(mockUser);

      const navigateSpy = vi.spyOn(router, 'navigate');

      service.logout();

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/logout`);
      expect(req.request.method).toBe('POST');
      expect(req.request.withCredentials).toBe(true);
      req.flush(null, { status: 204, statusText: 'No Content' });

      expect(service.currentUser).toBeNull();
      expect(navigateSpy).toHaveBeenCalledWith(['/login']);
    });

    it('should clear user state even if logout API fails', () => {
      service.loadUser().subscribe();
      httpMock.expectOne(`${environment.apiUrl}/auth/me`).flush({ data: mockUser });

      const navigateSpy = vi.spyOn(router, 'navigate');

      service.logout();

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/logout`);
      req.flush(null, { status: 500, statusText: 'Server Error' });

      expect(service.currentUser).toBeNull();
      expect(navigateSpy).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('clearUser', () => {
    it('should set user state to null without API call', () => {
      // Populate user state
      service.loadUser().subscribe();
      httpMock.expectOne(`${environment.apiUrl}/auth/me`).flush({ data: mockUser });
      expect(service.currentUser).toEqual(mockUser);

      service.clearUser();

      expect(service.currentUser).toBeNull();
      // httpMock.verify() in afterEach confirms no extra requests
    });
  });
});
