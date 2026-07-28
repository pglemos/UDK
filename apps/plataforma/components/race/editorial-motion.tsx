"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function RouteCurtain() {
  const pathname = usePathname();
  const [active, setActive] = useState(false);

  useEffect(() => {
    setActive(true);
    const timer = window.setTimeout(() => setActive(false), 620);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  return (
    <div className={`tg-route-curtain${active ? " is-active" : ""}`} aria-hidden="true">
      <span>UDK</span>
      <i />
    </div>
  );
}

export function PointerHalo() {
  const [enabled, setEnabled] = useState(false);
  const [position, setPosition] = useState({ x: -100, y: -100, pressed: false });

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduced) return;

    setEnabled(true);
    const move = (event: PointerEvent) => {
      setPosition((current) => ({ ...current, x: event.clientX, y: event.clientY }));
    };
    const down = () => setPosition((current) => ({ ...current, pressed: true }));
    const up = () => setPosition((current) => ({ ...current, pressed: false }));

    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", down);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
    };
  }, []);

  if (!enabled) return null;

  return (
    <span
      className={`tg-pointer${position.pressed ? " is-pressed" : ""}`}
      style={{ transform: `translate3d(${position.x}px, ${position.y}px, 0)` }}
      aria-hidden="true"
    />
  );
}
