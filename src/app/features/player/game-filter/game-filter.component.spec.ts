import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GameFilters, TagCount } from '../../../models/game.model';
import { GameFilterComponent } from './game-filter.component';

describe('GameFilterComponent', () => {
  let component: GameFilterComponent;
  let fixture: ComponentFixture<GameFilterComponent>;
  let emittedFilters: GameFilters[];

  const mockTags: TagCount[] = [
    { tag: 'strategy', count: 5 },
    { tag: 'party', count: 3 },
    { tag: 'cooperative', count: 2 },
  ];

  beforeEach(async () => {
    vi.useFakeTimers();

    await TestBed.configureTestingModule({
      imports: [GameFilterComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GameFilterComponent);
    component = fixture.componentInstance;
    emittedFilters = [];
    component.filtersChanged.subscribe((f: GameFilters) => emittedFilters.push(f));
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('search', () => {
    it('onSearchInput_WithText_EmitsFilterAfterDebounce', () => {
      component.onSearchInput('catan');
      vi.advanceTimersByTime(300);

      expect(emittedFilters.length).toBe(1);
      expect(emittedFilters[0].search).toBe('catan');
    });

    it('onSearchInput_RapidTyping_DebouncesProperly', () => {
      component.onSearchInput('c');
      vi.advanceTimersByTime(100);
      component.onSearchInput('ca');
      vi.advanceTimersByTime(100);
      component.onSearchInput('cat');
      vi.advanceTimersByTime(300);

      expect(emittedFilters.length).toBe(1);
      expect(emittedFilters[0].search).toBe('cat');
    });

    it('onSearchInput_SameValue_DoesNotReemit', () => {
      component.onSearchInput('catan');
      vi.advanceTimersByTime(300);
      component.onSearchInput('catan');
      vi.advanceTimersByTime(300);

      expect(emittedFilters.length).toBe(1);
    });

    it('onSearchInput_EmptyString_OmitsSearchFromFilters', () => {
      component.onSearchInput('catan');
      vi.advanceTimersByTime(300);
      component.onSearchInput('');
      vi.advanceTimersByTime(300);

      expect(emittedFilters.length).toBe(2);
      expect(emittedFilters[1].search).toBeUndefined();
    });
  });

  describe('player count', () => {
    it('onPlayerCountChange_ValidNumber_EmitsFilter', () => {
      component.onPlayerCountChange('4');

      expect(emittedFilters.length).toBe(1);
      expect(emittedFilters[0].player_count).toBe(4);
    });

    it('onPlayerCountChange_EmptyString_OmitsPlayerCount', () => {
      component.onPlayerCountChange('4');
      component.onPlayerCountChange('');

      expect(emittedFilters[1].player_count).toBeUndefined();
    });

    it('onPlayerCountChange_Zero_OmitsPlayerCount', () => {
      component.onPlayerCountChange('0');

      expect(emittedFilters[0].player_count).toBeUndefined();
    });

    it('onPlayerCountChange_NegativeNumber_OmitsPlayerCount', () => {
      component.onPlayerCountChange('-1');

      expect(emittedFilters[0].player_count).toBeUndefined();
    });
  });

  describe('complexity', () => {
    it('toggleComplexity_SelectLevel_EmitsWithComplexity', () => {
      component.toggleComplexity('medium');

      expect(emittedFilters.length).toBe(1);
      expect(emittedFilters[0].complexity).toEqual(['medium']);
    });

    it('toggleComplexity_MultipleSelections_EmitsAllSelected', () => {
      component.toggleComplexity('light');
      component.toggleComplexity('heavy');

      expect(emittedFilters[1].complexity).toEqual(expect.arrayContaining(['light', 'heavy']));
    });

    it('toggleComplexity_Deselect_RemovesFromFilter', () => {
      component.toggleComplexity('medium');
      component.toggleComplexity('medium');

      expect(emittedFilters[1].complexity).toBeUndefined();
    });

    it('isComplexitySelected_Selected_ReturnsTrue', () => {
      component.toggleComplexity('light');

      expect(component.isComplexitySelected('light')).toBe(true);
      expect(component.isComplexitySelected('heavy')).toBe(false);
    });
  });

  describe('tags', () => {
    it('toggleTag_SelectTag_EmitsWithTag', () => {
      component.toggleTag('strategy');

      expect(emittedFilters[0].tags).toEqual(['strategy']);
    });

    it('toggleTag_MultipleTags_EmitsAllSelected', () => {
      component.toggleTag('strategy');
      component.toggleTag('party');

      expect(emittedFilters[1].tags).toEqual(expect.arrayContaining(['strategy', 'party']));
    });

    it('toggleTag_Deselect_RemovesFromFilter', () => {
      component.toggleTag('strategy');
      component.toggleTag('strategy');

      expect(emittedFilters[1].tags).toBeUndefined();
    });

    it('isTagSelected_Selected_ReturnsTrue', () => {
      component.toggleTag('strategy');

      expect(component.isTagSelected('strategy')).toBe(true);
      expect(component.isTagSelected('party')).toBe(false);
    });
  });

  describe('sort', () => {
    it('onSortChange_DifferentSort_EmitsFilter', () => {
      component.onSortChange('-updated_at');

      expect(emittedFilters[0].sort).toBe('-updated_at');
    });

    it('onSortChange_DefaultSort_OmitsSortFromFilter', () => {
      component.onSortChange('name');

      expect(emittedFilters[0].sort).toBeUndefined();
    });
  });

  describe('clear filters', () => {
    it('clearFilters_WithActiveFilters_ResetsAll', () => {
      component.toggleComplexity('medium');
      component.toggleTag('strategy');
      component.onPlayerCountChange('4');
      emittedFilters.length = 0;

      component.clearFilters();

      expect(emittedFilters.length).toBe(1);
      expect(emittedFilters[0]).toEqual({});
      expect(component.searchText()).toBe('');
      expect(component.playerCount()).toBeNull();
      expect(component.selectedComplexity().size).toBe(0);
      expect(component.selectedTags().size).toBe(0);
    });
  });

  describe('hasActiveFilters', () => {
    it('hasActiveFilters_NoFilters_ReturnsFalse', () => {
      expect(component.hasActiveFilters).toBe(false);
    });

    it('hasActiveFilters_WithComplexity_ReturnsTrue', () => {
      component.toggleComplexity('light');

      expect(component.hasActiveFilters).toBe(true);
    });

    it('hasActiveFilters_WithPlayerCount_ReturnsTrue', () => {
      component.onPlayerCountChange('3');

      expect(component.hasActiveFilters).toBe(true);
    });
  });

  describe('mobile toggle', () => {
    it('toggleFilters_Collapsed_Expands', () => {
      expect(component.filtersExpanded()).toBe(false);

      component.toggleFilters();

      expect(component.filtersExpanded()).toBe(true);
    });

    it('toggleFilters_Expanded_Collapses', () => {
      component.toggleFilters();
      component.toggleFilters();

      expect(component.filtersExpanded()).toBe(false);
    });
  });

  describe('rendering', () => {
    it('availableTags_WhenProvided_DisplaysTagChips', async () => {
      component.availableTags = mockTags;
      fixture.changeDetectorRef.markForCheck();
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const tagButtons = fixture.nativeElement.querySelectorAll('.game-filter__tag-chip');
      expect(tagButtons.length).toBe(3);
    });

    it('capitalise_LowercaseInput_ReturnsCapitalised', () => {
      expect(component.capitalise('medium')).toBe('Medium');
    });
  });
});
