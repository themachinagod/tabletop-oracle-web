import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, throwError } from 'rxjs';
import {
  DocumentDetail,
  DocumentSummary,
  DocumentVersion,
  UploadClassification,
} from '../../models/document.model';
import { PaginatedResult } from '../../models/api.model';
import { ApiService } from '../api/api.service';
import { AdminDocumentService } from './admin-document.service';

describe('AdminDocumentService', () => {
  let service: AdminDocumentService;
  let mockApi: {
    get: ReturnType<typeof vi.fn>;
    getPaginated: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    postMultipart: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  const mockDocument: DocumentDetail = {
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

  const mockVersion: DocumentVersion = {
    version: 2,
    file_size: 2048000,
    uploaded_at: '2026-02-01T00:00:00Z',
    uploaded_by_name: 'Curator',
    is_active: true,
  };

  const paginatedResult: PaginatedResult<DocumentSummary> = {
    data: [mockDocument],
    pagination: { page: 1, page_size: 25, total_items: 1, total_pages: 1 },
  };

  beforeEach(() => {
    mockApi = {
      get: vi.fn().mockReturnValue(of(mockDocument)),
      getPaginated: vi.fn().mockReturnValue(of(paginatedResult)),
      post: vi.fn().mockReturnValue(of(mockDocument)),
      postMultipart: vi.fn().mockReturnValue(of(mockDocument)),
      put: vi.fn().mockReturnValue(of(mockDocument)),
      delete: vi.fn().mockReturnValue(of(undefined)),
    };

    TestBed.configureTestingModule({
      providers: [AdminDocumentService, { provide: ApiService, useValue: mockApi }],
    });

    service = TestBed.inject(AdminDocumentService);
  });

  describe('listDocuments', () => {
    it('listDocuments_NoFilters_CallsWithDefaultPageSize', async () => {
      const result = await firstValueFrom(service.listDocuments('game-1'));

      expect(result).toEqual(paginatedResult);
      expect(mockApi.getPaginated).toHaveBeenCalledWith(
        '/games/game-1/documents',
        expect.objectContaining({}),
      );
    });

    it('listDocuments_WithFilters_IncludesFilterParams', async () => {
      await firstValueFrom(
        service.listDocuments('game-1', { status: 'processed', type: 'faq', sort: '-uploaded_at' }),
      );

      const params = mockApi.getPaginated.mock.calls[0][1];
      expect(params.get('status')).toBe('processed');
      expect(params.get('type')).toBe('faq');
      expect(params.get('sort')).toBe('-uploaded_at');
    });

    it('listDocuments_ApiError_PropagatesError', async () => {
      mockApi.getPaginated.mockReturnValue(throwError(() => new Error('Network error')));

      await expect(firstValueFrom(service.listDocuments('game-1'))).rejects.toThrow(
        'Network error',
      );
    });
  });

  describe('getDocument', () => {
    it('getDocument_ValidIds_CallsCorrectEndpoint', async () => {
      const result = await firstValueFrom(service.getDocument('game-1', 'doc-1'));

      expect(result).toEqual(mockDocument);
      expect(mockApi.get).toHaveBeenCalledWith('/games/game-1/documents/doc-1');
    });

    it('getDocument_ApiError_PropagatesError', async () => {
      mockApi.get.mockReturnValue(throwError(() => new Error('Not found')));

      await expect(firstValueFrom(service.getDocument('game-1', 'bad-id'))).rejects.toThrow(
        'Not found',
      );
    });
  });

  describe('uploadDocument', () => {
    it('uploadDocument_ValidPayload_PostsMultipartFormData', async () => {
      const file = new File(['content'], 'rules.pdf', { type: 'application/pdf' });
      const classification: UploadClassification = {
        name: 'Core Rulebook',
        type: 'core_rules',
        expansion_id: null,
      };

      await firstValueFrom(service.uploadDocument('game-1', file, classification));

      expect(mockApi.postMultipart).toHaveBeenCalledWith(
        '/games/game-1/documents',
        expect.any(FormData),
      );
    });

    it('uploadDocument_WithExpansion_IncludesExpansionId', async () => {
      const file = new File(['content'], 'rules.pdf', { type: 'application/pdf' });
      const classification: UploadClassification = {
        name: 'Expansion Rules',
        type: 'expansion_rules',
        expansion_id: 'exp-1',
      };

      await firstValueFrom(service.uploadDocument('game-1', file, classification));

      const formData: FormData = mockApi.postMultipart.mock.calls[0][1];
      expect(formData.get('expansion_id')).toBe('exp-1');
    });

    it('uploadDocument_ApiError_PropagatesError', async () => {
      mockApi.postMultipart.mockReturnValue(throwError(() => new Error('Upload failed')));
      const file = new File(['content'], 'rules.pdf');

      await expect(
        firstValueFrom(
          service.uploadDocument('game-1', file, { name: 'x', type: 'other', expansion_id: null }),
        ),
      ).rejects.toThrow('Upload failed');
    });
  });

  describe('uploadVersion', () => {
    it('uploadVersion_ValidPayload_PostsMultipartToVersionsEndpoint', async () => {
      mockApi.postMultipart.mockReturnValue(of(mockVersion));
      const file = new File(['content v2'], 'rules-v2.pdf');

      const result = await firstValueFrom(service.uploadVersion('game-1', 'doc-1', file));

      expect(result).toEqual(mockVersion);
      expect(mockApi.postMultipart).toHaveBeenCalledWith(
        '/games/game-1/documents/doc-1/versions',
        expect.any(FormData),
      );
    });
  });

  describe('reclassifyDocument', () => {
    it('reclassifyDocument_ValidType_PutsToTypeEndpoint', async () => {
      await firstValueFrom(service.reclassifyDocument('game-1', 'doc-1', 'faq'));

      expect(mockApi.put).toHaveBeenCalledWith('/games/game-1/documents/doc-1/type', {
        type: 'faq',
      });
    });
  });

  describe('reassociateDocument', () => {
    it('reassociateDocument_WithExpansion_PutsToExpansionEndpoint', async () => {
      await firstValueFrom(service.reassociateDocument('game-1', 'doc-1', 'exp-1'));

      expect(mockApi.put).toHaveBeenCalledWith('/games/game-1/documents/doc-1/expansion', {
        expansion_id: 'exp-1',
      });
    });

    it('reassociateDocument_NullExpansion_SendsNull', async () => {
      await firstValueFrom(service.reassociateDocument('game-1', 'doc-1', null));

      expect(mockApi.put).toHaveBeenCalledWith('/games/game-1/documents/doc-1/expansion', {
        expansion_id: null,
      });
    });
  });

  describe('deleteDocument', () => {
    it('deleteDocument_ValidIds_CallsDeleteEndpoint', async () => {
      await firstValueFrom(service.deleteDocument('game-1', 'doc-1'));

      expect(mockApi.delete).toHaveBeenCalledWith('/games/game-1/documents/doc-1');
    });

    it('deleteDocument_ApiError_PropagatesError', async () => {
      mockApi.delete.mockReturnValue(throwError(() => new Error('Forbidden')));

      await expect(firstValueFrom(service.deleteDocument('game-1', 'doc-1'))).rejects.toThrow(
        'Forbidden',
      );
    });
  });

  describe('retryProcessing', () => {
    it('retryProcessing_ValidIds_PostsToReprocessEndpoint', async () => {
      await firstValueFrom(service.retryProcessing('game-1', 'doc-1'));

      expect(mockApi.post).toHaveBeenCalledWith('/games/game-1/documents/doc-1/reprocess', {});
    });
  });

  describe('getVersionHistory', () => {
    it('getVersionHistory_ValidIds_CallsVersionsEndpoint', async () => {
      mockApi.get.mockReturnValue(of([mockVersion]));

      const result = await firstValueFrom(service.getVersionHistory('game-1', 'doc-1'));

      expect(result).toEqual([mockVersion]);
      expect(mockApi.get).toHaveBeenCalledWith('/games/game-1/documents/doc-1/versions');
    });
  });
});
