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

function getAppOrigin(): string {
  if (typeof window !== "undefined" && window.location.origin) {
    return window.location.origin;
  }
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }
  return "https://fashiondate.com.br";
}

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

  const origin = getAppOrigin();
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

  const origin = getAppOrigin();
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

/**
 * Completely signs out the current Supabase user, purges all auth tokens
 * and participant local storage keys, and triggers a clean transition.
 */
export async function performFullUserLogout(onLoggedOut?: () => void) {
  const supabase = getSupabaseBrowserClient();
  if (supabase) {
    try {
      await supabase.auth.signOut({ scope: "local" });
    } catch {
      /* ignore signout error */
    }
  }

  if (typeof window !== "undefined") {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (
          key &&
          (key.startsWith("sb-") ||
            key.startsWith("fashiondate_") ||
            key.startsWith("fashion_date_"))
        ) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
      sessionStorage.clear();
      window.dispatchEvent(new Event("fashion_date_participant_change"));
    } catch {
      /* ignore storage clear error */
    }

    if (onLoggedOut) {
      onLoggedOut();
    } else {
      window.location.assign("/");
    }
  }
}
