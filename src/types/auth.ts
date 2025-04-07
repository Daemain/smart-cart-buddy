
import { User, Session } from '@supabase/supabase-js';

export interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
}

export interface Profile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  is_premium: boolean;
  created_at: string;
  updated_at: string;
}
