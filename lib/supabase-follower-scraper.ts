import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

export function getFollowerScraperSupabase(): SupabaseClient {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_FOLLOWER_SCRAPER_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_FOLLOWER_SCRAPER_SUPABASE_ANON_KEY;
    if (!url || !key) throw new Error("Follower scraper Supabase env vars not configured");
    _client = createClient(url, key);
  }
  return _client;
}

/** @deprecated use getFollowerScraperSupabase() */
export const followerScraperSupabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (getFollowerScraperSupabase() as any)[prop];
  },
});
