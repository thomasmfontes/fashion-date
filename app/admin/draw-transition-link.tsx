"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MouseEvent,
  ReactNode,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";

type DrawTransitionLinkProps = {
  children: ReactNode;
  className?: string;
};

const emptySubscribe = () => () => {};

export function DrawTransitionLink({
  children,
  className,
}: DrawTransitionLinkProps) {
  const router = useRouter();
  const [phase, setPhase] = useState<"idle" | "active" | "leaving">("idle");
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const activeTimers = timers.current;
    return () => activeTimers.forEach(window.clearTimeout);
  }, []);

  function openDraw(event: MouseEvent<HTMLAnchorElement>) {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    event.preventDefault();
    if (phase !== "idle") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      router.push("/admin/sorteio");
      return;
    }
    setPhase("active");
    timers.current.push(window.setTimeout(() => setPhase("leaving"), 1200));
    timers.current.push(
      window.setTimeout(() => {
        router.push("/admin/sorteio");
      }, 1600),
    );
  }

  return (
    <>
      <Link href="/admin/sorteio" className={className} onClick={openDraw}>
        {children}
      </Link>
      {isClient &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className={`draw-transition${phase !== "idle" ? " is-active" : ""}${phase === "leaving" ? " is-leaving" : ""}`}
            aria-hidden="true"
          >
            <span className="draw-transition-panel left" />
            <span className="draw-transition-panel right" />
            <div className="draw-transition-brand">
              <img src="/fashiondate-logo.png" alt="" />
              <i />
              <p>Preparando o sorteio</p>
              <span>Boa sorte a todos</span>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
