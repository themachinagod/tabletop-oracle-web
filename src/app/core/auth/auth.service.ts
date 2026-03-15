import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, map, Observable, of } from 'rxjs';
import { environment } from '../config/environment';
import { User } from './user.model';
import { ApiResponse } from '../../models/api.model';

/**
 * Authentication service using BFF (Backend-For-Frontend) pattern.
 *
 * Session management is handled server-side via HTTP-only cookies.
 * The service manages client-side user state via BehaviorSubject and
 * delegates all OAuth/session concerns to the backend.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly userSubject = new BehaviorSubject<User | null>(null);

  /** Observable of the current authenticated user, or null. */
  readonly user$ = this.userSubject.asObservable();

  /** Observable indicating whether a user is currently authenticated. */
  readonly isAuthenticated$: Observable<boolean> = this.user$.pipe(map((u) => u !== null));

  /** Observable of the current user's role, or null if unauthenticated. */
  readonly role$: Observable<'player' | 'curator' | null> = this.user$.pipe(
    map((u) => u?.role ?? null),
  );

  /** Synchronous accessor for the current user snapshot. */
  get currentUser(): User | null {
    return this.userSubject.getValue();
  }

  /**
   * Initiate OAuth login by redirecting to the backend OAuth endpoint.
   *
   * The backend handles the full OAuth flow (PKCE, provider redirect,
   * callback, session creation) and redirects back with a session cookie.
   *
   * @param provider - The OAuth provider to authenticate with.
   */
  login(provider: 'google' | 'microsoft'): void {
    window.location.href = `${environment.apiUrl}/auth/login/${provider}`;
  }

  /**
   * Fetch the current user profile from the backend.
   *
   * Called on app initialisation (via APP_INITIALIZER) to check for
   * an existing session cookie. If the session is valid, user state
   * is populated. If not (401), state remains null — no error thrown
   * so the app can still render the login page.
   *
   * @returns Observable that completes when the check is done.
   */
  loadUser(): Observable<User | null> {
    return this.http
      .get<ApiResponse<User>>(`${environment.apiUrl}/auth/me`, {
        withCredentials: true,
      })
      .pipe(
        map((response) => {
          this.userSubject.next(response.data);
          return response.data;
        }),
        catchError((error: HttpErrorResponse) => {
          // 401 is expected when no session exists — not an error condition
          if (error.status !== 401) {
            console.error('Failed to load user profile', error);
          }
          this.userSubject.next(null);
          return of(null);
        }),
      );
  }

  /**
   * End the current session.
   *
   * Posts to the backend logout endpoint to destroy the server-side
   * session, then clears client-side state and navigates to login.
   */
  logout(): void {
    this.http
      .post(`${environment.apiUrl}/auth/logout`, {}, { withCredentials: true })
      .pipe(
        catchError(() => {
          // Even if the logout API fails, clear local state
          return of(null);
        }),
      )
      .subscribe(() => {
        this.clearUser();
        this.router.navigate(['/login']);
      });
  }

  /**
   * Clear client-side user state without making an API call.
   *
   * Used by the AuthInterceptor when a 401 response is received,
   * indicating the session has expired server-side.
   */
  clearUser(): void {
    this.userSubject.next(null);
  }
}
