import { Component, EventEmitter, Input, Output } from '@angular/core';
import { SessionSummary } from '../../../models/session.model';
import { SessionCardComponent } from '../../../shared/components/session-card/session-card.component';

/**
 * Renders a list of session cards.
 *
 * Pure presentational component: receives session data via input,
 * emits events for session selection and status changes. Does not
 * perform any data fetching.
 */
@Component({
  selector: 'app-session-list',
  standalone: true,
  imports: [SessionCardComponent],
  template: `
    <ul class="session-list" role="list">
      @for (session of sessions; track session.id) {
        <li class="session-list__item">
          <button
            class="session-list__button"
            type="button"
            (click)="sessionSelected.emit(session)"
            [attr.aria-label]="'Open session: ' + session.name"
          >
            <app-session-card [session]="session" />
          </button>
          @if (session.status === 'archived') {
            <button
              class="session-list__restore"
              type="button"
              (click)="restoreRequested.emit(session); $event.stopPropagation()"
              aria-label="Restore session"
            >
              Restore
            </button>
          }
        </li>
      }
    </ul>
  `,
  styleUrl: './session-list.component.scss',
})
export class SessionListComponent {
  /** Sessions to render as cards. */
  @Input({ required: true }) sessions!: SessionSummary[];

  /** Emitted when a session card is tapped/clicked. */
  @Output() sessionSelected = new EventEmitter<SessionSummary>();

  /** Emitted when the restore button on an archived session is clicked. */
  @Output() restoreRequested = new EventEmitter<SessionSummary>();
}
