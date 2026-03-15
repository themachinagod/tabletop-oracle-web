/**
 * Model slot types for AI model configuration management.
 *
 * Each model slot maps an AI capability to a specific provider/model
 * combination. The 6 capabilities are fixed; curators configure which
 * provider and model serves each one.
 */

/** The fixed set of AI capabilities that have configurable model slots. */
export type ModelCapability =
  | 'intent_analysis'
  | 'retrieval_augmentation'
  | 'answer_synthesis'
  | 'clarification_generation'
  | 'concept_extraction'
  | 'vision_processing';

/** A configured model slot as returned by the API. */
export interface ModelSlot {
  /** Which AI capability this slot serves. */
  capability: ModelCapability;

  /** AI provider identifier (e.g., 'openai', 'anthropic'). */
  provider: string;

  /** Provider-specific model identifier (e.g., 'gpt-4o'). */
  model_id: string;

  /** Sampling temperature (0.0-2.0). Null means provider default. */
  temperature: number | null;

  /** Max tokens per API call. Null means provider default. */
  max_tokens_per_call: number | null;

  /** Fallback provider if primary is unavailable. */
  fallback_provider: string | null;

  /** Fallback model if primary is unavailable. */
  fallback_model_id: string | null;

  /** When this slot was last updated. */
  updated_at: string;
}

/** Partial update payload for a model slot. All fields optional. */
export interface ModelSlotUpdate {
  provider?: string;
  model_id?: string;
  temperature?: number | null;
  max_tokens_per_call?: number | null;
  fallback_provider?: string | null;
  fallback_model_id?: string | null;
}
