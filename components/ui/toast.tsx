"use client";

import {useEffect} from "react";

export type ToastMessage = {id:number; text:string; tone:"success" | "error"};

export function Toast({message, onDismiss}:{message:ToastMessage | null; onDismiss:()=>void}) {
  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(onDismiss, 4200);
    return () => window.clearTimeout(timer);
  }, [message, onDismiss]);

  if (!message) return null;
  return <div className={`app-toast ${message.tone}`} role={message.tone === "error" ? "alert" : "status"}>
    <span className="material-symbols-outlined">{message.tone === "success" ? "check_circle" : "error"}</span>
    <p>{message.text}</p>
    <button type="button" onClick={onDismiss} aria-label="Fechar aviso"><span className="material-symbols-outlined">close</span></button>
  </div>;
}
