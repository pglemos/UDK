"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { OfficialLogo } from "./official-logo";

const navigation = [
  ["/calendario", "Calendário"],
  ["/classificacao", "Classificação"],
  ["/resultados", "Resultados"],
  ["/pilotos", "Pilotos"],
  ["/noticias", "Notícias"],
  ["/regulamento", "Regulamento"],
] as const;

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function RaceHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const home = pathname === "/";

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 48);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) {
      document.body.style.removeProperty("overflow");
      return;
    }

    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.removeProperty("overflow");
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <>
      <a className="race-skip-link" href="#conteudo">Pular para o conteúdo</a>
      <header
        className={[
          "race-header",
          home && !scrolled ? "race-header-overlay" : "",
          scrolled ? "is-compact" : "",
        ].filter(Boolean).join(" ")}
      >
        <Link className="race-brand" href="/" aria-label="Ultras do Kart, página inicial">
          <OfficialLogo variant="negative" width={178} priority />
        </Link>

        <nav className="race-nav" aria-label="Navegação principal">
          {navigation.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              aria-current={isActive(pathname, href) ? "page" : undefined}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="race-header-actions">
          <Link className="race-header-login" href="/login">Entrar</Link>
          <Link className="race-button race-button-primary race-header-cta" href="/inscricao">
            Inscrição <ChevronRight aria-hidden="true" size={17} />
          </Link>
          <button
            ref={triggerRef}
            className="race-menu-trigger"
            type="button"
            aria-label="Abrir menu"
            aria-expanded={open}
            aria-controls="race-mobile-menu"
            onClick={() => setOpen(true)}
          >
            <Menu aria-hidden="true" />
          </button>
        </div>
      </header>

      <div
        id="race-mobile-menu"
        className={`race-mobile-menu${open ? " is-open" : ""}`}
        aria-hidden={!open}
      >
        <div className="race-mobile-menu-head">
          <OfficialLogo variant="negative" width={166} />
          <button
            ref={closeRef}
            type="button"
            aria-label="Fechar menu"
            onClick={() => {
              setOpen(false);
              triggerRef.current?.focus();
            }}
          >
            <X aria-hidden="true" />
          </button>
        </div>
        <nav aria-label="Navegação móvel">
          {navigation.map(([href, label], index) => (
            <Link
              key={href}
              href={href}
              style={{ "--menu-index": index } as React.CSSProperties}
              aria-current={isActive(pathname, href) ? "page" : undefined}
            >
              <span>0{index + 1}</span>
              {label}
              <ChevronRight aria-hidden="true" />
            </Link>
          ))}
        </nav>
        <div className="race-mobile-menu-actions">
          <Link className="race-button race-button-ghost" href="/login">Entrar</Link>
          <Link className="race-button race-button-primary" href="/inscricao">Entrar no grid</Link>
        </div>
        <p>UDK 2026 • Kartódromo Internacional de Betim</p>
      </div>
    </>
  );
}
