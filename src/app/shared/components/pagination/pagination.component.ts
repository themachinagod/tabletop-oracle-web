import { Component, EventEmitter, Input, Output } from '@angular/core';
import { PaginationMeta } from '../../../models/api.model';

/**
 * Page navigation controls matching F001 pagination metadata.
 *
 * Displays current page, total pages, and prev/next buttons.
 * Emits a page change event with the new page number.
 */
@Component({
  selector: 'app-pagination',
  standalone: true,
  template: `
    <nav class="pagination" role="navigation" aria-label="Pagination">
      <button
        class="pagination__button"
        [disabled]="pagination.page <= 1"
        (click)="goToPage(pagination.page - 1)"
        aria-label="Previous page"
        type="button"
      >
        &lsaquo;
      </button>

      <span class="pagination__info">
        Page {{ pagination.page }} of {{ pagination.total_pages }}
      </span>

      <button
        class="pagination__button"
        [disabled]="pagination.page >= pagination.total_pages"
        (click)="goToPage(pagination.page + 1)"
        aria-label="Next page"
        type="button"
      >
        &rsaquo;
      </button>
    </nav>
  `,
  styleUrl: './pagination.component.scss',
})
export class PaginationComponent {
  /** Pagination metadata from the API response. */
  @Input({ required: true }) pagination!: PaginationMeta;

  /** Emitted with the requested page number. */
  @Output() pageChange = new EventEmitter<number>();

  /** Navigate to a specific page. */
  goToPage(page: number): void {
    if (page >= 1 && page <= this.pagination.total_pages) {
      this.pageChange.emit(page);
    }
  }
}
