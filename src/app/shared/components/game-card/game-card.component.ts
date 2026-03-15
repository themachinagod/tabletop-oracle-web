import { Component, Input } from '@angular/core';
import { GameSummary } from '../../../models/game.model';
import { TagChipComponent } from '../tag-chip/tag-chip.component';
import { ComplexityBadgeComponent } from '../complexity-badge/complexity-badge.component';

/** Maximum number of tags shown before truncating with "+N more". */
const MAX_VISIBLE_TAGS = 3;

/**
 * Card displaying a game summary for browse/list views.
 *
 * Layout: cover image (or placeholder), game name, publisher + year,
 * player count range, complexity badge, first 3 tags + "+N more",
 * document count, expansion count.
 */
@Component({
  selector: 'app-game-card',
  standalone: true,
  imports: [TagChipComponent, ComplexityBadgeComponent],
  templateUrl: './game-card.component.html',
  styleUrl: './game-card.component.scss',
})
export class GameCardComponent {
  /** Game summary data to display. */
  @Input({ required: true }) game!: GameSummary;

  /** Tags visible on the card (first 3). */
  get visibleTags(): string[] {
    return this.game.tags.slice(0, MAX_VISIBLE_TAGS);
  }

  /** Number of tags hidden beyond the visible limit. */
  get hiddenTagCount(): number {
    return Math.max(0, this.game.tags.length - MAX_VISIBLE_TAGS);
  }

  /** Formatted player count range string. */
  get playerCountDisplay(): string | null {
    if (this.game.min_players == null || this.game.max_players == null) {
      return null;
    }
    if (this.game.min_players === this.game.max_players) {
      return `${this.game.min_players} players`;
    }
    return `${this.game.min_players}-${this.game.max_players} players`;
  }

  /** Publisher and year formatted as "Publisher (Year)" or just publisher/year. */
  get publisherYear(): string | null {
    const parts: string[] = [];
    if (this.game.publisher) {
      parts.push(this.game.publisher);
    }
    if (this.game.year_published) {
      parts.push(`(${this.game.year_published})`);
    }
    return parts.length > 0 ? parts.join(' ') : null;
  }
}
