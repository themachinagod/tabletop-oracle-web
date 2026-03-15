import { Component, EventEmitter, Input, Output } from '@angular/core';

/** Minimum allowed player count. */
const MIN_PLAYERS = 1;

/** Maximum allowed player count. */
const MAX_PLAYERS = 20;

/**
 * Number stepper input for player count.
 *
 * Provides increment/decrement buttons and a direct number input
 * within the 1-20 range. Value is optional — the player can clear
 * it to indicate "not specified".
 */
@Component({
  selector: 'app-player-count-input',
  standalone: true,
  template: `
    <div class="player-count">
      <label class="player-count__label" [for]="inputId">Player Count (optional)</label>
      <div class="player-count__controls">
        <button
          class="player-count__btn"
          type="button"
          [disabled]="!value || value <= minPlayers"
          (click)="decrement()"
          aria-label="Decrease player count"
        >
          &minus;
        </button>
        <input
          class="player-count__input"
          type="number"
          [id]="inputId"
          [value]="value ?? ''"
          [min]="minPlayers"
          [max]="maxPlayers"
          (input)="onInput($event)"
          placeholder="--"
        />
        <button
          class="player-count__btn"
          type="button"
          [disabled]="value !== null && value !== undefined && value >= maxPlayers"
          (click)="increment()"
          aria-label="Increase player count"
        >
          +
        </button>
      </div>
    </div>
  `,
  styleUrl: './player-count-input.component.scss',
})
export class PlayerCountInputComponent {
  /** Current player count value. Null means not specified. */
  @Input() value: number | null = null;

  /** Emitted when the player count changes. */
  @Output() valueChange = new EventEmitter<number | null>();

  /** Unique ID for the input element. */
  readonly inputId = 'player-count-input';

  readonly minPlayers = MIN_PLAYERS;
  readonly maxPlayers = MAX_PLAYERS;

  /** Decrease player count by 1. */
  decrement(): void {
    if (this.value != null && this.value > MIN_PLAYERS) {
      this.valueChange.emit(this.value - 1);
    }
  }

  /** Increase player count by 1. */
  increment(): void {
    if (this.value == null) {
      this.valueChange.emit(MIN_PLAYERS);
    } else if (this.value < MAX_PLAYERS) {
      this.valueChange.emit(this.value + 1);
    }
  }

  /** Handle direct input changes. */
  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const raw = input.value.trim();

    if (raw === '') {
      this.valueChange.emit(null);
      return;
    }

    const parsed = parseInt(raw, 10);
    if (isNaN(parsed)) {
      this.valueChange.emit(null);
      return;
    }

    const clamped = Math.min(MAX_PLAYERS, Math.max(MIN_PLAYERS, parsed));
    this.valueChange.emit(clamped);
  }
}
