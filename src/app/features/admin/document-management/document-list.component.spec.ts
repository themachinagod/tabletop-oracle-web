import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { DocumentSummary } from '../../../models/document.model';
import { PaginatedResult } from '../../../models/api.model';
import { AdminDocumentService } from '../../../core/services/admin-document.service';
import { DocumentListComponent } from './document-list.component';

describe('DocumentListComponent', () => {
  let component: DocumentListComponent;
  let fixture: ComponentFixture<DocumentListComponent>;
  let mockDocumentService: {
    listDocuments: ReturnType<typeof vi.fn>;
    deleteDocument: ReturnType<typeof vi.fn>;
  };
  let mockRouter: { navigate: ReturnType<typeof vi.fn> };

  const mockDoc: DocumentSummary = {
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
  };

  const paginatedResult: PaginatedResult<DocumentSummary> = {
    data: [mockDoc],
    pagination: { page: 1, page_size: 25, total_items: 1, total_pages: 1 },
  };

  beforeEach(async () => {
    mockDocumentService = {
      listDocuments: vi.fn().mockReturnValue(of(paginatedResult)),
      deleteDocument: vi.fn().mockReturnValue(of(undefined)),
    };
    mockRouter = { navigate: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [DocumentListComponent],
      providers: [
        { provide: AdminDocumentService, useValue: mockDocumentService },
        { provide: Router, useValue: mockRouter },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DocumentListComponent);
    component = fixture.componentInstance;
    component.gameId = 'game-1';
  });

  it('ngOnInit_ValidGameId_LoadsDocuments', () => {
    fixture.detectChanges();

    expect(mockDocumentService.listDocuments).toHaveBeenCalledWith('game-1', { sort: '-uploaded_at' });
    expect(component.documents()).toEqual([mockDoc]);
    expect(component.loading()).toBe(false);
  });

  it('ngOnInit_ApiError_SetsErrorMessage', () => {
    mockDocumentService.listDocuments.mockReturnValue(throwError(() => new Error('fail')));
    fixture.detectChanges();

    expect(component.error()).toBe('Failed to load documents. Please try again.');
    expect(component.loading()).toBe(false);
  });

  it('viewDocument_ValidDoc_NavigatesToDetail', () => {
    fixture.detectChanges();
    component.viewDocument(mockDoc);

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/admin/games', 'game-1', 'documents', 'doc-1']);
  });

  it('confirmDelete_ValidDoc_SetsDeleteTarget', () => {
    fixture.detectChanges();
    component.confirmDelete(mockDoc);

    expect(component.deleteTarget()).toEqual(mockDoc);
  });

  it('onDeleteConfirmed_ValidTarget_DeletesAndReloads', () => {
    fixture.detectChanges();
    component.confirmDelete(mockDoc);
    component.onDeleteConfirmed();

    expect(mockDocumentService.deleteDocument).toHaveBeenCalledWith('game-1', 'doc-1');
    expect(component.deleteTarget()).toBeNull();
  });

  it('onDeleteConfirmed_ApiError_SetsErrorMessage', () => {
    mockDocumentService.deleteDocument.mockReturnValue(throwError(() => new Error('fail')));
    fixture.detectChanges();
    component.confirmDelete(mockDoc);
    component.onDeleteConfirmed();

    expect(component.error()).toBe('Failed to delete document. Please try again.');
  });

  it('onDeleteCancelled_ClearsDeleteTarget', () => {
    component.confirmDelete(mockDoc);
    component.onDeleteCancelled();

    expect(component.deleteTarget()).toBeNull();
  });

  it('formatFileSize_ByteValues_ReturnsReadableString', () => {
    expect(component.formatFileSize(500)).toBe('500 B');
    expect(component.formatFileSize(1024)).toBe('1.0 KB');
    expect(component.formatFileSize(1048576)).toBe('1.0 MB');
  });

  it('onDocumentUploaded_RefreshesDocumentList', () => {
    fixture.detectChanges();
    mockDocumentService.listDocuments.mockClear();

    component.onDocumentUploaded();

    expect(mockDocumentService.listDocuments).toHaveBeenCalled();
  });
});
