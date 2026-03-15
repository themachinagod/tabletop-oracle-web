import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AdminSidebarComponent } from './admin-sidebar.component';

/**
 * Admin shell layout component.
 *
 * Provides the persistent sidebar navigation and content area for all
 * admin views. The sidebar is always visible on desktop (>=992px) and
 * toggled via a hamburger button on smaller screens.
 *
 * Route: /admin (layout wrapper for all admin child routes)
 */
@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [RouterOutlet, AdminSidebarComponent],
  templateUrl: './admin-shell.component.html',
  styleUrl: './admin-shell.component.scss',
})
export class AdminShellComponent {
  /** Whether the mobile sidebar is currently open. */
  readonly sidebarOpen = signal(false);

  /** Toggle the mobile sidebar visibility. */
  toggleSidebar(): void {
    this.sidebarOpen.update((open) => !open);
  }

  /** Close the mobile sidebar (e.g., after navigation). */
  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }
}
