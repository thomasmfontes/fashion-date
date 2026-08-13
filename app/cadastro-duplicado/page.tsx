"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
export default function DuplicatePage() {
  const [number,setNumber]=useState("----");
  useEffect(()=>{const saved=sessionStorage.getItem("fashion-date-participant"); if(saved)setNumber(JSON.parse(saved).luckyNumber)},[]);
  return <main className="center-page"><section className="success-wrap"><div className="success-icon">★</div><h1 className="display">Você já está<br />participando!</h1><p className="lead">Identificamos que seu número de WhatsApp já possui um cadastro ativo em nosso evento.</p><div className="ticket"><div className="ticket-label">Seu número da sorte</div><strong className="lucky-number">{number}</strong></div><Link className="primary-button" style={{display:"block",textDecoration:"none"}} href="/">VOLTAR PARA O INÍCIO →</Link></section></main>;
}
