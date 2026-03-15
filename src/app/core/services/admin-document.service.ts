import { HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PaginatedResult } from '../../models/api.model';
import {
  DocumentDetail,
  DocumentFilters,
  DocumentSummary,
  DocumentType,
  DocumentVersion,
  UploadClassification,
} from '../../models/document.model';
import { ApiService } from '../api/api.service';

/** Default page size for document listings. */
const DEFAULT_PAGE_SIZE = 25;

/**
 * Curator-scoped document management service.
 *
 * Provides CRUD operations, file upload, versioning, reclassification,
 * and re-association for documents within a game context. All endpoints
 * are scoped to a parent game ID.
 */
@Injectable({ providedIn: 'root' })
export class AdminDocumentService {
  private readonly api = inject(ApiService);

  /**
   * List documents for a game with optional filters.
   *
   * @param gameId - The parent game ID.
   * @param filters - Optional filters (status, type, sort, page, page_size).
   * @returns Observable of paginated document summaries.
   */
  listDocuments(
    gameId: string,
    filters: DocumentFilters = {},
  ): Observable<PaginatedResult<DocumentSummary>> {
    const params = this.buildFilterParams(filters);
    return this.api.getPaginated<DocumentSummary>(`/games/${gameId}/documents`, params);
  }

  /**
   * Get full document detail.
   *
   * @param gameId - The parent game ID.
   * @param documentId - The document ID.
   * @returns Observable of the document detail.
   */
  getDocument(gameId: string, documentId: string): Observable<DocumentDetail> {
    return this.api.get<DocumentDetail>(`/games/${gameId}/documents/${documentId}`);
  }

  /**
   * Upload a new document with classification metadata.
   *
   * Uses multipart/form-data. The file is sent alongside name, type,
   * and optional expansion_id fields.
   *
   * @param gameId - The parent game ID.
   * @param file - The file to upload.
   * @param classification - Name, type, and expansion association.
   * @returns Observable of the created document detail.
   */
  uploadDocument(
    gameId: string,
    file: File,
    classification: UploadClassification,
  ): Observable<DocumentDetail> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', classification.name);
    formData.append('type', classification.type);
    if (classification.expansion_id) {
      formData.append('expansion_id', classification.expansion_id);
    }
    return this.api.postMultipart<DocumentDetail>(`/games/${gameId}/documents`, formData);
  }

  /**
   * Upload a new version of an existing document.
   *
   * @param gameId - The parent game ID.
   * @param documentId - The document ID to version.
   * @param file - The new version file.
   * @returns Observable of the created document version.
   */
  uploadVersion(
    gameId: string,
    documentId: string,
    file: File,
  ): Observable<DocumentVersion> {
    const formData = new FormData();
    formData.append('file', file);
    return this.api.postMultipart<DocumentVersion>(
      `/games/${gameId}/documents/${documentId}/versions`,
      formData,
    );
  }

  /**
   * Reclassify document type.
   *
   * @param gameId - The parent game ID.
   * @param documentId - The document ID.
   * @param type - The new document type.
   * @returns Observable of the updated document detail.
   */
  reclassifyDocument(
    gameId: string,
    documentId: string,
    type: DocumentType,
  ): Observable<DocumentDetail> {
    return this.api.put<DocumentDetail>(
      `/games/${gameId}/documents/${documentId}/type`,
      { type },
    );
  }

  /**
   * Change document expansion association.
   *
   * @param gameId - The parent game ID.
   * @param documentId - The document ID.
   * @param expansionId - The new expansion ID, or null for base game.
   * @returns Observable of the updated document detail.
   */
  reassociateDocument(
    gameId: string,
    documentId: string,
    expansionId: string | null,
  ): Observable<DocumentDetail> {
    return this.api.put<DocumentDetail>(
      `/games/${gameId}/documents/${documentId}/expansion`,
      { expansion_id: expansionId },
    );
  }

  /**
   * Delete a document.
   *
   * @param gameId - The parent game ID.
   * @param documentId - The document ID to delete.
   * @returns Observable completing on successful deletion.
   */
  deleteDocument(gameId: string, documentId: string): Observable<void> {
    return this.api.delete<void>(`/games/${gameId}/documents/${documentId}`);
  }

  /**
   * Retry failed document processing.
   *
   * @param gameId - The parent game ID.
   * @param documentId - The document ID to reprocess.
   * @returns Observable of the updated document detail.
   */
  retryProcessing(gameId: string, documentId: string): Observable<DocumentDetail> {
    return this.api.post<DocumentDetail>(
      `/games/${gameId}/documents/${documentId}/reprocess`,
      {},
    );
  }

  /**
   * Get document version history.
   *
   * @param gameId - The parent game ID.
   * @param documentId - The document ID.
   * @returns Observable of version entries ordered newest first.
   */
  getVersionHistory(
    gameId: string,
    documentId: string,
  ): Observable<DocumentVersion[]> {
    return this.api.get<DocumentVersion[]>(
      `/games/${gameId}/documents/${documentId}/versions`,
    );
  }

  /**
   * Build HTTP query parameters from document filters.
   */
  private buildFilterParams(filters: DocumentFilters): HttpParams {
    let params = new HttpParams();

    if (filters.status) {
      params = params.set('status', filters.status);
    }
    if (filters.type) {
      params = params.set('type', filters.type);
    }
    if (filters.sort) {
      params = params.set('sort', filters.sort);
    }
    if (filters.page) {
      params = params.set('page', filters.page.toString());
    }

    params = params.set('page_size', (filters.page_size ?? DEFAULT_PAGE_SIZE).toString());

    return params;
  }
}
