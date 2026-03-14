import {
  APP_INITIALIZER,
  ApplicationConfig,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { routes } from './app.routes';
import { authInterceptor } from './core/auth/auth.interceptor';
import { AuthService } from './core/auth/auth.service';

/**
 * Factory for APP_INITIALIZER that loads the user profile on startup.
 *
 * Calls AuthService.loadUser() to check for an existing session cookie.
 * If the session is valid, user state is populated before the app renders.
 * If not, the user state stays null and the app renders the login page.
 *
 * @param authService - The authentication service.
 * @returns A function that returns a promise resolving when user check completes.
 */
function initAuth(authService: AuthService): () => Promise<void> {
  return () => lastValueFrom(authService.loadUser()).then(() => undefined);
}

/** Application-wide provider configuration. */
export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    {
      provide: APP_INITIALIZER,
      useFactory: initAuth,
      deps: [AuthService],
      multi: true,
    },
  ],
};
