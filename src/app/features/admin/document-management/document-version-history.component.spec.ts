import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { DocumentVersion } from '../../../models/document.model';
import { AdminDocumentService } from '../../../core/services/admin-document.service';
import { DocumentVersionHistoryComponent } from './document-version-history.component';

describe('DocumentVersionHistoryComponent', () => {
  let component: DocumentVersionHistoryComponent;
  let fixture: ComponentFixture<DocumentVersionHistoryComponent>;
  let mockDocumentService: {
    getVersionHistory: ReturnType<typeof vi.fn>;
    uploadVersion: ReturnType<typeof vi.fn>;
  };

  const mockVersions: DocumentVersion[] = [
    {
      version: 2,
      file_size: 2048000,
      uploaded_at: '2026-02-01T00:00:00Z',
      uploaded_by_name: 'Curator',
      is_active: true,
    },
    {
      version: 1,
      file_size: 1024000,
      uploaded_at: '2026-01-01T00:00:00Z',
      uploaded_by_name: 'Curator',
      is_active: false,
    },
  ];

  beforeEach(async () => {
    mockDocumentService = {
      getVersionHistory: vi.fn().mockReturnValue(of(mockVersions)),
      uploadVersion: vi.fn().mockReturnValue(of(mockVersions[0])),
    };

    await TestBed.configureTestingModule({
      imports: [DocumentVersionHistoryComponent],
      providers: [{ provide: AdminDocumentService, useValue: mockDocumentService }],
    }).compileComponents();

    fixture = TestBed.createComponent(DocumentVersionHistoryComponent);
    component = fixture.componentInstance;
    component.gameId = 'game-1';
    component.documentId = 'doc-1';
  });

  it('ngOnInit_ValidIds_LoadsVersionHistory', () => {
    fixture.detectChanges();

    expect(mockDocumentService.getVersionHistory).toHaveBeenCalledWith('game-1', 'doc-1');
    expect(component.versions()).toEqual(mockVersions);
    expect(component.loading()).toBe(false);
  });

  it('ngOnInit_ApiError_SetsErrorMessage', () => {
    mockDocumentService.getVersionHistory.mockReturnValue(throwError(() => new Error('fail')));
    fixture.detectChanges();

    expect(component.error()).toBe('Failed to load version history.');
    expect(component.loading()).toBe(false);
  });

  it('onVersionFileSelected_ValidFile_UploadsAndRefreshes', () => {
    fixture.detectChanges();
    const file = new File(['content v2'], 'rules-v2.pdf');
    const input = { target: { files: [file], value: '' } } as unknown as Event;
    const versionUploadedSpy = vi.spyOn(component.versionUploaded, 'emit');

    component.onVersionFileSelected(input);

    expect(mockDocumentService.uploadVersion).toHaveBeenCalledWith('game-1', 'doc-1', file);
    expect(versionUploadedSpy).toHaveBeenCalled();
    expect(component.uploading()).toBe(false);
  });

  it('onVersionFileSelected_ApiError_SetsErrorMessage', () => {
    mockDocumentService.uploadVersion.mockReturnValue(throwError(() => new Error('fail')));
    fixture.detectChanges();
    const file = new File(['content'], 'rules.pdf');
    const input = { target: { files: [file], value: '' } } as unknown as Event;

    component.onVersionFileSelected(input);

    expect(component.error()).toBe('Failed to upload new version. Please try again.');
    expect(component.uploading()).toBe(false);
  });

  it('onVersionFileSelected_NoFile_DoesNothing', () => {
    fixture.detectChanges();
    const input = { target: { files: [], value: '' } } as unknown as Event;

    component.onVersionFileSelected(input);

    expect(mockDocumentService.uploadVersion).not.toHaveBeenCalled();
  });

  it('formatFileSize_VariousValues_ReturnsHumanReadable', () => {
    expect(component.formatFileSize(500)).toBe('500 B');
    expect(component.formatFileSize(1024)).toBe('1.0 KB');
    expect(component.formatFileSize(1048576)).toBe('1.0 MB');
  });
});
