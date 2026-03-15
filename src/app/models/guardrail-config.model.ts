/**
 * Guardrail configuration types for token usage limits.
 *
 * Guardrails control usage limits across the system. When enforcement
 * is enabled, requests exceeding limits are rejected. When disabled,
 * usage is tracked but not limited.
 */

/** Guardrail configuration as returned by the API. */
export interface GuardrailConfig {
  /** Whether guardrail enforcement is active. */
  enforcement_enabled: boolean;

  /** Max tokens allowed per single query. Null means unlimited. */
  max_tokens_per_query: number | null;

  /** Max model API calls per single query. Null means unlimited. */
  max_model_calls_per_query: number | null;

  /** Max queries per session. Null means unlimited. */
  max_queries_per_session: number | null;

  /** Daily token budget across all usage. Null means unlimited. */
  daily_token_budget: number | null;

  /** Daily query budget across all users. Null means unlimited. */
  daily_query_budget: number | null;

  /** Max tokens for ingesting a single document. Null means unlimited. */
  per_document_ingestion_limit: number | null;

  /** When this config was last updated. */
  updated_at: string;
}

/** Partial update payload for guardrail config. All fields optional. */
export interface GuardrailConfigUpdate {
  enforcement_enabled?: boolean;
  max_tokens_per_query?: number | null;
  max_model_calls_per_query?: number | null;
  max_queries_per_session?: number | null;
  daily_token_budget?: number | null;
  daily_query_budget?: number | null;
  per_document_ingestion_limit?: number | null;
}
