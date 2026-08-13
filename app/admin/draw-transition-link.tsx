"use client";

import Link from "next/link";
import { MouseEvent, ReactNode, useState } from "react";

type DrawTransitionLinkProps = {
  children: ReactNode;
  className?: string;
};

export default function DrawTransitionLink({children, className}: DrawTransitionLinkProps) {
  const [active, setActive] = useState(false);

  function openDraw(event: MouseEvent<HTMLAnchorElement>) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (active) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      window.location.assign("/admin/sorteio");
      return;
    }
    setActive(true);
    window.setTimeout(() => window.location.assign("/admin/sorteio"), 2400);
  }

  return <>
    <Link href="/admin/sorteio" className={className} onClick={openDraw}>{children}</Link>
    <div className={`draw-transition${active ? " is-active" : ""}`} aria-hidden="true">
      <span className="draw-transition-panel left"/>
      <span className="draw-transition-panel right"/>
      <div className="draw-transition-brand">
        <img src="/fashiondate-logo.png" alt=""/>
        <i/>
        <p>Preparando o sorteio</p>
        <span>Boa sorte a todos</span>
      </div>
    </div>
  </>;
}
