import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, take } from 'rxjs';
import { AuthService } from './auth.service';

/**
 * Route guard that enforces authentication and optional role-based access.
 *
 * Usage:
 * - Basic auth check: `canActivate: [authGuard]`
 * - Role-based: `canActivate: [authGuard], data: { role: 'curator' }`
 *
 * Role semantics:
 * - `curator`: only users with the curator role pass; others redirect to home.
 * - `player`: both player and curator roles pass (curator is a superset).
 * - No role specified: any authenticated user passes.
 *
 * Unauthenticated users are redirected to /login.
 */
export const authGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.isAuthenticated$.pipe(
    take(1),
    map((isAuthenticated) => {
      if (!isAuthenticated) {
        return router.createUrlTree(['/login']);
      }

      const requiredRole = route.data?.['role'] as string | undefined;
      if (!requiredRole) {
        return true;
      }

      const user = authService.currentUser;
      if (requiredRole === 'curator' && user?.role !== 'curator') {
        // Non-curator trying to access curator route — redirect to home, not login
        return router.createUrlTree(['/']);
      }

      // 'player' role: both player and curator pass
      return true;
    }),
  );
};
