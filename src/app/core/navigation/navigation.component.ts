import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../auth/auth.service';

/**
 * Application navigation shell.
 *
 * Renders a top navigation bar on desktop (>=768px) with the app title,
 * nav links (Home, Games), and a user menu (display name + logout).
 * On mobile (<768px), renders a bottom navigation bar placeholder
 * with icon-style links. Full mobile bottom nav is delivered in a
 * later responsive/accessibility task.
 */
@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [AsyncPipe, RouterLink, RouterLinkActive],
  templateUrl: './navigation.component.html',
  styleUrl: './navigation.component.scss',
})
export class NavigationComponent {
  private readonly authService = inject(AuthService);

  /** Current authenticated user observable. */
  readonly user$ = this.authService.user$;

  /** Whether the user menu dropdown is open. */
  userMenuOpen = false;

  /** Toggle the user menu dropdown visibility. */
  toggleUserMenu(): void {
    this.userMenuOpen = !this.userMenuOpen;
  }

  /** Close the user menu dropdown. */
  closeUserMenu(): void {
    this.userMenuOpen = false;
  }

  /** Sign out the current user. */
  logout(): void {
    this.closeUserMenu();
    this.authService.logout();
  }
}
