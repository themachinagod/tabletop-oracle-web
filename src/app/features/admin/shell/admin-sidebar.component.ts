import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

/** Navigation item rendered in the admin sidebar. */
export interface AdminNavItem {
  label: string;
  route: string;
  icon: string;
  disabled: boolean;
  exact: boolean;
}

/**
 * Admin sidebar navigation component.
 *
 * Renders navigation links for the admin area with active state
 * highlighting and disabled indicators for stub routes. Emits
 * a navigation event so the shell can collapse the sidebar on
 * mobile after a link is clicked.
 *
 * Route: n/a (child of AdminShellComponent)
 */
@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './admin-sidebar.component.html',
  styleUrl: './admin-sidebar.component.scss',
})
export class AdminSidebarComponent {
  /** Whether the sidebar is currently visible (controlled by shell). */
  @Input() open = true;

  /** Emitted when a nav link is clicked (for mobile collapse). */
  @Output() readonly navigated = new EventEmitter<void>();

  /** Admin navigation items. */
  readonly navItems: AdminNavItem[] = [
    { label: 'Game Library', route: '/admin', icon: '\u{1F3B2}', disabled: false, exact: true },
    {
      label: 'Knowledge Graph',
      route: '/admin/knowledge-graph',
      icon: '\u{1F578}',
      disabled: true,
      exact: false,
    },
    {
      label: 'Sessions',
      route: '/admin/sessions',
      icon: '\u{1F465}',
      disabled: true,
      exact: false,
    },
    { label: 'Settings', route: '/admin/settings', icon: '\u2699', disabled: false, exact: false },
    { label: 'Usage', route: '/admin/usage', icon: '\u{1F4CA}', disabled: false, exact: false },
  ];

  /** Handle nav link click. */
  onNavClick(): void {
    this.navigated.emit();
  }
}
