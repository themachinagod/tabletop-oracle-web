import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { PaginationMeta } from '../../../models/api.model';
import { AdminGameFilters, AdminGameStatus, GameSummary } from '../../../models/game.model';
import { AdminGameService } from '../../../core/services/admin-game.service';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ErrorBannerComponent } from '../../../shared/components/error-banner/error-banner.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { RelativeTimePipe } from '../../../shared/pipes/relative-time.pipe';

/** Debounce delay for search input in milliseconds. */
const SEARCH_DEBOUNCE_MS = 300;

/** Status filter display options. */
interface StatusOption {
  value: AdminGameStatus;
  label: string;
}

/** Available status filter options. */
const STATUS_OPTIONS: StatusOption[] = [
  { value: 'active', label: 'Active' },
  { value: 'archived', label: 'Archived' },
  { value: 'all', label: 'All' },
];

/**
 * Admin home view — game library management entry point.
 *
 * Displays a paginated table of games with search, status filter,
 * and actions (view, edit, archive/restore). Default view for curators
 * at /admin.
 *
 * Route: /admin
 */
@Component({
  selector: 'app-admin-home',
  standalone: true,
  imports: [
    FormsModule,
    EmptyStateComponent,
    ErrorBannerComponent,
    LoadingSpinnerComponent,
    PaginationComponent,
    RelativeTimePipe,
  ],
  templateUrl: './admin-home.component.html',
  styleUrl: './admin-home.component.scss',
})
export class AdminHomeComponent implements OnInit {
  private readonly adminGameService = inject(AdminGameService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly searchSubject = new Subject<string>();

  /** Games loaded from the API. */
  readonly games = signal<GameSummary[]>([]);

  /** Pagination metadata for the current result set. */
  readonly pagination = signal<PaginationMeta | null>(null);

  /** Whether data is loading. */
  readonly loading = signal(true);

  /** Error message from the last failed operation. */
  readonly error = signal<string | null>(null);

  /** Current search text. */
  readonly searchText = signal('');

  /** Current status filter. */
  readonly statusFilter = signal<AdminGameStatus>('active');

  /** Available status filter options. */
  readonly statusOptions = STATUS_OPTIONS;

  /** Whether any user-initiated search/filter is active. */
  readonly hasActiveFilters = signal(false);

  ngOnInit(): void {
    this.searchSubject
      .pipe(
        debounceTime(SEARCH_DEBOUNCE_MS),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((search) => {
        this.searchText.set(search);
        this.hasActiveFilters.set(search.length > 0 || this.statusFilter() !== 'active');
        this.loadGames(1);
      });

    this.loadGames(1);
  }

  /** Handle search input changes. */
  onSearchInput(value: string): void {
    this.searchSubject.next(value);
  }

  /** Handle status filter changes. */
  onStatusChange(status: string): void {
    const adminStatus = status as AdminGameStatus;
    this.statusFilter.set(adminStatus);
    this.hasActiveFilters.set(this.searchText().length > 0 || adminStatus !== 'active');
    this.loadGames(1);
  }

  /** Handle page changes from the pagination component. */
  onPageChange(page: number): void {
    this.loadGames(page);
  }

  /** Navigate to game detail view. */
  viewGame(game: GameSummary): void {
    this.router.navigate(['/admin/games', game.id]);
  }

  /** Navigate to game edit form. */
  editGame(game: GameSummary, event: Event): void {
    event.stopPropagation();
    this.router.navigate(['/admin/games', game.id, 'edit']);
  }

  /** Navigate to game creation form. */
  createGame(): void {
    this.router.navigate(['/admin/games/new']);
  }

  /** Dismiss the error banner. */
  dismissError(): void {
    this.error.set(null);
  }

  /** Load games with current filters and specified page. */
  private loadGames(page: number): void {
    this.loading.set(true);
    this.error.set(null);

    const filters: AdminGameFilters = {
      search: this.searchText() || undefined,
      status: this.statusFilter(),
      sort: '-updated_at',
      page,
    };

    this.adminGameService
      .listGames(filters)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.games.set(result.data);
          this.pagination.set(result.pagination);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Failed to load games. Please try again.');
          this.loading.set(false);
        },
      });
  }
}
