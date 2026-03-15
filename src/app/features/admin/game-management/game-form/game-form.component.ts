import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  signal,
  SimpleChanges,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ComplexityLevel, GameCreate, GameDetail } from '../../../../models/game.model';

/** Complexity levels for the dropdown. */
const COMPLEXITY_OPTIONS: { value: ComplexityLevel; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'medium', label: 'Medium' },
  { value: 'heavy', label: 'Heavy' },
];

/**
 * Shared game form for create and edit operations.
 *
 * Presentational component that renders a reactive form with all game
 * metadata fields. Accepts an optional game input for edit mode
 * (pre-populates form). Emits form data on submit and a cancel event.
 */
@Component({
  selector: 'app-game-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './game-form.component.html',
  styleUrl: './game-form.component.scss',
})
export class GameFormComponent implements OnChanges {
  private readonly fb = new FormBuilder();

  /** Existing game data for edit mode. Null for create mode. */
  @Input() game: GameDetail | null = null;

  /** Label for the submit button (e.g. "Create Game" or "Save Changes"). */
  @Input() submitLabel = 'Create Game';

  /** Whether the form is currently submitting. */
  @Input() submitting = false;

  /** Emitted with form data when the user submits. */
  @Output() formSubmitted = new EventEmitter<GameCreate>();

  /** Emitted when the user cancels. */
  @Output() cancelled = new EventEmitter<void>();

  /** Available complexity options for the dropdown. */
  readonly complexityOptions = COMPLEXITY_OPTIONS;

  /** Current tags managed outside the reactive form. */
  readonly tags = signal<string[]>([]);

  /** Current tag input value. */
  readonly tagInput = signal('');

  /** Reactive form definition. */
  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(200)]],
    publisher: [''],
    year_published: [null as number | null],
    edition: [''],
    min_players: [null as number | null, [Validators.min(1)]],
    max_players: [null as number | null, [Validators.min(1)]],
    description: [''],
    complexity: [null as ComplexityLevel | null],
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['game'] && this.game) {
      this.populateForm(this.game);
    }
  }

  /** Handle form submission. */
  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (!this.validatePlayerRange()) {
      return;
    }

    const raw = this.form.getRawValue();
    const payload: GameCreate = {
      name: raw.name!.trim(),
    };

    if (raw.publisher?.trim()) {
      payload.publisher = raw.publisher.trim();
    }
    if (raw.year_published != null) {
      payload.year_published = raw.year_published;
    }
    if (raw.edition?.trim()) {
      payload.edition = raw.edition.trim();
    }
    if (raw.min_players != null) {
      payload.min_players = raw.min_players;
    }
    if (raw.max_players != null) {
      payload.max_players = raw.max_players;
    }
    if (raw.description?.trim()) {
      payload.description = raw.description.trim();
    }
    if (raw.complexity) {
      payload.complexity = raw.complexity;
    }

    const currentTags = this.tags();
    if (currentTags.length > 0) {
      payload.tags = currentTags;
    }

    this.formSubmitted.emit(payload);
  }

  /** Handle cancel action. */
  onCancel(): void {
    this.cancelled.emit();
  }

  /** Add a tag from the input. */
  addTag(event: Event): void {
    event.preventDefault();
    const value = this.tagInput().trim().toLowerCase();
    if (value && !this.tags().includes(value)) {
      this.tags.update((t) => [...t, value]);
    }
    this.tagInput.set('');
  }

  /** Remove a tag by value. */
  removeTag(tag: string): void {
    this.tags.update((t) => t.filter((v) => v !== tag));
  }

  /** Update tag input value. */
  onTagInputChange(value: string): void {
    this.tagInput.set(value);
  }

  /** Check if a form field has an error and has been touched. */
  hasError(field: string): boolean {
    const control = this.form.get(field);
    return !!control && control.invalid && control.touched;
  }

  /** Whether min_players exceeds max_players. */
  readonly playerRangeError = signal(false);

  /** Validate that min_players <= max_players. */
  private validatePlayerRange(): boolean {
    const min = this.form.get('min_players')?.value;
    const max = this.form.get('max_players')?.value;

    if (min != null && max != null && min > max) {
      this.playerRangeError.set(true);
      return false;
    }

    this.playerRangeError.set(false);
    return true;
  }

  /** Pre-populate form with existing game data. */
  private populateForm(game: GameDetail): void {
    this.form.patchValue({
      name: game.name,
      publisher: game.publisher ?? '',
      year_published: game.year_published,
      edition: game.edition ?? '',
      min_players: game.min_players,
      max_players: game.max_players,
      description: game.description ?? '',
      complexity: game.complexity,
    });
    this.tags.set([...game.tags]);
  }
}
