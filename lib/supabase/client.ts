import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let supabaseClient: SupabaseClient | null = null;

export const getSupabaseBrowserClient = (): SupabaseClient | null => {
  if (typeof window === "undefined") return null;

  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "https://ehgbrsnjwfdgxazhdhnr.supabase.co";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!anonKey) {
    return null;
  }

  if (!supabaseClient) {
    supabaseClient = createClient(url, anonKey, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
  }

  return supabaseClient;
};
