import { Component, Input } from '@angular/core';
import { SessionSummary } from '../../../models/session.model';
import { RelativeTimePipe } from '../../pipes/relative-time.pipe';
import { TruncatePipe } from '../../pipes/truncate.pipe';

/** Maximum length for the message preview before truncation. */
const MESSAGE_PREVIEW_LENGTH = 80;

/**
 * Card displaying a session summary.
 *
 * Layout: game name + cover image thumbnail, session name, active
 * expansion badges, player count, relative timestamp, last message
 * preview (truncated).
 */
@Component({
  selector: 'app-session-card',
  standalone: true,
  imports: [RelativeTimePipe, TruncatePipe],
  templateUrl: './session-card.component.html',
  styleUrl: './session-card.component.scss',
})
export class SessionCardComponent {
  /** Session summary data to display. */
  @Input({ required: true }) session!: SessionSummary;

  /** Max preview length exposed for the template. */
  readonly previewLength = MESSAGE_PREVIEW_LENGTH;
}
