"use client";

import { useState, useEffect, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useParticipantWallet } from "@/hooks/useParticipantWallet";
import { useSavedParticipant } from "@/hooks/useSavedParticipant";
import { ParticipantAppShell } from "@/components/participant/ParticipantAppShell";
import { performFullUserLogout } from "@/lib/supabase/client";
import { AuthLoadingScreen } from "@/components/public/AuthLoadingScreen";

const CONFETTI_COLORS = ["#c99b36", "#530017", "#e8c66d", "#8b2f47", "#f8efe1"];

export default function HomePage() {
  const router = useRouter();
  const { status, user, participant, isLoading } = useAuthGuard();
  const {
    tickets,
    eligibleDraws,
    hasTicket,
    getTicket,
    enterDraw,
  } = useParticipantWallet();
  const { clearParticipant } = useSavedParticipant();

  const [celebrating, setCelebrating] = useState(false);

  // Confetti celebration after registration
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isWelcome = sessionStorage.getItem("fashion_date_welcome") === "true";
      if (isWelcome) {
        sessionStorage.removeItem("fashion_date_welcome");
        setCelebrating(true);
        const timer = window.setTimeout(() => setCelebrating(false), 5500);
        return () => window.clearTimeout(timer);
      }
    }
  }, []);

  // Strict Route Guard for "/home"
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/");
    } else if (status === "authenticated_unregistered") {
      router.replace("/inscricao");
    }
  }, [status, router]);

  // Anti-flicker: while loading or if redirecting, render loader
  if (isLoading || status === "unauthenticated" || status === "authenticated_unregistered" || !participant) {
    return <AuthLoadingScreen message="Carregando Painel do Participante" />;
  }

  async function handleLogout() {
    clearParticipant();
    await performFullUserLogout(() => {
      router.replace("/");
    });
  }

  const avatarUrl =
    participant?.avatarUrl ||
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture ||
    (user?.email
      ? `https://unavatar.io/${encodeURIComponent(user.email.toLowerCase().trim())}?fallback=false`
      : null);

  return (
    <>
      {celebrating && (
        <div
          className="confetti"
          aria-hidden="true"
          style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 10000 }}
        >
          {Array.from({ length: 42 }, (_, index) => (
            <i
              key={index}
              style={
                {
                  left: `${(index * 37) % 101}%`,
                  background: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
                  animationDelay: `-${(index % 11) * 0.19}s`,
                  animationDuration: `${3.3 + (index % 7) * 0.22}s`,
                  "--drift": `${(index % 2 ? 1 : -1) * (25 + (index % 55))}px`,
                } as CSSProperties
              }
            />
          ))}
        </div>
      )}

      <ParticipantAppShell
        participant={participant}
        avatarUrl={avatarUrl}
        tickets={tickets}
        eligibleDraws={eligibleDraws}
        hasTicket={hasTicket}
        getTicket={getTicket}
        enterDraw={enterDraw}
        onLogout={handleLogout}
      />
    </>
  );
}
