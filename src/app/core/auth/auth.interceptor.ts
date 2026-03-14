import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

/**
 * HTTP interceptor for BFF cookie-based authentication.
 *
 * Responsibilities:
 * 1. Clone every request with `withCredentials: true` so the browser
 *    sends the session cookie automatically.
 * 2. Catch 401 responses — clear client-side user state and redirect
 *    to the login page. The 401 error is still re-thrown so individual
 *    callers can handle it if needed.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const apiReq = req.clone({ withCredentials: true });

  return next(apiReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        authService.clearUser();
        router.navigate(['/login']);
      }
      return throwError(() => error);
    }),
  );
};
