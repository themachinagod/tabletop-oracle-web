import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../auth.service';

/** Error codes returned by the backend OAuth callback as query parameters. */
type AuthError = 'auth_failed' | 'account_conflict';

/** Human-readable error messages for each backend error code. */
const ERROR_MESSAGES: Record<AuthError, string> = {
  auth_failed: 'Authentication failed. Please try again.',
  account_conflict:
    'An account with this email already exists via another provider.',
};

/**
 * Login page presenting OAuth provider buttons.
 *
 * Displays Google and Microsoft login buttons that redirect to the
 * backend OAuth endpoints. Shows error messages when the backend
 * redirects back with an error query parameter.
 */
@Component({
  selector: 'app-login',
  standalone: true,
  template: `
    <div class="login-container">
      <h1>Tabletop Oracle</h1>
      <p class="subtitle">Sign in to continue</p>

      @if (errorMessage) {
        <div class="error-banner" role="alert">
          {{ errorMessage }}
        </div>
      }

      <div class="login-buttons">
        <button class="login-btn google" (click)="loginWith('google')">
          Sign in with Google
        </button>
        <button class="login-btn microsoft" (click)="loginWith('microsoft')">
          Sign in with Microsoft
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .login-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        padding: 2rem;
      }

      h1 {
        margin-bottom: 0.5rem;
        font-size: 2rem;
      }

      .subtitle {
        margin-bottom: 2rem;
        color: #666;
      }

      .error-banner {
        background-color: #fee;
        border: 1px solid #fcc;
        color: #c00;
        padding: 0.75rem 1rem;
        border-radius: 4px;
        margin-bottom: 1.5rem;
        max-width: 400px;
        text-align: center;
      }

      .login-buttons {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        width: 100%;
        max-width: 300px;
      }

      .login-btn {
        padding: 0.75rem 1.5rem;
        border: 1px solid #ccc;
        border-radius: 4px;
        font-size: 1rem;
        cursor: pointer;
        background: #fff;
        transition: background-color 0.2s;
      }

      .login-btn:hover {
        background-color: #f5f5f5;
      }

      .login-btn:focus-visible {
        outline: 2px solid #4285f4;
        outline-offset: 2px;
      }
    `,
  ],
})
export class LoginComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);

  /** Error message to display, derived from URL query parameters. */
  errorMessage: string | null = null;

  ngOnInit(): void {
    const errorCode = this.route.snapshot.queryParamMap.get('error');
    if (errorCode && errorCode in ERROR_MESSAGES) {
      this.errorMessage = ERROR_MESSAGES[errorCode as AuthError];
    }
  }

  /** Redirect to the backend OAuth endpoint for the given provider. */
  loginWith(provider: 'google' | 'microsoft'): void {
    this.authService.login(provider);
  }
}
