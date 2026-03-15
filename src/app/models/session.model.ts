import { ExpansionRef } from './game.model';

/** Session status. */
export type SessionStatus = 'active' | 'archived';

/** Session summary returned in list endpoints. */
export interface SessionSummary {
  id: string;
  game_id: string;
  game_name: string;
  game_cover_image_url: string | null;
  name: string;
  player_count: number | null;
  status: SessionStatus;
  expansions: ExpansionRef[];
  last_active_at: string;
  created_at: string;
  last_message_preview: string | null;
  message_count: number;
}

/** Filter parameters for listing sessions. */
export interface SessionFilters {
  /** Filter by session status. */
  status?: SessionStatus;
  /** Filter by game ID. */
  game_id?: string;
  /** Sort field with direction prefix (e.g., '-last_active_at'). */
  sort?: string;
  /** Page number (1-indexed). */
  page?: number;
  /** Page size. */
  page_size?: number;
}

/** Payload for creating a new session. */
export interface SessionCreate {
  /** Game ID to create the session for. */
  game_id: string;
  /** IDs of selected expansions to include in the session. */
  expansion_ids: string[];
  /** Optional player count for the session. */
  player_count?: number;
  /** Session display name. */
  name: string;
}

/** Payload for updating a session's status. */
export interface SessionStatusUpdate {
  status: SessionStatus;
}
