import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { PaginationMeta } from '../../../models/api.model';
import { SessionFilters, SessionSummary } from '../../../models/session.model';
import { SessionService } from '../../../core/services/session.service';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ErrorBannerComponent } from '../../../shared/components/error-banner/error-banner.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { SessionListComponent } from '../session-list/session-list.component';

/** Unique game entry extracted from session data for the filter dropdown. */
interface GameFilterOption {
  id: string;
  name: string;
}

/**
 * Play Home view — the player's entry point.
 *
 * Displays active sessions ordered by last activity, with game filtering,
 * archived session toggle, empty states, and navigation to session chat
 * or the Game Browser.
 *
 * Route: / (player home)
 */
@Component({
  selector: 'app-play-home',
  standalone: true,
  imports: [
    SessionListComponent,
    EmptyStateComponent,
    ErrorBannerComponent,
    LoadingSpinnerComponent,
    PaginationComponent,
  ],
  templateUrl: './play-home.component.html',
  styleUrl: './play-home.component.scss',
})
export class PlayHomeComponent implements OnInit {
  private readonly sessionService = inject(SessionService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  /** Active sessions loaded from the API. */
  readonly activeSessions = signal<SessionSummary[]>([]);

  /** Archived sessions loaded when the toggle is on. */
  readonly archivedSessions = signal<SessionSummary[]>([]);

  /** Pagination metadata for active sessions. */
  readonly activePagination = signal<PaginationMeta | null>(null);

  /** Whether initial data is loading. */
  readonly loading = signal(true);

  /** Whether archived sessions are currently loading. */
  readonly archivedLoading = signal(false);

  /** Error message from the last failed operation. */
  readonly error = signal<string | null>(null);

  /** Whether the "Show Archived" toggle is on. */
  readonly showArchived = signal(false);

  /** Currently selected game filter ID (empty string = all games). */
  readonly selectedGameId = signal('');

  /** Whether the system has no games at all (distinct from no sessions). */
  readonly noGamesExist = signal(false);

  /** Game filter options extracted from active sessions. */
  readonly gameFilterOptions = computed<GameFilterOption[]>(() => {
    const sessions = this.activeSessions();
    const gameMap = new Map<string, string>();
    for (const session of sessions) {
      if (!gameMap.has(session.game_id)) {
        gameMap.set(session.game_id, session.game_name);
      }
    }
    return Array.from(gameMap.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  });

  /** Whether to show the "no active sessions" empty state. */
  readonly showNoSessionsState = computed(
    () =>
      !this.loading() &&
      !this.error() &&
      this.activeSessions().length === 0 &&
      !this.noGamesExist(),
  );

  /** Whether to show the "no games exist" empty state. */
  readonly showNoGamesState = computed(
    () => !this.loading() && !this.error() && this.noGamesExist(),
  );

  ngOnInit(): void {
    this.loadActiveSessions();
  }

  /** Load active sessions with current filter and page. */
  loadActiveSessions(page = 1): void {
    this.loading.set(true);
    this.error.set(null);

    const filters: SessionFilters = {
      status: 'active',
      sort: '-last_active_at',
      page,
    };

    if (this.selectedGameId()) {
      filters.game_id = this.selectedGameId();
    }

    this.sessionService
      .listSessions(filters)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.activeSessions.set(result.data);
          this.activePagination.set(result.pagination);
          this.loading.set(false);

          // If no sessions and no filter applied, check if system has games
          if (result.data.length === 0 && !this.selectedGameId()) {
            this.checkForGames();
          } else {
            this.noGamesExist.set(false);
          }
        },
        error: () => {
          this.error.set('Failed to load sessions. Please try again.');
          this.loading.set(false);
        },
      });
  }

  /** Toggle visibility of archived sessions. */
  toggleArchived(): void {
    const newValue = !this.showArchived();
    this.showArchived.set(newValue);

    if (newValue) {
      this.loadArchivedSessions();
    } else {
      this.archivedSessions.set([]);
    }
  }

  /** Handle game filter selection. */
  onGameFilterChange(gameId: string): void {
    this.selectedGameId.set(gameId);
    this.loadActiveSessions();

    if (this.showArchived()) {
      this.loadArchivedSessions();
    }
  }

  /** Navigate to a session's chat view. */
  onSessionSelected(session: SessionSummary): void {
    this.router.navigate(['/sessions', session.id]);
  }

  /** Restore an archived session to active status. */
  onRestoreSession(session: SessionSummary): void {
    this.sessionService
      .updateSessionStatus(session.id, 'active')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.loadActiveSessions();
          if (this.showArchived()) {
            this.loadArchivedSessions();
          }
        },
        error: () => {
          this.error.set('Failed to restore session. Please try again.');
        },
      });
  }

  /** Navigate to the Game Browser. */
  navigateToGames(): void {
    this.router.navigate(['/games']);
  }

  /** Handle page change for active sessions. */
  onPageChange(page: number): void {
    this.loadActiveSessions(page);
  }

  /** Dismiss the error banner. */
  dismissError(): void {
    this.error.set(null);
  }

  /**
   * Check whether any games exist in the system.
   *
   * When no active sessions are found (with no game filter), we
   * perform a minimal session list request. If zero results come
   * back for all statuses with no filter, the system likely has
   * no games (or no sessions). We detect "no games" as a distinct
   * state for the appropriate empty message.
   *
   * In a full implementation this would call a GameService.listGames()
   * endpoint. Since GameService isn't built yet, we infer from
   * session data: if there are zero sessions with any status and
   * no filter, no games have been played — we show the "no games" state.
   */
  private checkForGames(): void {
    this.sessionService
      .listSessions({ page: 1, page_size: 1 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.noGamesExist.set(result.pagination.total_items === 0);
        },
        error: () => {
          // If the check fails, default to "no sessions" state
          this.noGamesExist.set(false);
        },
      });
  }

  /** Load archived sessions with current game filter. */
  private loadArchivedSessions(): void {
    this.archivedLoading.set(true);

    const filters: SessionFilters = {
      status: 'archived',
      sort: '-last_active_at',
    };

    if (this.selectedGameId()) {
      filters.game_id = this.selectedGameId();
    }

    this.sessionService
      .listSessions(filters)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.archivedSessions.set(result.data);
          this.archivedLoading.set(false);
        },
        error: () => {
          this.error.set('Failed to load archived sessions.');
          this.archivedLoading.set(false);
        },
      });
  }
}
