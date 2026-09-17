"use client";

import { useState, useEffect, useRef } from "react";
import type { User } from "@supabase/supabase-js";
import type { Participant } from "@/types/participant.types";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useSavedParticipant } from "./useSavedParticipant";

export type AuthGuardStatus =
  | "loading"
  | "unauthenticated"
  | "authenticated_unregistered"
  | "authenticated_registered";

export interface AuthGuardState {
  status: AuthGuardStatus;
  user: User | null;
  participant: Participant | null;
  isLoading: boolean;
  registrationsOpen: boolean;
}

export function useAuthGuard(): AuthGuardState {
  const { savedParticipant, saveParticipant, clearParticipant } = useSavedParticipant();
  const [status, setStatus] = useState<AuthGuardStatus>(() => {
    return getSupabaseBrowserClient() ? "loading" : "unauthenticated";
  });
  const [user, setUser] = useState<User | null>(null);
  const [participant, setParticipant] = useState<Participant | null>(savedParticipant);
  const [registrationsOpen, setRegistrationsOpen] = useState(true);

  const checkedUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    let active = true;
    const supabase = getSupabaseBrowserClient();

    async function syncRegistrationsStatus() {
      try {
        const res = await fetch("/api/participants", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (typeof data?.registrationsOpen === "boolean" && active) {
            setRegistrationsOpen(data.registrationsOpen);
          }
        }
      } catch {
        /* ignore registration status sync error */
      }
    }

    syncRegistrationsStatus();
    window.addEventListener("focus", syncRegistrationsStatus);

    if (!supabase) {
      return () => {
        active = false;
        window.removeEventListener("focus", syncRegistrationsStatus);
      };
    }

    async function evaluateUser(authUser: User | null) {
      if (!active) return;

      if (!authUser) {
        checkedUserIdRef.current = null;
        setUser(null);
        setParticipant(null);
        clearParticipant();
        setStatus("unauthenticated");
        return;
      }

      setUser(authUser);

      const currentUser = authUser;
      const isExplicitlyRemoved =
        currentUser.user_metadata?.custom_avatar_removed === true;

      function resolveAvatar(preferred?: string | null): string | null {
        // 1. Prioridade máxima: avatar explícito do participante / banco de dados
        if (typeof preferred === "string" && preferred.trim() !== "") {
          return preferred.trim();
        }
        // 2. Se o participante removeu expressamente a foto, não restaura Google picture
        if (isExplicitlyRemoved || preferred === null) {
          return null;
        }
        // 3. Fallback inicial apenas se o participante nunca definiu ou removeu
        return (
          currentUser.user_metadata?.avatar_url ||
          currentUser.user_metadata?.picture ||
          null
        );
      }

      // 1. Fast path: check if currently cached participant belongs to this authenticated user
      const cachedMatches =
        savedParticipant &&
        ((savedParticipant.authUserId && savedParticipant.authUserId === authUser.id) ||
          (savedParticipant.email &&
            authUser.email &&
            savedParticipant.email.toLowerCase() === authUser.email.toLowerCase()));

      if (cachedMatches) {
        const enrichedCached = {
          ...savedParticipant,
          avatarUrl: resolveAvatar(savedParticipant.avatarUrl),
        };
        setParticipant(enrichedCached);
        setStatus("authenticated_registered");
      }

      // Avoid duplicate network requests for the same user ID in the same render cycle
      if (checkedUserIdRef.current === authUser.id && cachedMatches) {
        return;
      }
      checkedUserIdRef.current = authUser.id;

      // 2. Query database for single source of truth
      try {
        const email = authUser.email || "";
        const authUserId = authUser.id || "";
        const res = await fetch(
          `/api/participants?authUserId=${encodeURIComponent(authUserId)}&email=${encodeURIComponent(email)}`,
          { cache: "no-store" },
        );

        if (!active) return;

        if (res.ok) {
          const data = await res.json();
          if (typeof data?.registrationsOpen === "boolean") {
            setRegistrationsOpen(data.registrationsOpen);
          }
          if (data?.registered && data?.participant) {
            const resolved = resolveAvatar(
              data.participant.avatarUrl !== undefined
                ? data.participant.avatarUrl
                : savedParticipant?.avatarUrl,
            );
            const enrichedParticipant = {
              ...data.participant,
              avatarUrl: resolved,
            };
            saveParticipant(enrichedParticipant);
            setParticipant(enrichedParticipant);
            setStatus("authenticated_registered");
            return;
          }
        }

        // Unregistered in database
        clearParticipant();
        setParticipant(null);
        setStatus("authenticated_unregistered");
      } catch (err) {
        console.error("Auth status verification error:", err);
        if (!active) return;
        if (cachedMatches) {
          setStatus("authenticated_registered");
        } else {
          setStatus("authenticated_unregistered");
        }
      }
    }

    // Initial session retrieval
    supabase.auth.getSession().then(({ data: { session } }) => {
      evaluateUser(session?.user || null);
    });

    // Reactive session state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      evaluateUser(session?.user || null);
    });

    return () => {
      active = false;
      window.removeEventListener("focus", syncRegistrationsStatus);
      authListener.subscription.unsubscribe();
    };
  }, [savedParticipant, saveParticipant, clearParticipant]);

  return {
    status,
    user,
    participant,
    isLoading: status === "loading",
    registrationsOpen,
  };
}
