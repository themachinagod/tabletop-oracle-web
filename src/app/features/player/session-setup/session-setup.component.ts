import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { GameDetail } from '../../../models/game.model';
import { SessionCreate } from '../../../models/session.model';
import { GameService } from '../../../core/services/game.service';
import { SessionService } from '../../../core/services/session.service';
import { ErrorBannerComponent } from '../../../shared/components/error-banner/error-banner.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ExpansionSelectionComponent } from './expansion-selection.component';
import { PlayerCountInputComponent } from './player-count-input.component';

/**
 * Session setup and configuration view.
 *
 * Allows the player to configure a new game session: select expansions,
 * set player count, name the session, and create it. On successful
 * creation, navigates to the chat view.
 *
 * Route: /games/:gameId/new-session
 */
@Component({
  selector: 'app-session-setup',
  standalone: true,
  imports: [
    ErrorBannerComponent,
    ExpansionSelectionComponent,
    LoadingSpinnerComponent,
    PlayerCountInputComponent,
  ],
  templateUrl: './session-setup.component.html',
  styleUrl: './session-setup.component.scss',
})
export class SessionSetupComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly gameService = inject(GameService);
  private readonly sessionService = inject(SessionService);
  private readonly destroyRef = inject(DestroyRef);

  /** Loaded game detail. */
  readonly game = signal<GameDetail | null>(null);

  /** Whether the game data is loading. */
  readonly loading = signal(true);

  /** Whether session creation is in progress. */
  readonly creating = signal(false);

  /** Error message from the last failed operation. */
  readonly error = signal<string | null>(null);

  /** Selected expansion IDs. */
  readonly selectedExpansionIds = signal<string[]>([]);

  /** Player count (null = not specified). */
  readonly playerCount = signal<number | null>(null);

  /** Session display name. */
  readonly sessionName = signal('');

  ngOnInit(): void {
    const gameId = this.route.snapshot.paramMap.get('gameId');
    if (!gameId) {
      this.error.set('Game not found.');
      this.loading.set(false);
      return;
    }
    this.loadGame(gameId);
  }

  /** Update selected expansion IDs. */
  onExpansionChange(ids: string[]): void {
    this.selectedExpansionIds.set(ids);
  }

  /** Update player count. */
  onPlayerCountChange(count: number | null): void {
    this.playerCount.set(count);
  }

  /** Update session name from text input. */
  onNameInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.sessionName.set(input.value);
  }

  /** Create the session and navigate to chat. */
  startSession(): void {
    const game = this.game();
    if (!game || this.creating()) {
      return;
    }

    const name = this.sessionName().trim();
    if (!name) {
      this.error.set('Please enter a session name.');
      return;
    }

    this.creating.set(true);
    this.error.set(null);

    const payload: SessionCreate = {
      game_id: game.id,
      expansion_ids: this.selectedExpansionIds(),
      name,
    };

    const playerCount = this.playerCount();
    if (playerCount != null) {
      payload.player_count = playerCount;
    }

    this.sessionService
      .createSession(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (session) => {
          this.router.navigate(['/sessions', session.id]);
        },
        error: () => {
          this.error.set('Failed to create session. Please try again.');
          this.creating.set(false);
        },
      });
  }

  /** Navigate back to the game detail view. */
  goBack(): void {
    const game = this.game();
    if (game) {
      this.router.navigate(['/games', game.id]);
    } else {
      this.router.navigate(['/games']);
    }
  }

  /** Dismiss the error banner. */
  dismissError(): void {
    this.error.set(null);
  }

  /** Generate default session name from game name and current date. */
  private generateDefaultName(gameName: string): string {
    const now = new Date();
    const formatted = now.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    return `${gameName} -- ${formatted}`;
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
          if (!game.is_active) {
            this.error.set('This game is not currently available.');
            this.loading.set(false);
            return;
          }
          this.game.set(game);
          this.sessionName.set(this.generateDefaultName(game.name));
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Failed to load game details. Please try again.');
          this.loading.set(false);
        },
      });
  }
}
