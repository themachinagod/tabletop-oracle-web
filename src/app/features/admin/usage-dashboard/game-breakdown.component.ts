import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { GameUsage } from '../../../models/usage.model';

/**
 * Game breakdown table showing token usage per game.
 *
 * Displays query tokens, ingestion tokens, query count, and
 * total tokens (query + ingestion) sorted by total descending.
 */
@Component({
  selector: 'app-game-breakdown',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe],
  template: `
    <div class="breakdown">
      <h3 class="breakdown__title">Usage by Game</h3>
      <div class="breakdown__table-wrap">
        <table class="breakdown__table">
          <thead>
            <tr>
              <th>Game</th>
              <th class="breakdown__num">Query Tokens</th>
              <th class="breakdown__num">Ingestion Tokens</th>
              <th class="breakdown__num">Queries</th>
              <th class="breakdown__num">Total Tokens</th>
            </tr>
          </thead>
          <tbody>
            @for (row of sortedData(); track row.game_id) {
              <tr>
                <td>{{ row.game_name }}</td>
                <td class="breakdown__num">{{ row.query_tokens | number }}</td>
                <td class="breakdown__num">{{ row.ingestion_tokens | number }}</td>
                <td class="breakdown__num">{{ row.query_count | number }}</td>
                <td class="breakdown__num">
                  {{ row.query_tokens + row.ingestion_tokens | number }}
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styleUrl: './breakdown-table.component.scss',
})
export class GameBreakdownComponent {
  /** Game usage data from the API. */
  readonly data = input.required<GameUsage[]>();

  /** Data sorted by total tokens descending. */
  readonly sortedData = computed(() =>
    [...this.data()].sort(
      (a, b) => b.query_tokens + b.ingestion_tokens - (a.query_tokens + a.ingestion_tokens),
    ),
  );
}
