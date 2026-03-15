import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { DocumentDetail } from '../../../models/document.model';
import { AdminDocumentService } from '../../../core/services/admin-document.service';
import { AdminExpansionService } from '../../../core/services/admin-expansion.service';
import { DocumentDetailComponent } from './document-detail.component';

describe('DocumentDetailComponent', () => {
  let component: DocumentDetailComponent;
  let fixture: ComponentFixture<DocumentDetailComponent>;
  let mockDocumentService: {
    getDocument: ReturnType<typeof vi.fn>;
    deleteDocument: ReturnType<typeof vi.fn>;
    retryProcessing: ReturnType<typeof vi.fn>;
    getVersionHistory: ReturnType<typeof vi.fn>;
    uploadVersion: ReturnType<typeof vi.fn>;
    listDocuments: ReturnType<typeof vi.fn>;
    uploadDocument: ReturnType<typeof vi.fn>;
    reclassifyDocument: ReturnType<typeof vi.fn>;
    reassociateDocument: ReturnType<typeof vi.fn>;
  };
  let mockExpansionService: { listExpansions: ReturnType<typeof vi.fn> };
  let mockRouter: { navigate: ReturnType<typeof vi.fn> };

  const mockDoc: DocumentDetail = {
    id: 'doc-1',
    game_id: 'game-1',
    expansion_id: null,
    expansion_name: null,
    name: 'Core Rulebook',
    type: 'core_rules',
    format: 'pdf',
    status: 'processed',
    current_version: 1,
    file_size: 1024000,
    uploaded_at: '2026-01-01T00:00:00Z',
    processed_at: '2026-01-01T00:05:00Z',
    error_message: null,
    chunk_count: 42,
  };

  beforeEach(async () => {
    mockDocumentService = {
      getDocument: vi.fn().mockReturnValue(of(mockDoc)),
      deleteDocument: vi.fn().mockReturnValue(of(undefined)),
      retryProcessing: vi.fn().mockReturnValue(of(mockDoc)),
      getVersionHistory: vi.fn().mockReturnValue(of([])),
      uploadVersion: vi.fn().mockReturnValue(of({})),
      listDocuments: vi
        .fn()
        .mockReturnValue(
          of({ data: [], pagination: { page: 1, page_size: 25, total_items: 0, total_pages: 0 } }),
        ),
      uploadDocument: vi.fn().mockReturnValue(of({})),
      reclassifyDocument: vi.fn().mockReturnValue(of(mockDoc)),
      reassociateDocument: vi.fn().mockReturnValue(of(mockDoc)),
    };
    mockExpansionService = {
      listExpansions: vi.fn().mockReturnValue(of([])),
    };
    mockRouter = { navigate: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [DocumentDetailComponent],
      providers: [
        { provide: AdminDocumentService, useValue: mockDocumentService },
        { provide: AdminExpansionService, useValue: mockExpansionService },
        { provide: Router, useValue: mockRouter },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => {
                  if (key === 'gameId') return 'game-1';
                  if (key === 'documentId') return 'doc-1';
                  return null;
                },
              },
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DocumentDetailComponent);
    component = fixture.componentInstance;
  });

  it('ngOnInit_ValidRoute_LoadsDocumentAndExpansions', () => {
    fixture.detectChanges();

    expect(mockDocumentService.getDocument).toHaveBeenCalledWith('game-1', 'doc-1');
    expect(mockExpansionService.listExpansions).toHaveBeenCalledWith('game-1');
    expect(component.document()).toEqual(mockDoc);
    expect(component.loading()).toBe(false);
  });

  it('ngOnInit_ApiError_SetsErrorMessage', () => {
    mockDocumentService.getDocument.mockReturnValue(throwError(() => new Error('fail')));
    fixture.detectChanges();

    expect(component.error()).toBe('Failed to load document. Please try again.');
    expect(component.loading()).toBe(false);
  });

  it('goBack_NavigatesToGameDetail', () => {
    fixture.detectChanges();
    component.goBack();

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/admin/games', 'game-1']);
  });

  it('confirmDelete_OpensDeleteDialog', () => {
    component.confirmDelete();

    expect(component.showDeleteDialog()).toBe(true);
  });

  it('onDeleteConfirmed_DeletesAndNavigatesBack', () => {
    fixture.detectChanges();
    component.confirmDelete();
    component.onDeleteConfirmed();

    expect(mockDocumentService.deleteDocument).toHaveBeenCalledWith('game-1', 'doc-1');
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/admin/games', 'game-1']);
  });

  it('onDeleteConfirmed_ApiError_SetsErrorMessage', () => {
    mockDocumentService.deleteDocument.mockReturnValue(throwError(() => new Error('fail')));
    fixture.detectChanges();
    component.confirmDelete();
    component.onDeleteConfirmed();

    expect(component.error()).toBe('Failed to delete document. Please try again.');
    expect(component.actionInProgress()).toBe(false);
  });

  it('onDeleteCancelled_ClosesDialog', () => {
    component.confirmDelete();
    component.onDeleteCancelled();

    expect(component.showDeleteDialog()).toBe(false);
  });

  it('retryProcessing_CallsServiceAndReloads', () => {
    fixture.detectChanges();
    mockDocumentService.getDocument.mockClear();

    component.retryProcessing();

    expect(mockDocumentService.retryProcessing).toHaveBeenCalledWith('game-1', 'doc-1');
    expect(mockDocumentService.getDocument).toHaveBeenCalled();
  });

  it('retryProcessing_ApiError_SetsErrorMessage', () => {
    mockDocumentService.retryProcessing.mockReturnValue(throwError(() => new Error('fail')));
    fixture.detectChanges();

    component.retryProcessing();

    expect(component.error()).toBe('Failed to retry processing. Please try again.');
  });

  it('onDocumentUpdated_ReloadsDocument', () => {
    fixture.detectChanges();
    mockDocumentService.getDocument.mockClear();

    component.onDocumentUpdated();

    expect(mockDocumentService.getDocument).toHaveBeenCalledWith('game-1', 'doc-1');
  });

  it('currentGameId_ReturnsGameIdFromRoute', () => {
    fixture.detectChanges();

    expect(component.currentGameId).toBe('game-1');
  });

  it('currentDocumentId_ReturnsDocumentIdFromRoute', () => {
    fixture.detectChanges();

    expect(component.currentDocumentId).toBe('doc-1');
  });
});
