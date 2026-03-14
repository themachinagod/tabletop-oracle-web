import { Injectable, signal } from '@angular/core';

/** Authenticated user profile. */
export interface User {
  id: string;
  email: string;
  display_name: string;
  role: 'player' | 'curator' | 'admin';
}

/**
 * Authentication service using BFF (Backend-For-Frontend) pattern.
 * Session management is handled server-side via HTTP-only cookies.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly currentUser = signal<User | null>(null);
  readonly isAuthenticated = signal<boolean>(false);

  /** Check existing session by calling the backend /auth/me endpoint. */
  async checkSession(): Promise<void> {
    // TODO: Call GET /api/v1/auth/me to check session
  }

  /** Redirect to OAuth provider login via BFF. */
  login(provider: 'google' | 'microsoft'): void {
    window.location.href = `/api/v1/auth/${provider}/login`;
  }

  /** End the current session. */
  async logout(): Promise<void> {
    // TODO: Call POST /api/v1/auth/logout
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
  }
}
