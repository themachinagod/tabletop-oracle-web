import { Component, DestroyRef, inject, Input, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ExpansionCreate, ExpansionDetail } from '../../../models/game.model';
import { AdminExpansionService } from '../../../core/services/admin-expansion.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ErrorBannerComponent } from '../../../shared/components/error-banner/error-banner.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ExpansionFormComponent } from './expansion-form.component';

/**
 * Expansion list within the game detail Expansions tab.
 *
 * Displays all expansions for a game with add, edit, archive, and
 * restore capabilities. Uses a dialog for add/edit operations and
 * a confirmation dialog for archive/restore.
 */
@Component({
  selector: 'app-expansion-list',
  standalone: true,
  imports: [
    ConfirmDialogComponent,
    EmptyStateComponent,
    ErrorBannerComponent,
    ExpansionFormComponent,
    LoadingSpinnerComponent,
  ],
  templateUrl: './expansion-list.component.html',
  styleUrl: './expansion-list.component.scss',
})
export class ExpansionListComponent implements OnInit {
  private readonly expansionService = inject(AdminExpansionService);
  private readonly destroyRef = inject(DestroyRef);

  /** Parent game ID. */
  @Input({ required: true }) gameId!: string;

  /** Loaded expansions. */
  readonly expansions = signal<ExpansionDetail[]>([]);

  /** Whether expansions are loading. */
  readonly loading = signal(true);

  /** Error message from the last failed operation. */
  readonly error = signal<string | null>(null);

  /** Whether the add/edit form dialog is open. */
  readonly showForm = signal(false);

  /** Expansion being edited (null for create mode). */
  readonly editingExpansion = signal<ExpansionDetail | null>(null);

  /** Whether the form is currently submitting. */
  readonly formSubmitting = signal(false);

  /** Expansion pending archive confirmation. */
  readonly archiveTarget = signal<ExpansionDetail | null>(null);

  /** Expansion pending restore confirmation. */
  readonly restoreTarget = signal<ExpansionDetail | null>(null);

  /** Whether an archive/restore operation is in progress. */
  readonly actionInProgress = signal(false);

  ngOnInit(): void {
    this.loadExpansions();
  }

  /** Open the form dialog for creating a new expansion. */
  openCreateForm(): void {
    this.editingExpansion.set(null);
    this.showForm.set(true);
  }

  /** Open the form dialog for editing an existing expansion. */
  openEditForm(expansion: ExpansionDetail): void {
    this.editingExpansion.set(expansion);
    this.showForm.set(true);
  }

  /** Handle form save — create or update expansion. */
  onFormSaved(payload: ExpansionCreate): void {
    this.formSubmitting.set(true);
    this.error.set(null);

    const editing = this.editingExpansion();
    const request$ = editing
      ? this.expansionService.updateExpansion(this.gameId, editing.id, payload)
      : this.expansionService.createExpansion(this.gameId, payload);

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.formSubmitting.set(false);
        this.showForm.set(false);
        this.editingExpansion.set(null);
        this.loadExpansions();
      },
      error: () => {
        const action = editing ? 'update' : 'create';
        this.error.set(`Failed to ${action} expansion. Please try again.`);
        this.formSubmitting.set(false);
      },
    });
  }

  /** Handle form cancel. */
  onFormCancelled(): void {
    this.showForm.set(false);
    this.editingExpansion.set(null);
  }

  /** Open archive confirmation dialog. */
  confirmArchive(expansion: ExpansionDetail): void {
    this.archiveTarget.set(expansion);
  }

  /** Execute archive after confirmation. */
  onArchiveConfirmed(): void {
    const target = this.archiveTarget();
    if (!target) return;

    this.archiveTarget.set(null);
    this.actionInProgress.set(true);
    this.error.set(null);

    this.expansionService
      .archiveExpansion(this.gameId, target.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.actionInProgress.set(false);
          this.loadExpansions();
        },
        error: () => {
          this.error.set('Failed to archive expansion. Please try again.');
          this.actionInProgress.set(false);
        },
      });
  }

  /** Cancel archive dialog. */
  onArchiveCancelled(): void {
    this.archiveTarget.set(null);
  }

  /** Open restore confirmation dialog. */
  confirmRestore(expansion: ExpansionDetail): void {
    this.restoreTarget.set(expansion);
  }

  /** Execute restore after confirmation. */
  onRestoreConfirmed(): void {
    const target = this.restoreTarget();
    if (!target) return;

    this.restoreTarget.set(null);
    this.actionInProgress.set(true);
    this.error.set(null);

    this.expansionService
      .restoreExpansion(this.gameId, target.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.actionInProgress.set(false);
          this.loadExpansions();
        },
        error: () => {
          this.error.set('Failed to restore expansion. Please try again.');
          this.actionInProgress.set(false);
        },
      });
  }

  /** Cancel restore dialog. */
  onRestoreCancelled(): void {
    this.restoreTarget.set(null);
  }

  /** Dismiss the error banner. */
  dismissError(): void {
    this.error.set(null);
  }

  /** Load expansions from the API. */
  private loadExpansions(): void {
    this.loading.set(true);
    this.error.set(null);

    this.expansionService
      .listExpansions(this.gameId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (expansions) => {
          this.expansions.set(expansions);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Failed to load expansions. Please try again.');
          this.loading.set(false);
        },
      });
  }
}
