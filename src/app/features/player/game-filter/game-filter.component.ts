import {
  Component,
  DestroyRef,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { ComplexityLevel, GameFilters, GameSortOption, TagCount } from '../../../models/game.model';

/** Debounce delay for search input in milliseconds. */
const SEARCH_DEBOUNCE_MS = 300;

/** Available sort options for display. */
interface SortDisplayOption {
  value: GameSortOption;
  label: string;
}

/** Available sort options in display order. */
const SORT_OPTIONS: SortDisplayOption[] = [
  { value: 'name', label: 'Name (A-Z)' },
  { value: '-updated_at', label: 'Recently Updated' },
  { value: '-created_at', label: 'Recently Added' },
];

/** Complexity levels available for filtering. */
const COMPLEXITY_LEVELS: ComplexityLevel[] = ['light', 'medium', 'heavy'];

/**
 * Filter panel for the game browser.
 *
 * Provides search (debounced 300ms), player count input, complexity
 * chip toggles (multi-select), tag filter chips (from API), and sort
 * dropdown. Emits filter changes via the filtersChanged output.
 *
 * Collapses into a filter toggle button on mobile viewports.
 */
@Component({
  selector: 'app-game-filter',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './game-filter.component.html',
  styleUrl: './game-filter.component.scss',
})
export class GameFilterComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly searchSubject = new Subject<string>();

  /** Available tags from the API. */
  @Input() availableTags: TagCount[] = [];

  /** Emitted when any filter value changes. */
  @Output() filtersChanged = new EventEmitter<GameFilters>();

  /** Expose sort options to the template. */
  readonly sortOptions = SORT_OPTIONS;

  /** Expose complexity levels to the template. */
  readonly complexityLevels = COMPLEXITY_LEVELS;

  /** Current search text (bound to input). */
  readonly searchText = signal('');

  /** Current player count filter (null = not set). */
  readonly playerCount = signal<number | null>(null);

  /** Currently selected complexity levels. */
  readonly selectedComplexity = signal<Set<ComplexityLevel>>(new Set());

  /** Currently selected tags. */
  readonly selectedTags = signal<Set<string>>(new Set());

  /** Current sort option. */
  readonly currentSort = signal<GameSortOption>('name');

  /** Whether the filter panel is expanded (mobile). */
  readonly filtersExpanded = signal(false);

  /** Whether any filter is active (for showing clear button). */
  get hasActiveFilters(): boolean {
    return (
      this.searchText() !== '' ||
      this.playerCount() != null ||
      this.selectedComplexity().size > 0 ||
      this.selectedTags().size > 0
    );
  }

  ngOnInit(): void {
    this.searchSubject
      .pipe(
        debounceTime(SEARCH_DEBOUNCE_MS),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((search) => {
        this.searchText.set(search);
        this.emitFilters();
      });
  }

  /** Handle search input changes. */
  onSearchInput(value: string): void {
    this.searchSubject.next(value);
  }

  /** Handle player count input changes. */
  onPlayerCountChange(value: string): void {
    const parsed = parseInt(value, 10);
    this.playerCount.set(isNaN(parsed) || parsed <= 0 ? null : parsed);
    this.emitFilters();
  }

  /** Toggle a complexity level in the multi-select. */
  toggleComplexity(level: ComplexityLevel): void {
    const current = new Set(this.selectedComplexity());
    if (current.has(level)) {
      current.delete(level);
    } else {
      current.add(level);
    }
    this.selectedComplexity.set(current);
    this.emitFilters();
  }

  /** Check if a complexity level is selected. */
  isComplexitySelected(level: ComplexityLevel): boolean {
    return this.selectedComplexity().has(level);
  }

  /** Toggle a tag in the multi-select. */
  toggleTag(tag: string): void {
    const current = new Set(this.selectedTags());
    if (current.has(tag)) {
      current.delete(tag);
    } else {
      current.add(tag);
    }
    this.selectedTags.set(current);
    this.emitFilters();
  }

  /** Check if a tag is selected. */
  isTagSelected(tag: string): boolean {
    return this.selectedTags().has(tag);
  }

  /** Handle sort option changes. */
  onSortChange(value: string): void {
    this.currentSort.set(value as GameSortOption);
    this.emitFilters();
  }

  /** Clear all filters. */
  clearFilters(): void {
    this.searchText.set('');
    this.playerCount.set(null);
    this.selectedComplexity.set(new Set());
    this.selectedTags.set(new Set());
    this.emitFilters();
  }

  /** Toggle filter panel visibility (mobile). */
  toggleFilters(): void {
    this.filtersExpanded.update((v) => !v);
  }

  /** Capitalise a complexity level for display. */
  capitalise(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  /** Build and emit the current filter state. */
  private emitFilters(): void {
    const filters: GameFilters = {};

    const search = this.searchText();
    if (search) {
      filters.search = search;
    }

    const playerCount = this.playerCount();
    if (playerCount != null) {
      filters.player_count = playerCount;
    }

    const complexity = Array.from(this.selectedComplexity());
    if (complexity.length > 0) {
      filters.complexity = complexity;
    }

    const tags = Array.from(this.selectedTags());
    if (tags.length > 0) {
      filters.tags = tags;
    }

    const sort = this.currentSort();
    if (sort !== 'name') {
      filters.sort = sort;
    }

    this.filtersChanged.emit(filters);
  }
}
