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
