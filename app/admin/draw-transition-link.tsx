"use client";

import Link from "next/link";
import { MouseEvent, ReactNode, useEffect, useRef, useState } from "react";
import {createPortal} from "react-dom";

type DrawTransitionLinkProps = {
  children: ReactNode;
  className?: string;
};

export default function DrawTransitionLink({children, className}: DrawTransitionLinkProps) {
  const [phase, setPhase] = useState<"idle" | "active" | "leaving">("idle");
  const [mounted, setMounted] = useState(false);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    setMounted(true);
    return () => timers.current.forEach(window.clearTimeout);
  }, []);

  function openDraw(event: MouseEvent<HTMLAnchorElement>) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (phase !== "idle") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      window.location.assign("/admin/sorteio");
      return;
    }
    setPhase("active");
    timers.current.push(window.setTimeout(() => setPhase("leaving"), 1850));
    timers.current.push(window.setTimeout(() => window.location.assign("/admin/sorteio"), 2400));
  }

  return <>
    <Link href="/admin/sorteio" className={className} onClick={openDraw}>{children}</Link>
    {mounted && createPortal(<div className={`draw-transition${phase !== "idle" ? " is-active" : ""}${phase === "leaving" ? " is-leaving" : ""}`} aria-hidden="true">
      <span className="draw-transition-panel left"/>
      <span className="draw-transition-panel right"/>
      <div className="draw-transition-brand">
        <img src="/fashiondate-logo.png" alt=""/>
        <i/>
        <p>Preparando o sorteio</p>
        <span>Boa sorte a todos</span>
      </div>
    </div>, document.body)}
  </>;
}
