import { Component, Input } from '@angular/core';
import { ExpansionDetail } from '../../../models/game.model';

/**
 * Read-only list of game expansions.
 *
 * Displays expansion name, description, and year published.
 * Used within the GameDetailComponent.
 */
@Component({
  selector: 'app-expansion-list',
  standalone: true,
  template: `
    <section class="expansion-list">
      <h3 class="expansion-list__title">Expansions ({{ expansions.length }})</h3>
      <ul class="expansion-list__items">
        @for (expansion of expansions; track expansion.id) {
          <li class="expansion-list__item">
            <span class="expansion-list__name">{{ expansion.name }}</span>
            @if (expansion.year_published) {
              <span class="expansion-list__year">({{ expansion.year_published }})</span>
            }
            @if (expansion.description) {
              <p class="expansion-list__description">{{ expansion.description }}</p>
            }
          </li>
        }
      </ul>
    </section>
  `,
  styleUrl: './expansion-list.component.scss',
})
export class ExpansionListComponent {
  /** Expansions to display. */
  @Input({ required: true }) expansions!: ExpansionDetail[];
}
