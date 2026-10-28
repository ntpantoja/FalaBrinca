import { createClient, type SupabaseClient } from "@supabase/supabase-js";
let browser: SupabaseClient | undefined;
export function browserAuth() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  browser ??= createClient(url, key);
  return browser;
}
