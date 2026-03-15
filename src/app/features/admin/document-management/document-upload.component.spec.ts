import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AdminDocumentService } from '../../../core/services/admin-document.service';
import { DocumentUploadComponent } from './document-upload.component';

describe('DocumentUploadComponent', () => {
  let component: DocumentUploadComponent;
  let fixture: ComponentFixture<DocumentUploadComponent>;
  let mockDocumentService: {
    uploadDocument: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    mockDocumentService = {
      uploadDocument: vi.fn().mockReturnValue(of({ id: 'doc-new' })),
    };

    await TestBed.configureTestingModule({
      imports: [DocumentUploadComponent],
      providers: [{ provide: AdminDocumentService, useValue: mockDocumentService }],
    }).compileComponents();

    fixture = TestBed.createComponent(DocumentUploadComponent);
    component = fixture.componentInstance;
    component.gameId = 'game-1';
    fixture.detectChanges();
  });

  it('onDragOver_DragEvent_SetsDragOverTrue', () => {
    const event = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    } as unknown as DragEvent;

    component.onDragOver(event);

    expect(component.isDragOver()).toBe(true);
  });

  it('onDragLeave_DragEvent_SetsDragOverFalse', () => {
    component.isDragOver.set(true);
    const event = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    } as unknown as DragEvent;

    component.onDragLeave(event);

    expect(component.isDragOver()).toBe(false);
  });

  it('addFiles_ValidPdf_CreatesUploadItem', () => {
    const file = new File(['content'], 'rules.pdf', { type: 'application/pdf' });
    const input = { target: { files: [file], value: '' } } as unknown as Event;

    component.onFileSelected(input);

    expect(component.uploadItems().length).toBe(1);
    expect(component.uploadItems()[0].name).toBe('rules');
    expect(component.uploadItems()[0].validationError).toBeNull();
  });

  it('addFiles_UnsupportedFormat_SetsValidationError', () => {
    const file = new File(['content'], 'image.jpg', { type: 'image/jpeg' });
    const input = { target: { files: [file], value: '' } } as unknown as Event;

    component.onFileSelected(input);

    expect(component.uploadItems()[0].validationError).toContain('Unsupported format');
  });

  it('addFiles_OversizedFile_SetsValidationError', () => {
    const content = new ArrayBuffer(51 * 1024 * 1024);
    const file = new File([content], 'huge.pdf', { type: 'application/pdf' });
    const input = { target: { files: [file], value: '' } } as unknown as Event;

    component.onFileSelected(input);

    expect(component.uploadItems()[0].validationError).toContain('50MB');
  });

  it('uploadFile_ValidItem_CallsServiceAndEmits', () => {
    const file = new File(['content'], 'rules.pdf', { type: 'application/pdf' });
    const input = { target: { files: [file], value: '' } } as unknown as Event;
    component.onFileSelected(input);

    const uploadedSpy = vi.spyOn(component.uploaded, 'emit');
    component.uploadFile(0);

    expect(mockDocumentService.uploadDocument).toHaveBeenCalledWith(
      'game-1',
      file,
      expect.objectContaining({ name: 'rules', type: 'other', expansion_id: null }),
    );
    expect(uploadedSpy).toHaveBeenCalled();
    expect(component.uploadItems().length).toBe(0);
  });

  it('uploadFile_ApiError_SetsItemError', () => {
    mockDocumentService.uploadDocument.mockReturnValue(throwError(() => new Error('fail')));
    const file = new File(['content'], 'rules.pdf', { type: 'application/pdf' });
    const input = { target: { files: [file], value: '' } } as unknown as Event;
    component.onFileSelected(input);

    component.uploadFile(0);

    expect(component.uploadItems()[0].error).toBe('Upload failed. Please try again.');
    expect(component.uploadItems()[0].uploading).toBe(false);
  });

  it('removeItem_ValidIndex_RemovesFromQueue', () => {
    const file1 = new File(['a'], 'a.pdf');
    const file2 = new File(['b'], 'b.pdf');
    const input = { target: { files: [file1, file2], value: '' } } as unknown as Event;
    component.onFileSelected(input);

    component.removeItem(0);

    expect(component.uploadItems().length).toBe(1);
    expect(component.uploadItems()[0].file.name).toBe('b.pdf');
  });

  it('updateType_ValidIndex_UpdatesItemType', () => {
    const file = new File(['content'], 'rules.pdf');
    const input = { target: { files: [file], value: '' } } as unknown as Event;
    component.onFileSelected(input);

    component.updateType(0, 'faq');

    expect(component.uploadItems()[0].type).toBe('faq');
  });

  it('updateExpansion_ValidIndex_UpdatesItemExpansion', () => {
    const file = new File(['content'], 'rules.pdf');
    const input = { target: { files: [file], value: '' } } as unknown as Event;
    component.onFileSelected(input);

    component.updateExpansion(0, 'exp-1');

    expect(component.uploadItems()[0].expansionId).toBe('exp-1');
  });

  it('updateExpansion_EmptyString_SetsNull', () => {
    const file = new File(['content'], 'rules.pdf');
    const input = { target: { files: [file], value: '' } } as unknown as Event;
    component.onFileSelected(input);
    component.updateExpansion(0, 'exp-1');

    component.updateExpansion(0, '');

    expect(component.uploadItems()[0].expansionId).toBeNull();
  });

  it('formatFileSize_VariousValues_ReturnsHumanReadable', () => {
    expect(component.formatFileSize(100)).toBe('100 B');
    expect(component.formatFileSize(2048)).toBe('2.0 KB');
    expect(component.formatFileSize(5242880)).toBe('5.0 MB');
  });
});
