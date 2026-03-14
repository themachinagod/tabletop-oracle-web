/** Authenticated user profile returned by the /auth/me endpoint. */
export interface User {
  id: string;
  email: string;
  display_name: string;
  role: 'player' | 'curator';
  created_at: string;
  last_login_at: string;
}
