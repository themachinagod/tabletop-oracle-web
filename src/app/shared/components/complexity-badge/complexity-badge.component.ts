import { Component, Input } from '@angular/core';
import { ComplexityLevel } from '../../../models/game.model';

/**
 * Badge displaying a game's complexity level.
 *
 * Renders a colored badge with the complexity label (Light, Medium, Heavy).
 * Each level has distinct styling for quick visual identification.
 */
@Component({
  selector: 'app-complexity-badge',
  standalone: true,
  template: `
    <span
      class="complexity-badge"
      [class.complexity-badge--light]="level === 'light'"
      [class.complexity-badge--medium]="level === 'medium'"
      [class.complexity-badge--heavy]="level === 'heavy'"
    >
      {{ displayLabel }}
    </span>
  `,
  styleUrl: './complexity-badge.component.scss',
})
export class ComplexityBadgeComponent {
  /** Complexity level to display. */
  @Input({ required: true }) level!: ComplexityLevel;

  /** Capitalised display label derived from the level. */
  get displayLabel(): string {
    return this.level.charAt(0).toUpperCase() + this.level.slice(1);
  }
}
