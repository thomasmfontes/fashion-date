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
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
  }

  return supabaseClient;
};

/**
 * Initiates OAuth sign-in with Google via Supabase.
 */
export async function signInWithGoogle(redirectTo?: string) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    throw new Error(
      "Configuração do Supabase ausente. Verifique NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const callbackUrl = redirectTo || `${origin}/auth/callback`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: callbackUrl,
      queryParams: {
        access_type: "offline",
        prompt: "select_account",
      },
    },
  });

  if (error) throw error;
  return data;
}

/**
 * Initiates OAuth sign-in with Microsoft (Azure) via Supabase.
 * Allows all Microsoft personal (@outlook, @hotmail) and corporate accounts.
 */
export async function signInWithMicrosoft(redirectTo?: string) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    throw new Error(
      "Configuração do Supabase ausente. Verifique NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const callbackUrl = redirectTo || `${origin}/auth/callback`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "azure",
    options: {
      redirectTo: callbackUrl,
      scopes: "openid profile email",
      queryParams: {
        prompt: "select_account",
      },
    },
  });

  if (error) throw error;
  return data;
}

/**
 * Signs out the current Supabase user and clears local session.
 */
export async function signOut() {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return;
  await supabase.auth.signOut();
}
