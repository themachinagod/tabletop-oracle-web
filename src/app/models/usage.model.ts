/**
 * Usage analytics types for the admin dashboard.
 *
 * These interfaces map to the API responses from the usage
 * aggregation endpoints under `/api/v1/admin/usage/`.
 */

/** Predefined period options for the dashboard time selector. */
export type PeriodOption = '7d' | '30d' | '90d';

/** Usage summary for a given period. */
export interface UsageSummary {
  /** Total tokens consumed (input + output). */
  total_tokens: number;

  /** Total input tokens consumed. */
  input_tokens: number;

  /** Total output tokens consumed. */
  output_tokens: number;

  /** Number of distinct queries in the period. */
  total_queries: number;

  /** Number of distinct documents processed in the period. */
  total_documents_processed: number;

  /** Start of the reporting period. */
  period_start: string;

  /** End of the reporting period. */
  period_end: string;
}

/** Single day of usage trend data. */
export interface DailyUsage {
  /** Date in YYYY-MM-DD format. */
  date: string;

  /** Total tokens for this day. */
  total_tokens: number;

  /** Input tokens for this day. */
  input_tokens: number;

  /** Output tokens for this day. */
  output_tokens: number;

  /** Number of queries on this day. */
  query_count: number;

  /** Number of documents processed on this day. */
  document_count: number;
}

/** Token usage breakdown by AI capability. */
export interface CapabilityUsage {
  /** The AI capability name. */
  capability: string;

  /** Total tokens consumed by this capability. */
  total_tokens: number;

  /** Input tokens consumed by this capability. */
  input_tokens: number;

  /** Output tokens consumed by this capability. */
  output_tokens: number;

  /** Number of API calls for this capability. */
  call_count: number;
}

/** Token usage breakdown by game. */
export interface GameUsage {
  /** Game identifier. */
  game_id: string;

  /** Human-readable game name. */
  game_name: string;

  /** Tokens from query interactions. */
  query_tokens: number;

  /** Tokens from document ingestion. */
  ingestion_tokens: number;

  /** Number of queries for this game. */
  query_count: number;
}

/** Token usage breakdown by user. */
export interface UserUsage {
  /** User identifier. */
  user_id: string;

  /** User display name. */
  display_name: string;

  /** Total tokens consumed by this user. */
  total_tokens: number;

  /** Number of queries by this user. */
  query_count: number;
}

/** Status level for a single guardrail indicator. */
export type GuardrailStatusLevel = 'green' | 'amber' | 'red' | 'disabled';

/** A single guardrail's current status relative to its limit. */
export interface GuardrailItem {
  /** Internal guardrail name (e.g., 'daily_token_budget'). */
  name: string;

  /** Human-readable label (e.g., 'Daily Token Budget'). */
  label: string;

  /** Current usage value. */
  current: number;

  /** Configured limit. */
  limit: number;

  /** Computed status: green, amber, red, or disabled. */
  status: GuardrailStatusLevel;
}

/** Guardrail status response from the API. */
export interface GuardrailStatus {
  /** Whether guardrail enforcement is active. */
  enforcement_enabled: boolean;

  /** Individual guardrail statuses. */
  guardrails: GuardrailItem[];
}
