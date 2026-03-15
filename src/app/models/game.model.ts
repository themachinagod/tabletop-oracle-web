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

/** Expansion detail returned within a game detail response. */
export interface ExpansionDetail {
  id: string;
  name: string;
  description: string | null;
  year_published: number | null;
  is_active: boolean;
}

/** Full game detail including expansions (from GET /games/:id). */
export interface GameDetail extends GameSummary {
  created_by: string;
  archived_at: string | null;
  expansions: ExpansionDetail[];
}

/** Sorting options for game list endpoint. */
export type GameSortOption = 'name' | '-updated_at' | '-created_at';

/** Filter parameters for the game list endpoint. */
export interface GameFilters {
  search?: string;
  player_count?: number;
  complexity?: ComplexityLevel[];
  tags?: string[];
  sort?: GameSortOption;
  page?: number;
  page_size?: number;
}

/** Tag with usage count returned by the tags endpoint. */
export interface TagCount {
  tag: string;
  count: number;
}

/** Payload for creating an expansion (POST /games/:id/expansions). */
export interface ExpansionCreate {
  name: string;
  description?: string;
  year_published?: number;
}

/** Payload for updating expansion metadata (PATCH /games/:id/expansions/:eid). */
export type ExpansionUpdate = Partial<ExpansionCreate>;

/** Payload for creating a new game (POST /games). */
export interface GameCreate {
  name: string;
  publisher?: string;
  year_published?: number;
  edition?: string;
  min_players?: number;
  max_players?: number;
  description?: string;
  complexity?: ComplexityLevel;
  tags?: string[];
}

/** Payload for updating game metadata (PATCH /games/:id). */
export type GameUpdate = Partial<GameCreate>;

/** Status filter options for admin game listing. */
export type AdminGameStatus = 'active' | 'archived' | 'all';

/** Filter parameters for admin game list endpoint. */
export interface AdminGameFilters {
  search?: string;
  status?: AdminGameStatus;
  sort?: string;
  page?: number;
  page_size?: number;
}
