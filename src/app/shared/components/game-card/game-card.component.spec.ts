import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GameCardComponent } from './game-card.component';
import { GameSummary } from '../../../models/game.model';

describe('GameCardComponent', () => {
  let fixture: ComponentFixture<GameCardComponent>;

  const baseGame: GameSummary = {
    id: 'game-1',
    name: 'Catan',
    publisher: 'Catan Studio',
    year_published: 1995,
    edition: '5th Edition',
    min_players: 3,
    max_players: 4,
    description: 'Trade, build, and settle.',
    cover_image_url: null,
    complexity: 'medium',
    tags: ['strategy', 'trading', 'resource-management', 'classic'],
    is_active: true,
    document_count: 3,
    expansion_count: 2,
    created_at: '2026-03-14T10:30:00Z',
    updated_at: '2026-03-14T12:00:00Z',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GameCardComponent],
    }).compileComponents();
  });

  /** Create fixture with a specific game, only running CD once. */
  function createWith(overrides: Partial<GameSummary> = {}): GameCardComponent {
    fixture = TestBed.createComponent(GameCardComponent);
    const component = fixture.componentInstance;
    component.game = { ...baseGame, ...overrides };
    fixture.detectChanges();
    return component;
  }

  it('render_WithGame_DisplaysName', () => {
    createWith();
    const name = fixture.nativeElement.querySelector('.game-card__name');
    expect(name.textContent.trim()).toBe('Catan');
  });

  it('render_WithPublisherAndYear_DisplaysBoth', () => {
    createWith();
    const publisher = fixture.nativeElement.querySelector('.game-card__publisher');
    expect(publisher.textContent).toContain('Catan Studio');
    expect(publisher.textContent).toContain('(1995)');
  });

  it('render_NoPublisher_HidesPublisher', () => {
    createWith({ publisher: null, year_published: null });
    const publisher = fixture.nativeElement.querySelector('.game-card__publisher');
    expect(publisher).toBeNull();
  });

  it('render_WithPlayerCount_DisplaysRange', () => {
    createWith();
    const players = fixture.nativeElement.querySelector('.game-card__players');
    expect(players.textContent).toContain('3-4 players');
  });

  it('render_SameMinMax_DisplaysSingleCount', () => {
    createWith({ min_players: 2, max_players: 2 });
    const players = fixture.nativeElement.querySelector('.game-card__players');
    expect(players.textContent).toContain('2 players');
  });

  it('render_NoPlayerCount_HidesPlayerCount', () => {
    createWith({ min_players: null, max_players: null });
    const players = fixture.nativeElement.querySelector('.game-card__players');
    expect(players).toBeNull();
  });

  it('render_WithComplexity_ShowsBadge', () => {
    createWith();
    const badge = fixture.nativeElement.querySelector('app-complexity-badge');
    expect(badge).toBeTruthy();
  });

  it('render_NoComplexity_HidesBadge', () => {
    createWith({ complexity: null });
    const badge = fixture.nativeElement.querySelector('app-complexity-badge');
    expect(badge).toBeNull();
  });

  it('visibleTags_MoreThan3_ShowsFirst3', () => {
    const component = createWith();
    expect(component.visibleTags).toEqual(['strategy', 'trading', 'resource-management']);
  });

  it('hiddenTagCount_4Tags_Returns1', () => {
    const component = createWith();
    expect(component.hiddenTagCount).toBe(1);
  });

  it('hiddenTagCount_2Tags_Returns0', () => {
    const component = createWith({ tags: ['strategy', 'trading'] });
    expect(component.hiddenTagCount).toBe(0);
  });

  it('render_MoreThan3Tags_ShowsPlusNMore', () => {
    createWith();
    const moreTags = fixture.nativeElement.querySelector('.game-card__more-tags');
    expect(moreTags).toBeTruthy();
    expect(moreTags.textContent).toContain('+1 more');
  });

  it('render_3OrFewerTags_HidesPlusNMore', () => {
    createWith({ tags: ['strategy'] });
    const moreTags = fixture.nativeElement.querySelector('.game-card__more-tags');
    expect(moreTags).toBeNull();
  });

  it('render_NoTags_HidesTagSection', () => {
    createWith({ tags: [] });
    const tags = fixture.nativeElement.querySelector('.game-card__tags');
    expect(tags).toBeNull();
  });

  it('render_WithDocCount_ShowsCount', () => {
    createWith();
    const counts = fixture.nativeElement.querySelectorAll('.game-card__count');
    expect(counts[0].textContent).toContain('3');
  });

  it('render_WithExpansions_ShowsExpansionCount', () => {
    createWith();
    const counts = fixture.nativeElement.querySelectorAll('.game-card__count');
    expect(counts.length).toBe(2);
    expect(counts[1].textContent).toContain('2');
  });

  it('render_ZeroExpansions_HidesExpansionCount', () => {
    createWith({ expansion_count: 0 });
    const counts = fixture.nativeElement.querySelectorAll('.game-card__count');
    expect(counts.length).toBe(1);
  });

  it('render_NoCoverImage_ShowsPlaceholder', () => {
    createWith();
    const placeholder = fixture.nativeElement.querySelector('.game-card__placeholder');
    expect(placeholder).toBeTruthy();
  });

  it('render_WithCoverImage_ShowsImage', () => {
    createWith({ cover_image_url: 'https://example.com/cover.jpg' });
    const img = fixture.nativeElement.querySelector('.game-card__cover');
    expect(img).toBeTruthy();
    expect(img.getAttribute('src')).toBe('https://example.com/cover.jpg');
  });

  it('render_CoverImage_HasAltText', () => {
    createWith({ cover_image_url: 'https://example.com/cover.jpg' });
    const img = fixture.nativeElement.querySelector('.game-card__cover');
    expect(img.getAttribute('alt')).toBe('Catan cover image');
  });

  it('render_Placeholder_HasAriaHidden', () => {
    createWith();
    const placeholder = fixture.nativeElement.querySelector('.game-card__placeholder');
    expect(placeholder.getAttribute('aria-hidden')).toBe('true');
  });

  it('render_CoverImage_HasLazyLoading', () => {
    createWith({ cover_image_url: 'https://example.com/cover.jpg' });
    const img = fixture.nativeElement.querySelector('.game-card__cover');
    expect(img.getAttribute('loading')).toBe('lazy');
  });

  it('publisherYear_OnlyPublisher_ReturnsPublisher', () => {
    const component = createWith({ year_published: null });
    expect(component.publisherYear).toBe('Catan Studio');
  });

  it('publisherYear_OnlyYear_ReturnsYear', () => {
    const component = createWith({ publisher: null });
    expect(component.publisherYear).toBe('(1995)');
  });

  it('publisherYear_Neither_ReturnsNull', () => {
    const component = createWith({ publisher: null, year_published: null });
    expect(component.publisherYear).toBeNull();
  });

  it('render_DocCount_HasAriaLabel', () => {
    createWith();
    const count = fixture.nativeElement.querySelectorAll('.game-card__count')[0];
    expect(count.getAttribute('aria-label')).toBe('3 documents');
  });

  it('render_ExpansionCount_HasAriaLabel', () => {
    createWith();
    const count = fixture.nativeElement.querySelectorAll('.game-card__count')[1];
    expect(count.getAttribute('aria-label')).toBe('2 expansions');
  });
});
