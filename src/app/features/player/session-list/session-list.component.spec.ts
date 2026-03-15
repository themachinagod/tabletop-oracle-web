import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SessionSummary } from '../../../models/session.model';
import { SessionListComponent } from './session-list.component';

describe('SessionListComponent', () => {
  let component: SessionListComponent;
  let fixture: ComponentFixture<SessionListComponent>;

  const mockActiveSessions: SessionSummary[] = [
    {
      id: 'session-1',
      game_id: 'game-1',
      game_name: 'Catan',
      game_cover_image_url: null,
      name: 'Friday Catan',
      player_count: 4,
      status: 'active',
      expansions: [],
      last_active_at: '2026-03-15T00:00:00Z',
      created_at: '2026-03-14T00:00:00Z',
      last_message_preview: null,
      message_count: 0,
    },
    {
      id: 'session-2',
      game_id: 'game-2',
      game_name: 'Wingspan',
      game_cover_image_url: 'https://example.com/wingspan.jpg',
      name: 'Bird game',
      player_count: 2,
      status: 'active',
      expansions: [{ id: 'exp-1', name: 'European Expansion' }],
      last_active_at: '2026-03-14T12:00:00Z',
      created_at: '2026-03-13T00:00:00Z',
      last_message_preview: 'What birds score bonus?',
      message_count: 5,
    },
  ];

  const mockArchivedSession: SessionSummary = {
    id: 'session-3',
    game_id: 'game-1',
    game_name: 'Catan',
    game_cover_image_url: null,
    name: 'Old Catan game',
    player_count: 3,
    status: 'archived',
    expansions: [],
    last_active_at: '2026-03-10T00:00:00Z',
    created_at: '2026-03-09T00:00:00Z',
    last_message_preview: null,
    message_count: 20,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SessionListComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SessionListComponent);
    component = fixture.componentInstance;
  });

  it('rendersList_WithActiveSessions_DisplaysCorrectCount', () => {
    component.sessions = mockActiveSessions;
    fixture.detectChanges();

    const items = fixture.nativeElement.querySelectorAll('.session-list__item');
    expect(items.length).toBe(2);
  });

  it('rendersList_WithActiveSessions_NoRestoreButtons', () => {
    component.sessions = mockActiveSessions;
    fixture.detectChanges();

    const restoreButtons = fixture.nativeElement.querySelectorAll('.session-list__restore');
    expect(restoreButtons.length).toBe(0);
  });

  it('rendersList_WithArchivedSession_ShowsRestoreButton', () => {
    component.sessions = [mockArchivedSession];
    fixture.detectChanges();

    const restoreButtons = fixture.nativeElement.querySelectorAll('.session-list__restore');
    expect(restoreButtons.length).toBe(1);
    expect(restoreButtons[0].textContent.trim()).toBe('Restore');
  });

  it('sessionSelected_OnCardClick_EmitsSession', () => {
    component.sessions = mockActiveSessions;
    fixture.detectChanges();

    const spy = vi.spyOn(component.sessionSelected, 'emit');

    const button = fixture.nativeElement.querySelector('.session-list__button');
    button.click();

    expect(spy).toHaveBeenCalledWith(mockActiveSessions[0]);
  });

  it('restoreRequested_OnRestoreClick_EmitsSession', () => {
    component.sessions = [mockArchivedSession];
    fixture.detectChanges();

    const spy = vi.spyOn(component.restoreRequested, 'emit');

    const restoreButton = fixture.nativeElement.querySelector('.session-list__restore');
    restoreButton.click();

    expect(spy).toHaveBeenCalledWith(mockArchivedSession);
  });

  it('rendersList_EmptySessions_NoListItems', () => {
    component.sessions = [];
    fixture.detectChanges();

    const items = fixture.nativeElement.querySelectorAll('.session-list__item');
    expect(items.length).toBe(0);
  });

  it('rendersList_WithSessions_HasListRole', () => {
    component.sessions = mockActiveSessions;
    fixture.detectChanges();

    const list = fixture.nativeElement.querySelector('[role="list"]');
    expect(list).toBeTruthy();
  });

  it('rendersList_WithSession_HasAccessibleLabel', () => {
    component.sessions = [mockActiveSessions[0]];
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('.session-list__button');
    expect(button.getAttribute('aria-label')).toBe('Open session: Friday Catan');
  });
});
