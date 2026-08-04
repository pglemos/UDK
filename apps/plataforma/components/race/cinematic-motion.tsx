"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { OfficialLogo } from "./official-logo";

export function CinematicRouteCurtain() {
  const pathname = usePathname();
  const [active, setActive] = useState(false);

  useEffect(() => {
    setActive(true);
    const timer = window.setTimeout(() => setActive(false), 720);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  return (
    <div className={`cinema-route-curtain${active ? " is-active" : ""}`} aria-hidden="true">
      <OfficialLogo variant="dark" width={250} />
    </div>
  );
}

export function CinematicPointer() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [link, setLink] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!finePointer.matches || reducedMotion.matches) return;

    let frame = 0;
    const onPointerMove = (event: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        node.style.setProperty("--pointer-x", `${event.clientX}px`);
        node.style.setProperty("--pointer-y", `${event.clientY}px`);
        setVisible(true);
        const target = event.target instanceof Element ? event.target : null;
        setLink(Boolean(target?.closest("a, button, input, select, textarea, [role='button']")));
      });
    };
    const onPointerLeave = () => setVisible(false);

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.documentElement.addEventListener("mouseleave", onPointerLeave);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onPointerMove);
      document.documentElement.removeEventListener("mouseleave", onPointerLeave);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`cinema-pointer${visible ? " is-visible" : ""}${link ? " is-link" : ""}`}
      aria-hidden="true"
    />
  );
}

export function CinematicIntro() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const seen = window.sessionStorage.getItem("udk-cinematic-intro") === "seen";
    if (reducedMotion || seen) {
      setHidden(true);
      return;
    }

    window.sessionStorage.setItem("udk-cinematic-intro", "seen");
    const timer = window.setTimeout(() => setHidden(true), 1850);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className={`cinema-intro${hidden ? " is-hidden" : ""}`} aria-hidden="true">
      <OfficialLogo variant="negative" width={300} priority />
    </div>
  );
}
