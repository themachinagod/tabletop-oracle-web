import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SessionCardComponent } from './session-card.component';
import { SessionSummary } from '../../../models/session.model';

describe('SessionCardComponent', () => {
  let fixture: ComponentFixture<SessionCardComponent>;

  const baseSession: SessionSummary = {
    id: 'session-1',
    game_id: 'game-1',
    game_name: 'Catan',
    game_cover_image_url: null,
    name: 'Saturday Game Night',
    player_count: 4,
    status: 'active',
    expansions: [
      { id: 'exp-1', name: 'Seafarers' },
      { id: 'exp-2', name: 'Cities & Knights' },
    ],
    last_active_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    created_at: '2026-03-14T10:30:00Z',
    last_message_preview: 'What happens when I roll a 7 and have more than 7 cards?',
    message_count: 12,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SessionCardComponent],
    }).compileComponents();
  });

  /** Create fixture with specific session data, running CD once. */
  function createWith(overrides: Partial<SessionSummary> = {}): SessionCardComponent {
    fixture = TestBed.createComponent(SessionCardComponent);
    const component = fixture.componentInstance;
    component.session = { ...baseSession, ...overrides };
    fixture.detectChanges();
    return component;
  }

  it('render_WithSession_DisplaysSessionName', () => {
    createWith();
    const name = fixture.nativeElement.querySelector('.session-card__name');
    expect(name.textContent.trim()).toBe('Saturday Game Night');
  });

  it('render_WithSession_DisplaysGameName', () => {
    createWith();
    const gameName = fixture.nativeElement.querySelector('.session-card__game-name');
    expect(gameName.textContent.trim()).toBe('Catan');
  });

  it('render_WithExpansions_ShowsExpansionBadges', () => {
    createWith();
    const badges = fixture.nativeElement.querySelectorAll('.session-card__expansion-badge');
    expect(badges.length).toBe(2);
    expect(badges[0].textContent.trim()).toBe('Seafarers');
    expect(badges[1].textContent.trim()).toBe('Cities & Knights');
  });

  it('render_NoExpansions_HidesExpansionSection', () => {
    createWith({ expansions: [] });
    const expansions = fixture.nativeElement.querySelector('.session-card__expansions');
    expect(expansions).toBeNull();
  });

  it('render_WithPlayerCount_ShowsPlayerCount', () => {
    createWith();
    const players = fixture.nativeElement.querySelector('.session-card__players');
    expect(players).toBeTruthy();
    expect(players.textContent).toContain('4 players');
  });

  it('render_NoPlayerCount_HidesPlayerCount', () => {
    createWith({ player_count: null });
    const players = fixture.nativeElement.querySelector('.session-card__players');
    expect(players).toBeNull();
  });

  it('render_WithTimestamp_ShowsRelativeTime', () => {
    createWith();
    const time = fixture.nativeElement.querySelector('.session-card__time');
    expect(time.textContent.trim()).toBe('2 hours ago');
  });

  it('render_WithPreview_ShowsPreview', () => {
    createWith();
    const preview = fixture.nativeElement.querySelector('.session-card__preview');
    expect(preview).toBeTruthy();
    expect(preview.textContent.trim()).toContain('What happens when I roll a 7');
  });

  it('render_NoPreview_HidesPreview', () => {
    createWith({ last_message_preview: null });
    const preview = fixture.nativeElement.querySelector('.session-card__preview');
    expect(preview).toBeNull();
  });

  it('render_NoCoverImage_ShowsPlaceholder', () => {
    createWith();
    const placeholder = fixture.nativeElement.querySelector('.session-card__placeholder');
    expect(placeholder).toBeTruthy();
  });

  it('render_WithCoverImage_ShowsImage', () => {
    createWith({ game_cover_image_url: 'https://example.com/cover.jpg' });
    const img = fixture.nativeElement.querySelector('.session-card__cover');
    expect(img).toBeTruthy();
    expect(img.getAttribute('src')).toBe('https://example.com/cover.jpg');
  });

  it('render_CoverImage_HasAltText', () => {
    createWith({ game_cover_image_url: 'https://example.com/cover.jpg' });
    const img = fixture.nativeElement.querySelector('.session-card__cover');
    expect(img.getAttribute('alt')).toBe('Catan cover');
  });

  it('render_CoverImage_HasLazyLoading', () => {
    createWith({ game_cover_image_url: 'https://example.com/cover.jpg' });
    const img = fixture.nativeElement.querySelector('.session-card__cover');
    expect(img.getAttribute('loading')).toBe('lazy');
  });

  it('render_Placeholder_HasAriaHidden', () => {
    createWith();
    const placeholder = fixture.nativeElement.querySelector('.session-card__placeholder');
    expect(placeholder.getAttribute('aria-hidden')).toBe('true');
  });

  it('render_LongPreview_TruncatesText', () => {
    const longText = 'A'.repeat(150);
    createWith({ last_message_preview: longText });
    const preview = fixture.nativeElement.querySelector('.session-card__preview');
    // The truncate pipe should cut at 80 chars
    expect(preview.textContent.trim().length).toBeLessThanOrEqual(80);
    expect(preview.textContent.trim()).toContain('...');
  });
});
