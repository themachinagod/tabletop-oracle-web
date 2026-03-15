/**
 * Discriminated union of document processing SSE events.
 *
 * Maps the server-side `processing.*` event namespace to typed
 * client-side events. The `type` field acts as the discriminant
 * for exhaustive pattern matching.
 */
export type ProcessingEvent =
  | ProcessingStartedEvent
  | ProcessingStageEvent
  | ProcessingCompletedEvent
  | ProcessingErrorEvent
  | ProcessingUnknownEvent;

/** Processing has begun for a document. */
export interface ProcessingStartedEvent {
  readonly type: 'started';
  readonly documentId: string;
  readonly filename: string;
}

/** Processing has entered a new pipeline stage. */
export interface ProcessingStageEvent {
  readonly type: 'stage';
  readonly stage: string;
  readonly progress: number;
}

/** Processing completed successfully. */
export interface ProcessingCompletedEvent {
  readonly type: 'completed';
  readonly documentId: string;
  readonly chunkCount: number;
}

/** Processing failed with an error. */
export interface ProcessingErrorEvent {
  readonly type: 'error';
  readonly documentId: string;
  readonly code: string;
  readonly message: string;
}

/** Unrecognised event type (forward compatibility). */
export interface ProcessingUnknownEvent {
  readonly type: 'unknown';
}

/**
 * Human-readable labels for processing pipeline stages.
 *
 * Stage values correspond to the pipeline stages defined in PRD-004:
 * validation, text extraction, structure detection, chunking, and
 * KG integration.
 */
export const PROCESSING_STAGE_LABELS: Record<string, string> = {
  validating: 'Validating',
  extracting: 'Extracting Text',
  detecting_structure: 'Detecting Structure',
  chunking: 'Chunking',
  integrating: 'Integrating',
};
