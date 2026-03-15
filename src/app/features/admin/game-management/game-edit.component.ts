import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { GameCreate, GameDetail } from '../../../models/game.model';
import { AdminGameService } from '../../../core/services/admin-game.service';
import { ErrorBannerComponent } from '../../../shared/components/error-banner/error-banner.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { GameFormComponent } from './game-form/game-form.component';

/**
 * Game edit page.
 *
 * Smart component that loads an existing game and wraps GameFormComponent
 * in edit mode. Handles the update API call and navigates to the game
 * detail view on success.
 *
 * Route: /admin/games/:gameId/edit
 */
@Component({
  selector: 'app-game-edit',
  standalone: true,
  imports: [ErrorBannerComponent, GameFormComponent, LoadingSpinnerComponent],
  template: `
    <section class="game-edit">
      <h1 class="game-edit__title">Edit Game</h1>

      @if (error()) {
        <app-error-banner [message]="error()!" (dismissed)="error.set(null)" />
      }

      @if (loading()) {
        <app-loading-spinner message="Loading game..." />
      } @else if (game()) {
        <app-game-form
          [game]="game()"
          submitLabel="Save Changes"
          [submitting]="submitting()"
          (formSubmitted)="onUpdate($event)"
          (cancelled)="onCancel()"
        />
      }
    </section>
  `,
  styles: `
    @use 'variables' as *;
    @use 'typography' as *;

    .game-edit {
      padding: $spacing-lg;
    }

    .game-edit__title {
      @include heading-xl;
      color: $color-text-primary;
      margin: 0 0 $spacing-lg;
    }
  `,
})
export class GameEditComponent implements OnInit {
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

  /** Whether the form is currently submitting. */
  readonly submitting = signal(false);

  /** Game ID from route params. */
  private gameId = '';

  ngOnInit(): void {
    this.gameId = this.route.snapshot.paramMap.get('gameId') ?? '';
    this.loadGame();
  }

  /** Handle form submission — update the game. */
  onUpdate(payload: GameCreate): void {
    this.submitting.set(true);
    this.error.set(null);

    this.adminGameService
      .updateGame(this.gameId, payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.router.navigate(['/admin/games', this.gameId]);
        },
        error: () => {
          this.error.set('Failed to update game. Please try again.');
          this.submitting.set(false);
        },
      });
  }

  /** Handle cancel — navigate back to game detail. */
  onCancel(): void {
    this.router.navigate(['/admin/games', this.gameId]);
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
