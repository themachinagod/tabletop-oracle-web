import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { DocumentContent } from '../../../models/document-content.model';
import { AdminDocumentService } from '../../../core/services/admin-document.service';
import { DocumentContentPreviewComponent } from './document-content-preview.component';

describe('DocumentContentPreviewComponent', () => {
  let component: DocumentContentPreviewComponent;
  let fixture: ComponentFixture<DocumentContentPreviewComponent>;
  let mockDocumentService: {
    getContentPreview: ReturnType<typeof vi.fn>;
    getDocument: ReturnType<typeof vi.fn>;
    listDocuments: ReturnType<typeof vi.fn>;
    uploadDocument: ReturnType<typeof vi.fn>;
    uploadVersion: ReturnType<typeof vi.fn>;
    reclassifyDocument: ReturnType<typeof vi.fn>;
    reassociateDocument: ReturnType<typeof vi.fn>;
    deleteDocument: ReturnType<typeof vi.fn>;
    retryProcessing: ReturnType<typeof vi.fn>;
    getVersionHistory: ReturnType<typeof vi.fn>;
  };

  const mockContent: DocumentContent = {
    document_id: 'doc-1',
    format: 'pdf',
    sections: [
      {
        title: 'Introduction',
        level: 1,
        content: 'Welcome to the game.',
        page_number: 1,
        children: [
          {
            title: 'Getting Started',
            level: 2,
            content: 'First, set up the board.',
            page_number: 2,
            children: [],
          },
          {
            title: 'Components',
            level: 2,
            content: '',
            page_number: 3,
            children: [
              {
                title: 'Cards',
                level: 3,
                content: 'There are 52 cards.',
                page_number: 3,
                children: [],
              },
            ],
          },
        ],
      },
      {
        title: 'Rules',
        level: 1,
        content: 'Follow these rules.',
        page_number: 5,
        children: [],
      },
    ],
    tables: [
      {
        caption: 'Weapon Stats',
        section_path: 'Rules > Combat',
        headers: ['Name', 'Damage', 'Range'],
        row_count: 15,
      },
    ],
    image_descriptions: [
      {
        location: 'Page 4, Figure 1',
        description: 'Board layout diagram showing initial setup',
        confidence: 'high',
      },
    ],
    stats: {
      total_sections: 5,
      total_tables: 1,
      total_images: 1,
      total_chunks: 42,
      total_characters: 15000,
      estimated_tokens: 3750,
    },
  };

  beforeEach(async () => {
    mockDocumentService = {
      getContentPreview: vi.fn().mockReturnValue(of(mockContent)),
      getDocument: vi.fn().mockReturnValue(of({})),
      listDocuments: vi.fn().mockReturnValue(of({ data: [], pagination: { page: 1, page_size: 25, total_items: 0, total_pages: 0 } })),
      uploadDocument: vi.fn().mockReturnValue(of({})),
      uploadVersion: vi.fn().mockReturnValue(of({})),
      reclassifyDocument: vi.fn().mockReturnValue(of({})),
      reassociateDocument: vi.fn().mockReturnValue(of({})),
      deleteDocument: vi.fn().mockReturnValue(of(undefined)),
      retryProcessing: vi.fn().mockReturnValue(of({})),
      getVersionHistory: vi.fn().mockReturnValue(of([])),
    };

    await TestBed.configureTestingModule({
      imports: [DocumentContentPreviewComponent],
      providers: [
        { provide: AdminDocumentService, useValue: mockDocumentService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DocumentContentPreviewComponent);
    component = fixture.componentInstance;
    component.gameId = 'game-1';
    component.documentId = 'doc-1';
  });

  it('ngOnInit_ValidIds_LoadsContentPreview', () => {
    fixture.detectChanges();

    expect(mockDocumentService.getContentPreview).toHaveBeenCalledWith('game-1', 'doc-1');
    expect(component.content()).toEqual(mockContent);
    expect(component.loading()).toBe(false);
  });

  it('ngOnInit_ApiError_SetsErrorMessage', () => {
    mockDocumentService.getContentPreview.mockReturnValue(
      throwError(() => new Error('fail')),
    );
    fixture.detectChanges();

    expect(component.error()).toBe('Failed to load content preview.');
    expect(component.loading()).toBe(false);
    expect(component.content()).toBeNull();
  });

  it('ngOnInit_WhileLoading_ShowsLoadingState', () => {
    expect(component.loading()).toBe(true);
    expect(component.content()).toBeNull();
  });

  it('toggleSection_NewPath_CollapsesSection', () => {
    fixture.detectChanges();
    component.toggleSection('0');

    expect(component.isSectionCollapsed('0')).toBe(true);
  });

  it('toggleSection_ExistingPath_ExpandsSection', () => {
    fixture.detectChanges();
    component.toggleSection('0');
    component.toggleSection('0');

    expect(component.isSectionCollapsed('0')).toBe(false);
  });

  it('toggleSection_MultiplePaths_TracksIndependently', () => {
    fixture.detectChanges();
    component.toggleSection('0');
    component.toggleSection('1');

    expect(component.isSectionCollapsed('0')).toBe(true);
    expect(component.isSectionCollapsed('1')).toBe(true);

    component.toggleSection('0');

    expect(component.isSectionCollapsed('0')).toBe(false);
    expect(component.isSectionCollapsed('1')).toBe(true);
  });

  it('isSectionCollapsed_UnknownPath_ReturnsFalse', () => {
    fixture.detectChanges();

    expect(component.isSectionCollapsed('nonexistent')).toBe(false);
  });

  it('buildSectionPath_RootLevel_ReturnsIndex', () => {
    expect(component.buildSectionPath('', 0)).toBe('0');
    expect(component.buildSectionPath('', 2)).toBe('2');
  });

  it('buildSectionPath_NestedLevel_ReturnsDottedPath', () => {
    expect(component.buildSectionPath('0', 1)).toBe('0.1');
    expect(component.buildSectionPath('0.1', 0)).toBe('0.1.0');
  });

  it('formatConfidence_LowercaseInput_ReturnsCapitalized', () => {
    expect(component.formatConfidence('high')).toBe('High');
    expect(component.formatConfidence('medium')).toBe('Medium');
    expect(component.formatConfidence('low')).toBe('Low');
  });

  it('formatNumber_LargeNumber_ReturnsFormattedString', () => {
    const result = component.formatNumber(15000);

    expect(result).toBe((15000).toLocaleString());
  });

  it('dismissError_WithError_ClearsError', () => {
    mockDocumentService.getContentPreview.mockReturnValue(
      throwError(() => new Error('fail')),
    );
    fixture.detectChanges();

    expect(component.error()).toBe('Failed to load content preview.');

    component.dismissError();

    expect(component.error()).toBeNull();
  });

  it('content_WithSections_HasNestedChildren', () => {
    fixture.detectChanges();

    const content = component.content();
    expect(content).not.toBeNull();
    expect(content!.sections).toHaveLength(2);
    expect(content!.sections[0].children).toHaveLength(2);
    expect(content!.sections[0].children[1].children).toHaveLength(1);
  });

  it('content_WithTables_HasTableData', () => {
    fixture.detectChanges();

    const content = component.content();
    expect(content!.tables).toHaveLength(1);
    expect(content!.tables[0].caption).toBe('Weapon Stats');
    expect(content!.tables[0].headers).toEqual(['Name', 'Damage', 'Range']);
    expect(content!.tables[0].row_count).toBe(15);
  });

  it('content_WithImages_HasImageDescriptions', () => {
    fixture.detectChanges();

    const content = component.content();
    expect(content!.image_descriptions).toHaveLength(1);
    expect(content!.image_descriptions[0].confidence).toBe('high');
  });

  it('content_Stats_ReflectsDocumentMetrics', () => {
    fixture.detectChanges();

    const stats = component.content()!.stats;
    expect(stats.total_sections).toBe(5);
    expect(stats.total_tables).toBe(1);
    expect(stats.total_images).toBe(1);
    expect(stats.total_chunks).toBe(42);
    expect(stats.estimated_tokens).toBe(3750);
  });
});
