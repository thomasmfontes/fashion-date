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

  return <main className="signup-page">
    <section className="signup-visual" style={{backgroundImage:`url(${hero})`}} aria-label="Fashion Date">
      <div className="signup-shade"/>
      <header className="signup-brand"><span>FD</span><i/><div>Fashion Date<br/>Crente Chic<small>by Renata Castanheira</small></div></header>
      <div className="signup-visual-copy"><span>Fashion Date · 2026</span><h1>Moda, propósito<br/>e <em>experiência.</em></h1><p>Um encontro pensado para lojistas que movimentam a moda com identidade.</p></div>
      <div className="signup-edition">01 <span>Primeira<br/>edição</span></div>
    </section>

    <section className="signup-panel">
      <header className="signup-heading"><div><span className="signup-step">Sorteio exclusivo</span><span className="signup-open"><i/> Inscrições abertas</span></div><h2>Concorra a um<br/><em>Provador Fashion.</em></h2><p>Preencha seus dados. Ao finalizar, seu número da sorte será gerado automaticamente.</p></header>
      <form className="registration-form signup-form" onSubmit={submit}>
        <div className="signup-fields">
          <label>Nome completo<input name="name" autoComplete="name" placeholder="Seu nome completo" required minLength={3}/></label>
          <label>Nome da loja<input name="store" placeholder="Nome da sua loja" required minLength={2}/></label>
          <label>WhatsApp<input name="phone" inputMode="tel" autoComplete="tel" placeholder="(00) 00000-0000" value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} required minLength={15}/><small>Apenas um cadastro por WhatsApp</small></label>
          <label>Instagram<div className="instagram-input"><span aria-hidden="true">@</span><input name="instagram" placeholder="seuperfil" autoComplete="off" required aria-label="Usuário do Instagram"/></div></label>
        </div>
        <label className="consent"><input type="checkbox" name="consent" required/><span>Autorizo o uso dos meus dados para participação no sorteio e comunicações relacionadas ao Fashion Date.</span></label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="signup-submit" type="submit" disabled={loading}><span>{loading ? "Realizando cadastro..." : "Quero participar"}</span><b className="material-symbols-outlined">arrow_forward</b></button>
      </form>
      <footer className="signup-footer"><span>Seus dados estão protegidos.</span><span>© 2026 Fashion Date</span></footer>
    </section>
  </main>;
}
