"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const hero = "https://lh3.googleusercontent.com/aida/AP1WRLvLCvLUF_CntcplggYaQdDKvcXYz_78xKIcIrBvYjIUpaYmRt2IKM2V87xiHLupjRJiCHOrzHuc0E9_4NB-fi947VXJyzWMRWty25uw-rPDhxrn5acE7JgBKTL08hIBCGrrtVm7ZLN5LSiaolflPHlEwdRWwdeyX1RQv7aLYbi-9tlR1dbcYZXgyWZPXb4xu18tiy_5k7zoB_JrOnm8EgUz4QPzU_sXExoRXUfGUO72MINkpqh3pQn09Q";

function digits(value: string) {
  return value.replace(/\D/g, "").slice(0, 11);
}

function formatPhone(value: string) {
  const d = digits(value);
  if (d.length <= 2) return d ? `(${d}` : "";
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export default function Home() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/participants", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          store: data.get("store"),
          phone: digits(phone),
          instagram: data.get("instagram"),
          consent: data.get("consent") === "on",
        }),
      });
      const result = await response.json() as { participant?: { luckyNumber: string; name: string; store: string }; duplicate?: boolean; error?: string };
      if (!response.ok || !result.participant) throw new Error(result.error || "Não foi possível concluir o cadastro.");
      sessionStorage.setItem("fashion-date-participant", JSON.stringify(result.participant));
      router.push(result.duplicate ? "/cadastro-duplicado" : "/sucesso");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha de conexão. Tente novamente.");
      setLoading(false);
    }
  }

  return (
    <main className="public-page">
      <section className="hero" style={{ backgroundImage: `url(${hero})` }} aria-label="Fashion Date">
        <div className="hero-fade" />
      </section>
      <section className="registration-section">
        <div className="eyebrow">Sorteio exclusivo</div>
        <h1>Participe do nosso<br />sorteio</h1>
        <p className="lead">Cadastre-se e concorra a um Provador Fashion.</p>
        <p className="muted">Após o cadastro, você receberá seu número da sorte exclusivo.</p>
        <form className="registration-form" onSubmit={submit}>
          <label>Nome completo<input name="name" autoComplete="name" placeholder="Seu nome completo" required minLength={3} /></label>
          <label>Nome da loja<input name="store" placeholder="Nome da sua loja" required minLength={2} /></label>
          <label>WhatsApp<input name="phone" inputMode="tel" autoComplete="tel" placeholder="(00) 00000-0000" value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} required minLength={15} /></label>
          <small>* Apenas um cadastro permitido por WhatsApp.</small>
          <label>Instagram<input name="instagram" placeholder="@seuperfil" required /></label>
          <label className="consent"><input type="checkbox" name="consent" required /><span>Autorizo o uso dos meus dados para participação no sorteio e comunicações relacionadas ao Fashion Date.</span></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="primary-button" type="submit" disabled={loading}>{loading ? "REALIZANDO CADASTRO..." : "QUERO PARTICIPAR  →"}</button>
        </form>
      </section>
      <footer className="public-footer"><img src="/fashiondate-logo.png" alt="Fashion Date Crente Chic" /><p>© 2026 Fashion Date. Todos os direitos reservados.</p></footer>
    </main>
  );
}
