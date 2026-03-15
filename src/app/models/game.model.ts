/** Complexity classification for tabletop games. */
export type ComplexityLevel = 'light' | 'medium' | 'heavy';

/** Minimal expansion reference returned in session and game responses. */
export interface ExpansionRef {
  id: string;
  name: string;
}

/** Game summary returned in list/browse endpoints. */
export interface GameSummary {
  id: string;
  name: string;
  publisher: string | null;
  year_published: number | null;
  edition: string | null;
  min_players: number | null;
  max_players: number | null;
  description: string | null;
  cover_image_url: string | null;
  complexity: ComplexityLevel | null;
  tags: string[];
  is_active: boolean;
  document_count: number;
  expansion_count: number;
  created_at: string;
  updated_at: string;
}

/** Full game detail including expansions (from GET /games/:id). */
export interface GameDetail extends GameSummary {
  created_by: string;
  archived_at: string | null;
}
