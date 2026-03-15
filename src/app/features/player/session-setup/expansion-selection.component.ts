import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ExpansionDetail } from '../../../models/game.model';

/**
 * Expansion selection with checkboxes.
 *
 * Displays a list of game expansions as toggleable checkboxes.
 * The base game is always included and shown as a non-toggleable
 * indicator above the expansion list.
 */
@Component({
  selector: 'app-expansion-selection',
  standalone: true,
  template: `
    <fieldset class="expansion-selection">
      <legend class="expansion-selection__title">Expansions</legend>

      <div class="expansion-selection__base">
        <span class="expansion-selection__base-check" aria-hidden="true">&#x2713;</span>
        <span class="expansion-selection__base-label">Base Game (always included)</span>
      </div>

      @for (expansion of expansions; track expansion.id) {
        <label class="expansion-selection__item">
          <input
            type="checkbox"
            class="expansion-selection__checkbox"
            [checked]="selectedIds.includes(expansion.id)"
            (change)="toggleExpansion(expansion.id)"
          />
          <div class="expansion-selection__content">
            <span class="expansion-selection__name">{{ expansion.name }}</span>
            @if (expansion.description) {
              <span class="expansion-selection__description">{{ expansion.description }}</span>
            }
          </div>
        </label>
      }
    </fieldset>
  `,
  styleUrl: './expansion-selection.component.scss',
})
export class ExpansionSelectionComponent {
  /** Available expansions for the game. */
  @Input({ required: true }) expansions!: ExpansionDetail[];

  /** Currently selected expansion IDs. */
  @Input() selectedIds: string[] = [];

  /** Emitted when the selection changes. */
  @Output() selectionChange = new EventEmitter<string[]>();

  /** Toggle an expansion in or out of the selection. */
  toggleExpansion(expansionId: string): void {
    const current = [...this.selectedIds];
    const index = current.indexOf(expansionId);

    if (index >= 0) {
      current.splice(index, 1);
    } else {
      current.push(expansionId);
    }

    this.selectionChange.emit(current);
  }
}
