import { ChangeDetectionStrategy, Component } from '@angular/core';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

/**
 * Knowledge Graph summary placeholder.
 *
 * Stub for the Level 3 KG summary view. Blocked by EPIC-003
 * (Knowledge Graph Engine). Will display concept counts, association
 * counts, contributing documents, coverage indicators, and player
 * feedback summaries once the KG engine is designed and implemented.
 *
 * Route: /admin/knowledge-graph
 */
@Component({
  selector: 'app-kg-summary-placeholder',
  standalone: true,
  imports: [EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="stub-page">
      <h2 class="stub-page__title">Knowledge Graph</h2>
      <app-empty-state
        icon="🕸"
        message="Knowledge Graph summary is coming soon. This feature requires the Knowledge Graph Engine (EPIC-003) to be designed and implemented."
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
export class KgSummaryPlaceholderComponent {}
