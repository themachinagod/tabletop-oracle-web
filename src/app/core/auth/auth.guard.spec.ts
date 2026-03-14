import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  GuardResult,
  MaybeAsync,
  provideRouter,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom, isObservable } from 'rxjs';
import { authGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { User } from './user.model';

describe('authGuard', () => {
  let authService: AuthService;

  const mockPlayer: User = {
    id: '123',
    email: 'player@example.com',
    display_name: 'Player',
    role: 'player',
    created_at: '2026-03-14T10:00:00Z',
    last_login_at: '2026-03-14T12:00:00Z',
  };

  const mockCurator: User = {
    id: '456',
    email: 'curator@example.com',
    display_name: 'Curator',
    role: 'curator',
    created_at: '2026-03-14T10:00:00Z',
    last_login_at: '2026-03-14T12:00:00Z',
  };

  function createRoute(data: Record<string, unknown> = {}): ActivatedRouteSnapshot {
    return { data } as unknown as ActivatedRouteSnapshot;
  }

  function createState(url = '/'): RouterStateSnapshot {
    return { url } as unknown as RouterStateSnapshot;
  }

  /**
   * Execute the guard and resolve the result.
   * The guard returns MaybeAsync<GuardResult>.
   */
  async function runGuard(route: ActivatedRouteSnapshot): Promise<GuardResult> {
    const result: MaybeAsync<GuardResult> = TestBed.runInInjectionContext(() =>
      authGuard(route, createState()),
    );
    if (isObservable(result)) {
      return firstValueFrom(result);
    }
    return result as GuardResult;
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });

    authService = TestBed.inject(AuthService);
  });

  describe('unauthenticated user', () => {
    it('should redirect to /login when not authenticated', async () => {
      const result = await runGuard(createRoute());

      expect(result).toBeInstanceOf(UrlTree);
      expect((result as UrlTree).toString()).toBe('/login');
    });

    it('should redirect to /login for role-protected routes', async () => {
      const result = await runGuard(createRoute({ role: 'curator' }));

      expect(result).toBeInstanceOf(UrlTree);
      expect((result as UrlTree).toString()).toBe('/login');
    });
  });

  describe('authenticated player', () => {
    beforeEach(() => {
      // Simulate authenticated player by accessing private subject
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (authService as any).userSubject.next(mockPlayer);
    });

    it('should allow access to unguarded routes', async () => {
      const result = await runGuard(createRoute());
      expect(result).toBe(true);
    });

    it('should allow access to player-role routes', async () => {
      const result = await runGuard(createRoute({ role: 'player' }));
      expect(result).toBe(true);
    });

    it('should redirect to home for curator-role routes', async () => {
      const result = await runGuard(createRoute({ role: 'curator' }));

      expect(result).toBeInstanceOf(UrlTree);
      expect((result as UrlTree).toString()).toBe('/');
    });
  });

  describe('authenticated curator', () => {
    beforeEach(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (authService as any).userSubject.next(mockCurator);
    });

    it('should allow access to unguarded routes', async () => {
      const result = await runGuard(createRoute());
      expect(result).toBe(true);
    });

    it('should allow access to curator-role routes', async () => {
      const result = await runGuard(createRoute({ role: 'curator' }));
      expect(result).toBe(true);
    });

    it('should allow access to player-role routes (curator is superset)', async () => {
      const result = await runGuard(createRoute({ role: 'player' }));
      expect(result).toBe(true);
    });
  });
});
