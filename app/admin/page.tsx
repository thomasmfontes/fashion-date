"use client";

import {FormEvent, useCallback, useEffect, useState} from "react";
import DrawTransitionLink from "./draw-transition-link";

type Participant = {id:number; luckyNumber:string; name:string; store:string; phone:string; instagram:string; createdAt:string; status:string};
type EditForm = {name:string; store:string; phone:string; instagram:string};

export default function AdminPage() {
  const [key, setKey] = useState("");
  const [input, setInput] = useState("");
  const [rows, setRows] = useState<Participant[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [open, setOpen] = useState(true);
  const [editing, setEditing] = useState<Participant | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({name:"", store:"", phone:"", instagram:""});
  const [actionError, setActionError] = useState("");
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => setKey(sessionStorage.getItem("fashion-date-admin-key") || ""), []);
  const load = useCallback(async () => {
    if (!key) return;
    const response = await fetch("/api/admin/participants", {headers:{"x-admin-key":key}});
    if (!response.ok) { setError("Senha incorreta ou acesso indisponível."); return; }
    const data = await response.json();
    setRows(data.participants); setOpen(data.registrationsOpen); setError("");
  }, [key]);
  useEffect(() => { load(); }, [load]);

  function login(event: FormEvent) { event.preventDefault(); sessionStorage.setItem("fashion-date-admin-key", input); setKey(input); }
  async function toggle() { await fetch("/api/admin/settings", {method:"POST", headers:{"content-type":"application/json", "x-admin-key":key}, body:JSON.stringify({registrationsOpen:!open})}); load(); }
  function startEdit(participant: Participant) {
    setEditing(participant);
    setEditForm({name:participant.name, store:participant.store, phone:participant.phone, instagram:participant.instagram});
    setActionError("");
  }
  async function saveEdit(event: FormEvent) {
    event.preventDefault();
    if (!editing) return;
    setSaving(true); setActionError("");
    const response = await fetch("/api/admin/participants", {method:"PATCH", headers:{"content-type":"application/json", "x-admin-key":key}, body:JSON.stringify({id:editing.id, ...editForm})});
    const data = await response.json();
    setSaving(false);
    if (!response.ok) { setActionError(data.error || "Não foi possível salvar."); return; }
    setRows(current => current.map(item => item.id === editing.id ? data.participant : item));
    setEditing(null);
  }
  async function removeParticipant(participant: Participant) {
    const confirmed = window.confirm(`Excluir ${participant.name}, número ${participant.luckyNumber}?\n\nEssa ação não pode ser desfeita.`);
    if (!confirmed) return;
    const response = await fetch("/api/admin/participants", {method:"DELETE", headers:{"content-type":"application/json", "x-admin-key":key}, body:JSON.stringify({id:participant.id})});
    if (!response.ok) { const data = await response.json(); window.alert(data.error || "Não foi possível excluir."); return; }
    setRows(current => current.filter(item => item.id !== participant.id));
  }

  const today = rows.filter(item => new Date(item.createdAt).toDateString() === new Date().toDateString()).length;
  const winners = rows.filter(item => item.status === "winner").length;
  const filtered = rows.filter(item => `${item.luckyNumber} ${item.name} ${item.store} ${item.phone} ${item.instagram}`.toLowerCase().includes(query.toLowerCase()));

  if (!key || error) return <main className="admin-login-page">
    <a className="admin-login-home" href="/"><span className="material-symbols-outlined">arrow_back</span>Voltar ao site</a>
    <section className="admin-login-brand">
      <img src="/fashiondate-logo.png" alt="Fashion Date Crente Chic"/>
      <div className="admin-login-copy"><span>Gestão do evento · 2026</span><h1>Tudo pronto para<br/><em>fazer acontecer.</em></h1><p>Cadastros, participantes e sorteio reunidos em uma experiência simples e segura.</p></div>
      <footer><span className="material-symbols-outlined">verified_user</span>Acesso exclusivo da organização</footer>
    </section>
    <section className="admin-login-panel">
      <form className="admin-login-card" onSubmit={login}>
        <div className="admin-login-kicker"><i/> Área administrativa</div>
        <h2>Acesse o painel</h2>
        <p>Digite a senha definida para a organização do Fashion Date.</p>
        <label htmlFor="admin-password">Senha</label>
        <div className="admin-password-field"><span className="material-symbols-outlined">lock</span><input id="admin-password" type={showPassword ? "text" : "password"} value={input} onChange={event => setInput(event.target.value)} required autoFocus autoComplete="current-password" placeholder="Digite sua senha"/><button type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"} title={showPassword ? "Ocultar senha" : "Mostrar senha"}><span className="material-symbols-outlined">{showPassword ? "visibility_off" : "visibility"}</span></button></div>
        {error && <p className="form-error">{error}</p>}
        <button className="admin-login-submit"><span>Entrar no painel</span><span className="material-symbols-outlined">arrow_forward</span></button>
        <small><span className="material-symbols-outlined">shield_lock</span>Sessão protegida neste dispositivo</small>
      </form>
    </section>
  </main>;

  return <main className="stitch-admin">
    <aside className="stitch-sidebar">
      <img src="/fashiondate-logo.png" alt="Fashion Date"/>
      <nav>
        <a className="stitch-nav active" href="/admin"><span className="material-symbols-outlined">groups</span>Participantes</a>
        <DrawTransitionLink className="stitch-nav"><span className="material-symbols-outlined">casino</span>Sorteio</DrawTransitionLink>
        <a className="stitch-nav" href="/admin/vencedores"><span className="material-symbols-outlined">emoji_events</span>Vencedores</a>
      </nav>
      <button className="stitch-nav stitch-logout" onClick={() => {sessionStorage.removeItem("fashion-date-admin-key"); setKey("");}}><span className="material-symbols-outlined">logout</span>Sair</button>
    </aside>

    <section className="stitch-content">
      <header className="stitch-header">
        <div><h1>Painel Fashion Date</h1><span className="stitch-status"><i/>Inscrições {open ? "Abertas" : "Encerradas"}</span></div>
        <div className="stitch-actions"><button className="stitch-button outline" onClick={toggle}>{open ? "Encerrar" : "Abrir"} Inscrições</button><DrawTransitionLink className="stitch-button filled"><span className="material-symbols-outlined">play_arrow</span>Iniciar Sorteio</DrawTransitionLink></div>
      </header>

      <div className="stitch-stats">
        <article><div><span>Total de Participantes</span><b className="material-symbols-outlined">group</b></div><strong>{rows.length}</strong></article>
        <article><div><span>Cadastros Hoje</span><b className="material-symbols-outlined">person_add</b></div><strong>{today}</strong></article>
        <article><div><span>Sorteados</span><b className="material-symbols-outlined">workspace_premium</b></div><strong>{winners}</strong></article>
      </div>

      <div className="stitch-toolbar"><label><span className="material-symbols-outlined">search</span><input aria-label="Buscar participantes" placeholder="Buscar por nome, loja ou número..." value={query} onChange={event => setQuery(event.target.value)}/></label><a href={`/api/admin/export?key=${encodeURIComponent(key)}`}><span className="material-symbols-outlined">download</span>Exportar Lista</a></div>

      <div className="stitch-table-wrap">{filtered.length ? <table><thead><tr><th>Nº</th><th>Nome</th><th>Loja</th><th>Contato</th><th>Data/Hora</th><th>Situação</th><th>Ações</th></tr></thead><tbody>{filtered.map(item => <tr key={item.id}><td data-label="Número">{item.luckyNumber}</td><td data-label="Nome" className="stitch-name">{item.name}</td><td data-label="Loja">{item.store}</td><td data-label="Contato"><div className="stitch-contacts"><a className="social-icon whatsapp" href={`https://wa.me/55${item.phone}`} target="_blank" rel="noreferrer" aria-label={`Abrir WhatsApp de ${item.name}`} title="Abrir WhatsApp"><img src="https://cdn.simpleicons.org/whatsapp/128C7E" alt=""/></a><a className="social-icon instagram" href={`https://instagram.com/${item.instagram.replace(/^@/, "")}`} target="_blank" rel="noreferrer" aria-label={`Abrir Instagram de ${item.name}`} title={`@${item.instagram.replace(/^@/, "")}`}><img src="https://cdn.simpleicons.org/instagram/E1306C" alt=""/></a></div></td><td data-label="Data/Hora">{new Date(item.createdAt).toLocaleString("pt-BR", {day:"2-digit", month:"short", hour:"2-digit", minute:"2-digit"})}</td><td data-label="Situação"><span className="stitch-badge">{item.status === "winner" ? "Vencedor" : "Inscrito"}</span></td><td data-label="Ações"><div className="participant-actions"><button onClick={() => startEdit(item)} aria-label={`Editar ${item.name}`} title="Editar"><span className="material-symbols-outlined">edit</span></button><button className="danger" onClick={() => removeParticipant(item)} aria-label={`Excluir ${item.name}`} title="Excluir"><span className="material-symbols-outlined">delete</span></button></div></td></tr>)}</tbody></table> : <div className="empty">Nenhum participante encontrado.</div>}</div>
      <footer className="stitch-footer">© 2026 Fashion Date. Todos os direitos reservados.</footer>
    </section>

    {editing && <div className="edit-modal-backdrop" role="presentation" onMouseDown={event => {if (event.target === event.currentTarget && !saving) setEditing(null);}}>
      <form className="edit-modal" onSubmit={saveEdit} aria-labelledby="edit-title">
        <header><div><span>Participante nº {editing.luckyNumber}</span><h2 id="edit-title">Editar cadastro</h2></div><button type="button" onClick={() => setEditing(null)} aria-label="Fechar edição" disabled={saving}><span className="material-symbols-outlined">close</span></button></header>
        <div className="edit-fields">
          <label>Nome<input value={editForm.name} onChange={event => setEditForm({...editForm, name:event.target.value})} required autoFocus/></label>
          <label>Nome da loja<input value={editForm.store} onChange={event => setEditForm({...editForm, store:event.target.value})} required/></label>
          <label>WhatsApp<input inputMode="tel" value={editForm.phone} onChange={event => setEditForm({...editForm, phone:event.target.value})} required/></label>
          <label>Instagram<input value={editForm.instagram} onChange={event => setEditForm({...editForm, instagram:event.target.value})} required/></label>
        </div>
        {actionError && <p className="form-error">{actionError}</p>}
        <footer><button type="button" className="stitch-button outline" onClick={() => setEditing(null)} disabled={saving}>Cancelar</button><button className="stitch-button filled" disabled={saving}>{saving ? "Salvando..." : "Salvar alterações"}</button></footer>
      </form>
    </div>}
  </main>;
}
