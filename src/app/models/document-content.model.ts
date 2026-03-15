/** Extracted content preview response from the document processing pipeline. */
export interface DocumentContent {
  document_id: string;
  format: string;
  sections: ContentSection[];
  tables: ContentTable[];
  image_descriptions: ImageDescription[];
  stats: PreviewStats;
}

/** A section of extracted document content, forming a recursive tree. */
export interface ContentSection {
  title: string;
  level: number;
  content: string;
  page_number: number | null;
  children: ContentSection[];
}

/** Summary of a table found within the document. */
export interface ContentTable {
  caption: string;
  section_path: string;
  headers: string[];
  row_count: number;
}

/** Description of an image found within the document. */
export interface ImageDescription {
  location: string;
  description: string;
  confidence: string;
}

/** Aggregate statistics for the extracted document content. */
export interface PreviewStats {
  total_sections: number;
  total_tables: number;
  total_images: number;
  total_chunks: number;
  total_characters: number;
  estimated_tokens: number;
}
