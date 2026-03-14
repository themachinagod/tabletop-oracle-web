import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import {
  HttpClient,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { provideRouter, Router } from '@angular/router';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';

/** Stub component for test route configuration. */
@Component({ standalone: true, template: '' })
class StubComponent {}

describe('authInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;
  let authService: AuthService;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([{ path: 'login', component: StubComponent }]),
      ],
    });

    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should add withCredentials to requests', () => {
    httpClient.get('/api/test').subscribe();

    const req = httpMock.expectOne('/api/test');
    expect(req.request.withCredentials).toBe(true);
    req.flush({});
  });

  it('should add withCredentials to POST requests', () => {
    httpClient.post('/api/test', { data: 'value' }).subscribe();

    const req = httpMock.expectOne('/api/test');
    expect(req.request.withCredentials).toBe(true);
    req.flush({});
  });

  it('should clear user and navigate to /login on 401', () => {
    const clearSpy = vi.spyOn(authService, 'clearUser');
    const navigateSpy = vi.spyOn(router, 'navigate');

    httpClient.get('/api/test').subscribe({
      error: () => {
        /* expected */
      },
    });

    const req = httpMock.expectOne('/api/test');
    req.flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(clearSpy).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  });

  it('should not navigate on non-401 errors', () => {
    const clearSpy = vi.spyOn(authService, 'clearUser');
    const navigateSpy = vi.spyOn(router, 'navigate');

    httpClient.get('/api/test').subscribe({
      error: () => {
        /* expected */
      },
    });

    const req = httpMock.expectOne('/api/test');
    req.flush(null, { status: 500, statusText: 'Server Error' });

    expect(clearSpy).not.toHaveBeenCalled();
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('should not navigate on 403 errors', () => {
    const clearSpy = vi.spyOn(authService, 'clearUser');
    const navigateSpy = vi.spyOn(router, 'navigate');

    httpClient.get('/api/test').subscribe({
      error: () => {
        /* expected */
      },
    });

    const req = httpMock.expectOne('/api/test');
    req.flush(null, { status: 403, statusText: 'Forbidden' });

    expect(clearSpy).not.toHaveBeenCalled();
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('should re-throw the error after handling 401', () => {
    let receivedError: unknown = null;

    httpClient.get('/api/test').subscribe({
      error: (err) => {
        receivedError = err;
      },
    });

    const req = httpMock.expectOne('/api/test');
    req.flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(receivedError).toBeTruthy();
  });
});
