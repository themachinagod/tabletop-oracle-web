import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { GameDetail } from '../../../models/game.model';
import { AdminGameService } from '../../../core/services/admin-game.service';
import { ComplexityBadgeComponent } from '../../../shared/components/complexity-badge/complexity-badge.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ErrorBannerComponent } from '../../../shared/components/error-banner/error-banner.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { TagChipComponent } from '../../../shared/components/tag-chip/tag-chip.component';
import { RelativeTimePipe } from '../../../shared/pipes/relative-time.pipe';

/** Available tab identifiers. */
type DetailTab = 'overview' | 'documents' | 'expansions';

/**
 * Admin game detail view with tabbed layout.
 *
 * Displays game metadata, actions (edit, archive/restore), and tabs
 * for overview, documents, and expansions. Documents and expansions
 * tabs are placeholders until tasks #39 and #40 are implemented.
 *
 * Route: /admin/games/:gameId
 */
@Component({
  selector: 'app-admin-game-detail',
  standalone: true,
  imports: [
    ComplexityBadgeComponent,
    ConfirmDialogComponent,
    ErrorBannerComponent,
    LoadingSpinnerComponent,
    RelativeTimePipe,
    TagChipComponent,
  ],
  templateUrl: './admin-game-detail.component.html',
  styleUrl: './admin-game-detail.component.scss',
})
export class AdminGameDetailComponent implements OnInit {
  private readonly adminGameService = inject(AdminGameService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  /** Loaded game data. */
  readonly game = signal<GameDetail | null>(null);

  /** Whether the game is loading. */
  readonly loading = signal(true);

  /** Error message from the last failed operation. */
  readonly error = signal<string | null>(null);

  /** Currently active tab. */
  readonly activeTab = signal<DetailTab>('overview');

  /** Whether the archive confirmation dialog is open. */
  readonly showArchiveDialog = signal(false);

  /** Whether the restore confirmation dialog is open. */
  readonly showRestoreDialog = signal(false);

  /** Whether an archive/restore operation is in progress. */
  readonly actionInProgress = signal(false);

  /** Game ID from route params. */
  private gameId = '';

  ngOnInit(): void {
    this.gameId = this.route.snapshot.paramMap.get('gameId') ?? '';
    this.loadGame();
  }

  /** Switch to a different tab. */
  selectTab(tab: DetailTab): void {
    this.activeTab.set(tab);
  }

  /** Navigate to the edit form. */
  editGame(): void {
    this.router.navigate(['/admin/games', this.gameId, 'edit']);
  }

  /** Navigate back to the game list. */
  goBack(): void {
    this.router.navigate(['/admin']);
  }

  /** Open the archive confirmation dialog. */
  confirmArchive(): void {
    this.showArchiveDialog.set(true);
  }

  /** Open the restore confirmation dialog. */
  confirmRestore(): void {
    this.showRestoreDialog.set(true);
  }

  /** Execute archive after confirmation. */
  onArchiveConfirmed(): void {
    this.showArchiveDialog.set(false);
    this.actionInProgress.set(true);
    this.error.set(null);

    this.adminGameService
      .archiveGame(this.gameId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (game) => {
          this.game.set(game);
          this.actionInProgress.set(false);
        },
        error: () => {
          this.error.set('Failed to archive game. Please try again.');
          this.actionInProgress.set(false);
        },
      });
  }

  /** Execute restore after confirmation. */
  onRestoreConfirmed(): void {
    this.showRestoreDialog.set(false);
    this.actionInProgress.set(true);
    this.error.set(null);

    this.adminGameService
      .restoreGame(this.gameId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (game) => {
          this.game.set(game);
          this.actionInProgress.set(false);
        },
        error: () => {
          this.error.set('Failed to restore game. Please try again.');
          this.actionInProgress.set(false);
        },
      });
  }

  /** Cancel the archive dialog. */
  onArchiveCancelled(): void {
    this.showArchiveDialog.set(false);
  }

  /** Cancel the restore dialog. */
  onRestoreCancelled(): void {
    this.showRestoreDialog.set(false);
  }

  /** Dismiss the error banner. */
  dismissError(): void {
    this.error.set(null);
  }

  /** Format player count range for display. */
  get playerCountDisplay(): string | null {
    const game = this.game();
    if (!game || game.min_players == null || game.max_players == null) {
      return null;
    }
    if (game.min_players === game.max_players) {
      return `${game.min_players} players`;
    }
    return `${game.min_players}-${game.max_players} players`;
  }

  /** Load game data from the API. */
  private loadGame(): void {
    this.loading.set(true);
    this.error.set(null);

    this.adminGameService
      .getGame(this.gameId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (game) => {
          this.game.set(game);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Failed to load game. Please try again.');
          this.loading.set(false);
        },
      });
  }
}
