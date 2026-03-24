import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Browser-side Supabase client for Realtime subscriptions
// Not for auth — only for subscribing to DB changes
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
