"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function handleAuth() {
      // Check for OAuth error directly in query string
      const searchParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));

      const errorDescription =
        searchParams.get("error_description") ||
        hashParams.get("error_description") ||
        searchParams.get("error") ||
        hashParams.get("error");

      if (errorDescription) {
        if (isMounted) {
          setErrorMessage(errorDescription);
          setTimeout(() => {
            router.replace(`/?auth_error=${encodeURIComponent(errorDescription)}`);
          }, 2000);
        }
        return;
      }

      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        if (isMounted) {
          setErrorMessage("Configuração do Supabase não encontrada.");
          setTimeout(() => router.replace("/"), 2500);
        }
        return;
      }

      try {
        // Exchange code if PKCE code exists in search parameters
        const code = searchParams.get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        }

        // Verify session is active
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (session) {
          // Successfully authenticated, redirect to main registration page
          window.location.assign("/");
        } else {
          // Listen for next auth event (e.g. hash token exchange)
          const { data: authListener } = supabase.auth.onAuthStateChange((event, s) => {
            if (event === "SIGNED_IN" && s) {
              authListener.subscription.unsubscribe();
              window.location.assign("/");
            }
          });

          // Fallback timeout
          setTimeout(() => {
            window.location.assign("/");
          }, 3000);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Falha ao validar login.";
        if (isMounted) {
          setErrorMessage(msg);
          setTimeout(() => {
            router.replace(`/?auth_error=${encodeURIComponent(msg)}`);
          }, 2500);
        }
      }
    }

    handleAuth();

    return () => {
      isMounted = false;
    };
  }, [router]);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "radial-gradient(circle at 50% 35%, #fffdfa 0%, #f7f1e7 100%)",
        padding: "24px",
        textAlign: "center",
        color: "#3b000f",
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      <div
        style={{
          width: "min(100%, 460px)",
          padding: "36px 28px",
          background: "#ffffff",
          borderRadius: "16px",
          border: "1px solid #ebdcc5",
          boxShadow: "0 18px 45px rgba(67, 0, 20, 0.08)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "18px",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "5px 14px",
            borderRadius: "20px",
            background: "#fdf8ee",
            border: "1px solid #dfbe75",
            color: "#855e09",
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
            workspace_premium
          </span>
          Fashion Date · Sorteio Oficial
        </div>

        <h1
          style={{
            margin: "4px 0 0",
            fontFamily: "var(--font-fashion, 'Playfair Display', Georgia, serif)",
            fontSize: "26px",
            fontWeight: 700,
            color: "#530017",
          }}
        >
          {errorMessage ? "Atenção ao Conectar" : "Conectando sua Conta"}
        </h1>

        <p
          style={{
            margin: 0,
            fontSize: "13.5px",
            lineHeight: 1.55,
            color: errorMessage ? "#a41414" : "#6d575a",
            maxWidth: "360px",
          }}
        >
          {errorMessage
            ? errorMessage
            : "Validando sua autenticação de forma segura... Você será redirecionado para o formulário em instantes."}
        </p>

        {!errorMessage ? (
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              border: "3px solid #ebdcc5",
              borderTopColor: "#530017",
              animation: "spin 0.8s linear infinite",
              marginTop: "8px",
            }}
          />
        ) : (
          <span
            className="material-symbols-outlined"
            style={{ fontSize: "38px", color: "#a41414" }}
          >
            error
          </span>
        )}
      </div>

      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </main>
  );
}
