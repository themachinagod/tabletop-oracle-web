import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { DocumentDetail } from '../../../models/document.model';
import { AdminDocumentService } from '../../../core/services/admin-document.service';
import { DocumentMetadataComponent } from './document-metadata.component';

describe('DocumentMetadataComponent', () => {
  let component: DocumentMetadataComponent;
  let fixture: ComponentFixture<DocumentMetadataComponent>;
  let mockDocumentService: {
    reclassifyDocument: ReturnType<typeof vi.fn>;
    reassociateDocument: ReturnType<typeof vi.fn>;
  };

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
      reclassifyDocument: vi.fn().mockReturnValue(of(mockDoc)),
      reassociateDocument: vi.fn().mockReturnValue(of(mockDoc)),
    };

    await TestBed.configureTestingModule({
      imports: [DocumentMetadataComponent],
      providers: [{ provide: AdminDocumentService, useValue: mockDocumentService }],
    }).compileComponents();

    fixture = TestBed.createComponent(DocumentMetadataComponent);
    component = fixture.componentInstance;
    component.document = mockDoc;
    component.gameId = 'game-1';
    fixture.detectChanges();
  });

  it('onTypeChange_DifferentType_CallsReclassifyService', () => {
    const updatedSpy = vi.spyOn(component.documentUpdated, 'emit');

    component.onTypeChange('faq');

    expect(mockDocumentService.reclassifyDocument).toHaveBeenCalledWith('game-1', 'doc-1', 'faq');
    expect(updatedSpy).toHaveBeenCalled();
    expect(component.feedback()).toBe('Type updated.');
  });

  it('onTypeChange_SameType_DoesNotCallService', () => {
    component.onTypeChange('core_rules');

    expect(mockDocumentService.reclassifyDocument).not.toHaveBeenCalled();
  });

  it('onTypeChange_ApiError_SetsFeedback', () => {
    mockDocumentService.reclassifyDocument.mockReturnValue(throwError(() => new Error('fail')));

    component.onTypeChange('faq');

    expect(component.feedback()).toBe('Failed to update type.');
    expect(component.saving()).toBe(false);
  });

  it('onExpansionChange_DifferentExpansion_CallsReassociateService', () => {
    const updatedSpy = vi.spyOn(component.documentUpdated, 'emit');

    component.onExpansionChange('exp-1');

    expect(mockDocumentService.reassociateDocument).toHaveBeenCalledWith('game-1', 'doc-1', 'exp-1');
    expect(updatedSpy).toHaveBeenCalled();
    expect(component.feedback()).toBe('Expansion updated.');
  });

  it('onExpansionChange_EmptyString_SendsNull', () => {
    component.document = { ...mockDoc, expansion_id: 'exp-1' };

    component.onExpansionChange('');

    expect(mockDocumentService.reassociateDocument).toHaveBeenCalledWith('game-1', 'doc-1', null);
  });

  it('onExpansionChange_SameExpansion_DoesNotCallService', () => {
    component.onExpansionChange('');

    expect(mockDocumentService.reassociateDocument).not.toHaveBeenCalled();
  });

  it('onExpansionChange_ApiError_SetsFeedback', () => {
    mockDocumentService.reassociateDocument.mockReturnValue(throwError(() => new Error('fail')));

    component.onExpansionChange('exp-1');

    expect(component.feedback()).toBe('Failed to update expansion.');
    expect(component.saving()).toBe(false);
  });

  it('formatFileSize_VariousValues_ReturnsHumanReadable', () => {
    expect(component.formatFileSize(512)).toBe('512 B');
    expect(component.formatFileSize(1536)).toBe('1.5 KB');
    expect(component.formatFileSize(3145728)).toBe('3.0 MB');
  });
});
