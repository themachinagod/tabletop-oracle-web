import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { NavigationComponent } from './core/navigation/navigation.component';
import { AuthService } from './core/auth/auth.service';

/**
 * Root application component.
 *
 * Renders the navigation shell for authenticated users and the
 * router outlet for all feature views. The navigation is hidden
 * on the login page (unauthenticated state).
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [AsyncPipe, RouterOutlet, NavigationComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  readonly title = 'tabletop-oracle-web';

  private readonly authService = inject(AuthService);

  /** Whether the current user is authenticated. */
  readonly isAuthenticated$ = this.authService.isAuthenticated$;
}
