import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { GameCreate } from '../../../models/game.model';
import { AdminGameService } from '../../../core/services/admin-game.service';
import { ErrorBannerComponent } from '../../../shared/components/error-banner/error-banner.component';
import { GameFormComponent } from './game-form/game-form.component';

/**
 * Game creation page.
 *
 * Smart component wrapping GameFormComponent. Handles the create API
 * call and navigates to the new game's detail view on success.
 *
 * Route: /admin/games/new
 */
@Component({
  selector: 'app-game-create',
  standalone: true,
  imports: [ErrorBannerComponent, GameFormComponent],
  template: `
    <section class="game-create">
      <h1 class="game-create__title">Create Game</h1>

      @if (error()) {
        <app-error-banner [message]="error()!" (dismissed)="error.set(null)" />
      }

      <app-game-form
        submitLabel="Create Game"
        [submitting]="submitting()"
        (formSubmitted)="onCreate($event)"
        (cancelled)="onCancel()"
      />
    </section>
  `,
  styles: `
    @use 'variables' as *;
    @use 'typography' as *;

    .game-create {
      padding: $spacing-lg;
    }

    .game-create__title {
      @include heading-xl;
      color: $color-text-primary;
      margin: 0 0 $spacing-lg;
    }
  `,
})
export class GameCreateComponent {
  private readonly adminGameService = inject(AdminGameService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  /** Error message from the last failed operation. */
  readonly error = signal<string | null>(null);

  /** Whether the form is currently submitting. */
  readonly submitting = signal(false);

  /** Handle form submission — create the game. */
  onCreate(payload: GameCreate): void {
    this.submitting.set(true);
    this.error.set(null);

    this.adminGameService
      .createGame(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (game) => {
          this.submitting.set(false);
          this.router.navigate(['/admin/games', game.id]);
        },
        error: () => {
          this.error.set('Failed to create game. Please try again.');
          this.submitting.set(false);
        },
      });
  }

  /** Handle cancel — navigate back to game list. */
  onCancel(): void {
    this.router.navigate(['/admin']);
  }
}
