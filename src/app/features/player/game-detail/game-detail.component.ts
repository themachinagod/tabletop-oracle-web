import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { GameDetail } from '../../../models/game.model';
import { GameService } from '../../../core/services/game.service';
import { ComplexityBadgeComponent } from '../../../shared/components/complexity-badge/complexity-badge.component';
import { ErrorBannerComponent } from '../../../shared/components/error-banner/error-banner.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { TagChipComponent } from '../../../shared/components/tag-chip/tag-chip.component';
import { ExpansionListComponent } from '../expansion-list/expansion-list.component';

/**
 * Full game detail view.
 *
 * Displays cover image, metadata (name, publisher, year, edition,
 * player count, complexity, tags), description, expansions list,
 * document count indicator, and a "Start Session" action button.
 *
 * Route: /games/:gameId
 */
@Component({
  selector: 'app-game-detail',
  standalone: true,
  imports: [
    ComplexityBadgeComponent,
    ErrorBannerComponent,
    ExpansionListComponent,
    LoadingSpinnerComponent,
    TagChipComponent,
  ],
  templateUrl: './game-detail.component.html',
  styleUrl: './game-detail.component.scss',
})
export class GameDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly gameService = inject(GameService);
  private readonly destroyRef = inject(DestroyRef);

  /** Loaded game detail. */
  readonly game = signal<GameDetail | null>(null);

  /** Whether data is loading. */
  readonly loading = signal(true);

  /** Error message from the last failed operation. */
  readonly error = signal<string | null>(null);

  /** Formatted player count range string. */
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

  /** Publisher and year formatted. */
  get publisherYear(): string | null {
    const game = this.game();
    if (!game) {
      return null;
    }
    const parts: string[] = [];
    if (game.publisher) {
      parts.push(game.publisher);
    }
    if (game.year_published) {
      parts.push(`(${game.year_published})`);
    }
    return parts.length > 0 ? parts.join(' ') : null;
  }

  ngOnInit(): void {
    const gameId = this.route.snapshot.paramMap.get('gameId');
    if (!gameId) {
      this.error.set('Game not found.');
      this.loading.set(false);
      return;
    }
    this.loadGame(gameId);
  }

  /** Navigate to session setup for this game. */
  startSession(): void {
    const game = this.game();
    if (game) {
      this.router.navigate(['/games', game.id, 'new-session']);
    }
  }

  /** Navigate back to the game browser. */
  goBack(): void {
    this.router.navigate(['/games']);
  }

  /** Dismiss the error banner. */
  dismissError(): void {
    this.error.set(null);
  }

  /** Load game detail from the API. */
  private loadGame(gameId: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.gameService
      .getGame(gameId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (game) => {
          this.game.set(game);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Failed to load game details. Please try again.');
          this.loading.set(false);
        },
      });
  }
}
