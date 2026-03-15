/** Document type classification options. */
export type DocumentType =
  | 'core_rules'
  | 'faq'
  | 'errata'
  | 'expansion_rules'
  | 'strategy'
  | 'other';

/** Document file format. */
export type DocumentFormat = 'pdf' | 'markdown' | 'text' | 'html' | 'docx';

/** Document processing pipeline status. */
export type DocumentStatus = 'uploaded' | 'parsing' | 'processed' | 'error';

/** Document summary returned in list endpoints. */
export interface DocumentSummary {
  id: string;
  game_id: string;
  expansion_id: string | null;
  expansion_name: string | null;
  name: string;
  type: DocumentType;
  format: DocumentFormat;
  status: DocumentStatus;
  current_version: number;
  file_size: number;
  uploaded_at: string;
  processed_at: string | null;
  error_message: string | null;
}

/** Full document detail including chunk count. */
export interface DocumentDetail extends DocumentSummary {
  /** Populated when status === 'processed'. */
  chunk_count: number | null;
}

/** Version entry in document version history. */
export interface DocumentVersion {
  version: number;
  file_size: number;
  uploaded_at: string;
  uploaded_by_name: string;
  is_active: boolean;
}

/** Classification payload used during document upload. */
export interface UploadClassification {
  name: string;
  type: DocumentType;
  expansion_id: string | null;
}

/** Filter parameters for document list endpoint. */
export interface DocumentFilters {
  status?: DocumentStatus;
  type?: DocumentType;
  sort?: string;
  page?: number;
  page_size?: number;
}

/** Human-readable label mapping for document types. */
export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  core_rules: 'Core Rules',
  faq: 'FAQ',
  errata: 'Errata',
  expansion_rules: 'Expansion Rules',
  strategy: 'Strategy',
  other: 'Other',
};

/** All document type options for dropdowns. */
export const DOCUMENT_TYPE_OPTIONS: DocumentType[] = [
  'core_rules',
  'faq',
  'errata',
  'expansion_rules',
  'strategy',
  'other',
];

/** Allowed file extensions for document upload. */
export const ALLOWED_EXTENSIONS = ['.pdf', '.md', '.txt', '.html', '.docx'];

/** Maximum file size in bytes (50MB). */
export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;
