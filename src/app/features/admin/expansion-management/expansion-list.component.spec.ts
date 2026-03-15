import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ExpansionDetail } from '../../../models/game.model';
import { AdminExpansionService } from '../../../core/services/admin-expansion.service';
import { ExpansionListComponent } from './expansion-list.component';

describe('ExpansionListComponent', () => {
  let component: ExpansionListComponent;
  let fixture: ComponentFixture<ExpansionListComponent>;
  let mockExpansionService: {
    listExpansions: ReturnType<typeof vi.fn>;
    createExpansion: ReturnType<typeof vi.fn>;
    updateExpansion: ReturnType<typeof vi.fn>;
    archiveExpansion: ReturnType<typeof vi.fn>;
    restoreExpansion: ReturnType<typeof vi.fn>;
  };

  const mockExpansion: ExpansionDetail = {
    id: 'exp-1',
    name: 'Seafarers',
    description: 'Sail the seas',
    year_published: 1997,
    is_active: true,
  };

  const archivedExpansion: ExpansionDetail = {
    ...mockExpansion,
    id: 'exp-2',
    name: 'Archived Expansion',
    is_active: false,
  };

  beforeEach(async () => {
    mockExpansionService = {
      listExpansions: vi.fn().mockReturnValue(of([mockExpansion])),
      createExpansion: vi.fn().mockReturnValue(of(mockExpansion)),
      updateExpansion: vi.fn().mockReturnValue(of(mockExpansion)),
      archiveExpansion: vi.fn().mockReturnValue(of({ ...mockExpansion, is_active: false })),
      restoreExpansion: vi.fn().mockReturnValue(of(mockExpansion)),
    };

    await TestBed.configureTestingModule({
      imports: [ExpansionListComponent],
      providers: [
        { provide: AdminExpansionService, useValue: mockExpansionService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ExpansionListComponent);
    component = fixture.componentInstance;
    component.gameId = 'game-1';
  });

  describe('initialisation', () => {
    it('ngOnInit_Success_LoadsExpansions', () => {
      fixture.detectChanges();

      expect(component.expansions()).toEqual([mockExpansion]);
      expect(component.loading()).toBe(false);
      expect(component.error()).toBeNull();
      expect(mockExpansionService.listExpansions).toHaveBeenCalledWith('game-1');
    });

    it('ngOnInit_ApiError_SetsErrorMessage', () => {
      mockExpansionService.listExpansions.mockReturnValue(
        throwError(() => new Error('fail')),
      );
      fixture.detectChanges();

      expect(component.error()).toBe('Failed to load expansions. Please try again.');
      expect(component.loading()).toBe(false);
    });

    it('ngOnInit_EmptyList_ShowsEmptyState', () => {
      mockExpansionService.listExpansions.mockReturnValue(of([]));
      fixture.detectChanges();

      expect(component.expansions()).toEqual([]);
      expect(component.loading()).toBe(false);
    });
  });

  describe('create flow', () => {
    it('openCreateForm_OpensFormWithNullExpansion', () => {
      fixture.detectChanges();

      component.openCreateForm();

      expect(component.showForm()).toBe(true);
      expect(component.editingExpansion()).toBeNull();
    });

    it('onFormSaved_CreateSuccess_ClosesFormAndReloads', () => {
      fixture.detectChanges();
      component.openCreateForm();

      component.onFormSaved({ name: 'New Expansion' });

      expect(mockExpansionService.createExpansion).toHaveBeenCalledWith('game-1', {
        name: 'New Expansion',
      });
      expect(component.showForm()).toBe(false);
      expect(component.formSubmitting()).toBe(false);
    });

    it('onFormSaved_CreateError_SetsErrorMessage', () => {
      mockExpansionService.createExpansion.mockReturnValue(
        throwError(() => new Error('fail')),
      );
      fixture.detectChanges();
      component.openCreateForm();

      component.onFormSaved({ name: 'New Expansion' });

      expect(component.error()).toBe('Failed to create expansion. Please try again.');
      expect(component.formSubmitting()).toBe(false);
    });
  });

  describe('edit flow', () => {
    it('openEditForm_OpensFormWithExpansion', () => {
      fixture.detectChanges();

      component.openEditForm(mockExpansion);

      expect(component.showForm()).toBe(true);
      expect(component.editingExpansion()).toEqual(mockExpansion);
    });

    it('onFormSaved_UpdateSuccess_ClosesFormAndReloads', () => {
      fixture.detectChanges();
      component.openEditForm(mockExpansion);

      component.onFormSaved({ name: 'Updated Seafarers' });

      expect(mockExpansionService.updateExpansion).toHaveBeenCalledWith(
        'game-1',
        'exp-1',
        { name: 'Updated Seafarers' },
      );
      expect(component.showForm()).toBe(false);
    });

    it('onFormSaved_UpdateError_SetsErrorMessage', () => {
      mockExpansionService.updateExpansion.mockReturnValue(
        throwError(() => new Error('fail')),
      );
      fixture.detectChanges();
      component.openEditForm(mockExpansion);

      component.onFormSaved({ name: 'Updated' });

      expect(component.error()).toBe('Failed to update expansion. Please try again.');
    });
  });

  describe('form cancel', () => {
    it('onFormCancelled_ClosesFormAndClearsEditing', () => {
      fixture.detectChanges();
      component.openEditForm(mockExpansion);

      component.onFormCancelled();

      expect(component.showForm()).toBe(false);
      expect(component.editingExpansion()).toBeNull();
    });
  });

  describe('archive flow', () => {
    it('confirmArchive_SetsArchiveTarget', () => {
      fixture.detectChanges();

      component.confirmArchive(mockExpansion);

      expect(component.archiveTarget()).toEqual(mockExpansion);
    });

    it('onArchiveConfirmed_Success_ReloadsExpansions', () => {
      fixture.detectChanges();
      component.confirmArchive(mockExpansion);

      component.onArchiveConfirmed();

      expect(mockExpansionService.archiveExpansion).toHaveBeenCalledWith('game-1', 'exp-1');
      expect(component.archiveTarget()).toBeNull();
      expect(component.actionInProgress()).toBe(false);
    });

    it('onArchiveConfirmed_ApiError_SetsErrorMessage', () => {
      mockExpansionService.archiveExpansion.mockReturnValue(
        throwError(() => new Error('fail')),
      );
      fixture.detectChanges();
      component.confirmArchive(mockExpansion);

      component.onArchiveConfirmed();

      expect(component.error()).toBe('Failed to archive expansion. Please try again.');
      expect(component.actionInProgress()).toBe(false);
    });

    it('onArchiveCancelled_ClearsTarget', () => {
      fixture.detectChanges();
      component.confirmArchive(mockExpansion);

      component.onArchiveCancelled();

      expect(component.archiveTarget()).toBeNull();
    });
  });

  describe('restore flow', () => {
    it('confirmRestore_SetsRestoreTarget', () => {
      fixture.detectChanges();

      component.confirmRestore(archivedExpansion);

      expect(component.restoreTarget()).toEqual(archivedExpansion);
    });

    it('onRestoreConfirmed_Success_ReloadsExpansions', () => {
      fixture.detectChanges();
      component.confirmRestore(archivedExpansion);

      component.onRestoreConfirmed();

      expect(mockExpansionService.restoreExpansion).toHaveBeenCalledWith(
        'game-1',
        'exp-2',
      );
      expect(component.restoreTarget()).toBeNull();
      expect(component.actionInProgress()).toBe(false);
    });

    it('onRestoreConfirmed_ApiError_SetsErrorMessage', () => {
      mockExpansionService.restoreExpansion.mockReturnValue(
        throwError(() => new Error('fail')),
      );
      fixture.detectChanges();
      component.confirmRestore(archivedExpansion);

      component.onRestoreConfirmed();

      expect(component.error()).toBe('Failed to restore expansion. Please try again.');
      expect(component.actionInProgress()).toBe(false);
    });

    it('onRestoreCancelled_ClearsTarget', () => {
      fixture.detectChanges();
      component.confirmRestore(archivedExpansion);

      component.onRestoreCancelled();

      expect(component.restoreTarget()).toBeNull();
    });
  });

  describe('error handling', () => {
    it('dismissError_ClearsError', () => {
      mockExpansionService.listExpansions.mockReturnValue(
        throwError(() => new Error('fail')),
      );
      fixture.detectChanges();

      component.dismissError();

      expect(component.error()).toBeNull();
    });
  });
});
