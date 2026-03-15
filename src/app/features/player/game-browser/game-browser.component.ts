import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { PaginationMeta } from '../../../models/api.model';
import { GameFilters, GameSummary, TagCount } from '../../../models/game.model';
import { GameService } from '../../../core/services/game.service';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ErrorBannerComponent } from '../../../shared/components/error-banner/error-banner.component';
import { GameCardComponent } from '../../../shared/components/game-card/game-card.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { GameFilterComponent } from '../game-filter/game-filter.component';

/**
 * Game browser view for discovering and browsing games.
 *
 * Displays a responsive grid of game cards with search, filtering,
 * sorting, and pagination. Navigates to game detail on card click.
 *
 * Route: /games
 */
@Component({
  selector: 'app-game-browser',
  standalone: true,
  imports: [
    EmptyStateComponent,
    ErrorBannerComponent,
    GameCardComponent,
    GameFilterComponent,
    LoadingSpinnerComponent,
    PaginationComponent,
  ],
  templateUrl: './game-browser.component.html',
  styleUrl: './game-browser.component.scss',
})
export class GameBrowserComponent implements OnInit {
  private readonly gameService = inject(GameService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  /** Games loaded from the API. */
  readonly games = signal<GameSummary[]>([]);

  /** Pagination metadata for the current result set. */
  readonly pagination = signal<PaginationMeta | null>(null);

  /** Available tags for filter chips. */
  readonly availableTags = signal<TagCount[]>([]);

  /** Whether initial data is loading. */
  readonly loading = signal(true);

  /** Error message from the last failed operation. */
  readonly error = signal<string | null>(null);

  /** Current active filters (excluding page). */
  private currentFilters: GameFilters = {};

  /** Whether any user-initiated filters are active. */
  readonly hasActiveFilters = signal(false);

  ngOnInit(): void {
    this.loadInitialData();
  }

  /** Handle filter changes from the filter component. */
  onFiltersChanged(filters: GameFilters): void {
    this.currentFilters = filters;
    this.hasActiveFilters.set(this.isFiltered(filters));
    this.loadGames(1);
  }

  /** Handle page changes from the pagination component. */
  onPageChange(page: number): void {
    this.loadGames(page);
  }

  /** Navigate to a game's detail view. */
  onGameSelected(game: GameSummary): void {
    this.router.navigate(['/games', game.id]);
  }

  /** Dismiss the error banner. */
  dismissError(): void {
    this.error.set(null);
  }

  /** Load initial data: games list and available tags in parallel. */
  private loadInitialData(): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      games: this.gameService.listGames(),
      tags: this.gameService.getTags().pipe(catchError(() => of([] as TagCount[]))),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ games, tags }) => {
          this.games.set(games.data);
          this.pagination.set(games.pagination);
          this.availableTags.set(tags);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Failed to load games. Please try again.');
          this.loading.set(false);
        },
      });
  }

  /** Load games with current filters and specified page. */
  private loadGames(page: number): void {
    this.loading.set(true);
    this.error.set(null);

    const filters: GameFilters = { ...this.currentFilters, page };

    this.gameService
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

  /** Check if any filter value is set. */
  private isFiltered(filters: GameFilters): boolean {
    return !!(
      filters.search ||
      filters.player_count != null ||
      (filters.complexity && filters.complexity.length > 0) ||
      (filters.tags && filters.tags.length > 0)
    );
  }
}
