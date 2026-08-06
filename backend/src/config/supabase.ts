import { createClient } from "@supabase/supabase-js";
import { resolveSupabaseEnv, isSupabaseConfigured } from "./env";

let dbClient: any = null;

export function getSupabase() {
  if (isSupabaseConfigured()) {
    if (!dbClient) {
      const { url, key } = resolveSupabaseEnv();
      dbClient = createClient(url, key);
      console.log(`[Express Backend] Supabase client initialized -> ${url}`);
    }
    return dbClient;
  }
  return null;
}
