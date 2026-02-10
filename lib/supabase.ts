import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types pour TypeScript
export interface Session {
  id: string;
  host_id: string;
  created_at: string;
  is_active: boolean;
  name: string;
}

export interface Track {
  id: string;
  session_id: string;
  title: string;
  artist: string;
  album?: string;
  cover_url?: string;
  spotify_id?: string;
  suggested_by?: string;
  status: "pending" | "approved" | "rejected" | "played";
  created_at: string;
  order_index?: number;
}
