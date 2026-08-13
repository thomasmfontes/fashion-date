"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import DrawTransitionLink from "../draw-transition-link";

type Participant = {
  id: number;
  luckyNumber: string;
  name: string;
  store: string;
  phone: string;
  instagram: string;
  createdAt: string;
  status: string;
};

export default function WinnersPage() {
  const [key, setKey] = useState("");
  const [rows, setRows] = useState<Participant[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedKey = sessionStorage.getItem("fashion-date-admin-key") || "";
    if (!savedKey) {
      location.replace("/admin");
      return;
    }
    setKey(savedKey);
  }, []);

  const load = useCallback(async () => {
    if (!key) return;
    const response = await fetch("/api/admin/participants", {headers: {"x-admin-key": key}});
    if (!response.ok) {
      sessionStorage.removeItem("fashion-date-admin-key");
      location.replace("/admin");
      return;
    }
    const data = await response.json();
    setRows(data.participants.filter((participant: Participant) => participant.status === "winner"));
    setLoading(false);
  }, [key]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return rows;
    return rows.filter(row => `${row.luckyNumber} ${row.name} ${row.store} ${row.phone} ${row.instagram}`.toLowerCase().includes(normalizedQuery));
  }, [query, rows]);

  if (!key || loading) return <main className="center-page"><p className="muted">Carregando vencedores...</p></main>;

  return <main className="stitch-admin">
    <aside className="stitch-sidebar">
      <img src="/fashiondate-logo.png" alt="Fashion Date"/>
      <nav>
        <a className="stitch-nav" href="/admin"><span className="material-symbols-outlined">groups</span>Participantes</a>
        <DrawTransitionLink className="stitch-nav"><span className="material-symbols-outlined">casino</span>Sorteio</DrawTransitionLink>
        <a className="stitch-nav active" href="/admin/vencedores"><span className="material-symbols-outlined">emoji_events</span>Vencedores</a>
      </nav>
      <button className="stitch-nav stitch-logout" onClick={() => {sessionStorage.removeItem("fashion-date-admin-key"); location.replace("/admin");}}><span className="material-symbols-outlined">logout</span>Sair</button>
    </aside>

    <section className="stitch-content winners-content">
      <header className="stitch-header winners-header">
        <div>
          <span className="stitch-kicker">Histórico do sorteio</span>
          <h1>Vencedores</h1>
          <p className="winners-description">Consulte as pessoas sorteadas e acesse rapidamente os contatos.</p>
        </div>
        <div className="stitch-actions">
          <a className="stitch-button outline" href="/admin"><span className="material-symbols-outlined">arrow_back</span>Voltar ao Painel</a>
          <DrawTransitionLink className="stitch-button filled"><span className="material-symbols-outlined">casino</span>Novo Sorteio</DrawTransitionLink>
        </div>
      </header>

      <section className="winners-overview" aria-label="Resumo dos vencedores">
        <span className="material-symbols-outlined">workspace_premium</span>
        <div><strong>{rows.length}</strong><p>{rows.length === 1 ? "vencedor registrado" : "vencedores registrados"}</p></div>
      </section>

      <div className="stitch-toolbar winners-toolbar">
        <label><span className="material-symbols-outlined">search</span><input aria-label="Buscar vencedores" placeholder="Buscar por nome, loja ou número..." value={query} onChange={event => setQuery(event.target.value)}/></label>
        <span className="winner-result-count">{filtered.length} {filtered.length === 1 ? "resultado" : "resultados"}</span>
      </div>

      <div className="stitch-table-wrap">{filtered.length ? <table>
        <thead><tr><th>Nº sorteado</th><th>Vencedor</th><th>Loja</th><th>Contato</th><th>Cadastro</th><th>Situação</th></tr></thead>
        <tbody>{filtered.map(row => <tr key={row.id}>
          <td data-label="Número">{row.luckyNumber}</td>
          <td data-label="Vencedor" className="stitch-name">{row.name}</td>
          <td data-label="Loja">{row.store}</td>
          <td data-label="Contato"><div className="stitch-contacts"><a className="social-icon whatsapp" href={`https://wa.me/55${row.phone}`} target="_blank" rel="noreferrer" aria-label={`Abrir WhatsApp de ${row.name}`} title="Abrir WhatsApp"><img src="https://cdn.simpleicons.org/whatsapp/128C7E" alt=""/></a><a className="social-icon instagram" href={`https://instagram.com/${row.instagram.replace(/^@/, "")}`} target="_blank" rel="noreferrer" aria-label={`Abrir Instagram de ${row.name}`} title={`@${row.instagram.replace(/^@/, "")}`}><img src="https://cdn.simpleicons.org/instagram/E1306C" alt=""/></a></div></td>
          <td data-label="Cadastro">{new Date(row.createdAt).toLocaleString("pt-BR", {day:"2-digit", month:"short", hour:"2-digit", minute:"2-digit"})}</td>
          <td data-label="Situação"><span className="stitch-badge winner"><span className="material-symbols-outlined">workspace_premium</span>Vencedor</span></td>
        </tr>)}</tbody>
      </table> : <div className="winners-empty"><span className="material-symbols-outlined">emoji_events</span><h2>{rows.length ? "Nenhum vencedor encontrado" : "Nenhum vencedor ainda"}</h2><p>{rows.length ? "Tente buscar por outro nome, loja ou número." : "Depois do primeiro sorteio, o vencedor aparecerá aqui."}</p>{!rows.length && <DrawTransitionLink className="stitch-button filled">Realizar Sorteio</DrawTransitionLink>}</div>}</div>
      <footer className="stitch-footer">© 2026 Fashion Date. Todos os direitos reservados.</footer>
    </section>
  </main>;
}
