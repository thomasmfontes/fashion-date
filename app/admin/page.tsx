"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Participant = { id:number; luckyNumber:string; name:string; store:string; phone:string; instagram:string; createdAt:string; status:string };

export default function AdminPage() {
  const [key,setKey]=useState("");
  const [input,setInput]=useState("");
  const [rows,setRows]=useState<Participant[]>([]);
  const [query,setQuery]=useState("");
  const [error,setError]=useState("");
  const [open,setOpen]=useState(true);

  useEffect(()=>setKey(sessionStorage.getItem("fashion-date-admin-key")||""),[]);
  const load=useCallback(async()=>{
    if(!key)return;
    const response=await fetch("/api/admin/participants",{headers:{"x-admin-key":key}});
    if(!response.ok){setError("Senha incorreta ou acesso indisponível.");return;}
    const data=await response.json();
    setRows(data.participants);setOpen(data.registrationsOpen);setError("");
  },[key]);
  useEffect(()=>{load()},[load]);

  function login(event:FormEvent){event.preventDefault();sessionStorage.setItem("fashion-date-admin-key",input);setKey(input)}
  async function toggle(){await fetch("/api/admin/settings",{method:"POST",headers:{"content-type":"application/json","x-admin-key":key},body:JSON.stringify({registrationsOpen:!open})});load()}

  const today=rows.filter(row=>new Date(row.createdAt).toDateString()===new Date().toDateString()).length;
  const winners=rows.filter(row=>row.status==="winner").length;
  const filtered=rows.filter(row=>`${row.luckyNumber} ${row.name} ${row.store} ${row.phone} ${row.instagram}`.toLowerCase().includes(query.toLowerCase()));

  if(!key||error)return <main className="center-page"><form className="login-card" onSubmit={login}><img src="/fashiondate-logo.png" alt="Fashion Date"/><h1>Acesso administrativo</h1><p className="muted">Entre com a senha da organização.</p><label>Senha<input type="password" value={input} onChange={event=>setInput(event.target.value)} required autoFocus/></label>{error&&<p className="form-error">{error}</p>}<button className="primary-button">ENTRAR NO PAINEL</button></form></main>;

  return <main className="stitch-admin">
    <aside className="stitch-sidebar">
      <img src="/fashiondate-logo.png" alt="Fashion Date"/>
      <nav>
        <Link className="stitch-nav active" href="/admin"><span className="material-symbols-outlined">groups</span>Participantes</Link>
        <Link className="stitch-nav" href="/admin/sorteio"><span className="material-symbols-outlined">casino</span>Sorteio</Link>
        <Link className="stitch-nav" href="/admin/vencedores"><span className="material-symbols-outlined">emoji_events</span>Vencedores</Link>
      </nav>
      <button className="stitch-nav stitch-logout" onClick={()=>{sessionStorage.removeItem("fashion-date-admin-key");setKey("")}}><span className="material-symbols-outlined">logout</span>Sair</button>
    </aside>

    <section className="stitch-content">
      <header className="stitch-header">
        <div><h1>Painel Fashion Date</h1><span className="stitch-status"><i/>Inscrições {open?"Abertas":"Encerradas"}</span></div>
        <div className="stitch-actions"><button className="stitch-button outline" onClick={toggle}>{open?"Encerrar":"Abrir"} Inscrições</button><Link className="stitch-button filled" href="/admin/sorteio"><span className="material-symbols-outlined">play_arrow</span>Iniciar Sorteio</Link></div>
      </header>

      <div className="stitch-stats">
        <article><div><span>Total de Participantes</span><b className="material-symbols-outlined">group</b></div><strong>{rows.length}</strong></article>
        <article><div><span>Cadastros Hoje</span><b className="material-symbols-outlined">person_add</b></div><strong>{today}</strong></article>
        <article><div><span>Sorteados</span><b className="material-symbols-outlined">workspace_premium</b></div><strong>{winners}</strong></article>
      </div>

      <div className="stitch-toolbar"><label><span className="material-symbols-outlined">search</span><input aria-label="Buscar participantes" placeholder="Buscar por nome, loja ou número..." value={query} onChange={event=>setQuery(event.target.value)}/></label><a href={`/api/admin/export?key=${encodeURIComponent(key)}`}><span className="material-symbols-outlined">download</span>Exportar Lista</a></div>

      <div className="stitch-table-wrap">{filtered.length?<table><thead><tr><th>Nº</th><th>Nome</th><th>Loja</th><th>Contato</th><th>Data/Hora</th><th>Situação</th></tr></thead><tbody>{filtered.map(row=><tr key={row.id}><td data-label="Número">{row.luckyNumber}</td><td data-label="Nome" className="stitch-name">{row.name}</td><td data-label="Loja">{row.store}</td><td data-label="Contato"><div className="stitch-contacts"><a className="social-icon whatsapp" href={`https://wa.me/55${row.phone}`} target="_blank" rel="noreferrer" aria-label={`Abrir WhatsApp de ${row.name}`} title="Abrir WhatsApp"><img src="https://cdn.simpleicons.org/whatsapp/128C7E" alt=""/></a><a className="social-icon instagram" href={`https://instagram.com/${row.instagram.replace(/^@/,"")}`} target="_blank" rel="noreferrer" aria-label={`Abrir Instagram de ${row.name}`} title={`@${row.instagram.replace(/^@/,"")}`}><img src="https://cdn.simpleicons.org/instagram/E1306C" alt=""/></a></div></td><td data-label="Data/Hora">{new Date(row.createdAt).toLocaleString("pt-BR",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"})}</td><td data-label="Situação"><span className="stitch-badge">{row.status==="winner"?"Vencedor":"Inscrito"}</span></td></tr>)}</tbody></table>:<div className="empty">Nenhum participante encontrado.</div>}</div>
      <footer className="stitch-footer">© 2026 Fashion Date. Todos os direitos reservados.</footer>
    </section>
  </main>;
}
