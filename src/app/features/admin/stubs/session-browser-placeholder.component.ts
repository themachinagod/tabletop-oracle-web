import { ChangeDetectionStrategy, Component } from '@angular/core';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

/**
 * Session browser placeholder.
 *
 * Stub for the Level 4 session browser view. Blocked by EPIC-004
 * (Session & Play). Will display a cross-user session list with
 * filters and a read-only conversation view once the session
 * infrastructure is designed and implemented.
 *
 * Route: /admin/sessions
 */
@Component({
  selector: 'app-session-browser-placeholder',
  standalone: true,
  imports: [EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="stub-page">
      <h2 class="stub-page__title">Session Browser</h2>
      <app-empty-state
        icon="\u{1F465}"
        message="Session Browser is coming soon. This feature requires the Session & Play system (EPIC-004) to be designed and implemented."
      />
    </div>
  `,
  styles: `
    .stub-page {
      padding: 2rem;
      max-width: 40rem;
      margin: 0 auto;
      text-align: center;
    }

    .stub-page__title {
      margin-bottom: 1.5rem;
      font-size: 1.5rem;
      font-weight: 600;
    }
  `,
})
export class SessionBrowserPlaceholderComponent {}
