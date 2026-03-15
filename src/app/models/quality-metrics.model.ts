/**
 * Quality metrics types for the admin dashboard.
 *
 * These interfaces map to the API responses from the quality
 * metrics endpoints under `/api/v1/admin/quality/`.
 */

/** Confidence score distribution across four buckets. */
export interface ConfidenceDistribution {
  /** Answers with confidence 0-25%. */
  '0_to_25': number;

  /** Answers with confidence 25-50%. */
  '25_to_50': number;

  /** Answers with confidence 50-75%. */
  '50_to_75': number;

  /** Answers with confidence 75-100%. */
  '75_to_100': number;
}

/** Quality metrics for a single game in a given period. */
export interface GameQualityMetrics {
  /** Game identifier. */
  game_id: string;

  /** Human-readable game name. */
  game_name: string;

  /** Total AI answers in the period. */
  total_answers: number;

  /** Fraction of answers with confidence < 0.5. */
  low_confidence_rate: number;

  /** Fraction of questions that triggered a clarification. */
  clarification_rate: number;

  /** Mean number of citations per answer. */
  avg_citations_per_answer: number;

  /** Number of positive feedback ratings. */
  feedback_positive_count: number;

  /** Number of negative feedback ratings. */
  feedback_negative_count: number;

  /** Confidence score distribution across four buckets. */
  confidence_distribution: ConfidenceDistribution;

  /** Average number of user questions per session. */
  avg_queries_per_session: number;
}
