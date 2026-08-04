"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { menuVisuals } from "../../lib/visual-assets";
import { OfficialLogo } from "./official-logo";

const navigation = [
  { href: "/calendario", label: "Calendário", index: "01" },
  { href: "/classificacao", label: "Classificação", index: "02" },
  { href: "/resultados", label: "Resultados", index: "03" },
  { href: "/pilotos", label: "Pilotos", index: "04" },
  { href: "/noticias", label: "Notícias", index: "05" },
  { href: "/regulamento", label: "Regulamento", index: "06" },
] as const;

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function RaceHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [preview, setPreview] = useState(0);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const home = pathname === "/";
  const previewItem = navigation[preview] ?? navigation[0];
  const previewVisual = menuVisuals[preview] ?? menuVisuals[0];

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 48);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

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
        return;
      }

      if (event.key !== "Tab" || !menuRef.current) return;
      const focusable = Array.from(
        menuRef.current.querySelectorAll<HTMLElement>(
          "a[href], button:not([disabled]), [tabindex]:not([tabindex='-1'])",
        ),
      );
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
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
          "race-header cinema-header",
          home && !scrolled ? "race-header-overlay" : "",
          scrolled ? "is-compact" : "",
        ].filter(Boolean).join(" ")}
      >
        <Link className="race-brand" href="/" aria-label="Ultras do Kart, página inicial">
          <OfficialLogo variant="negative" width={176} priority />
        </Link>

        <nav className="race-nav" aria-label="Navegação principal">
          {navigation.slice(0, 5).map(({ href, label }) => (
            <Link key={href} href={href} aria-current={isActive(pathname, href) ? "page" : undefined}>
              {label}
            </Link>
          ))}
        </nav>

        <div className="race-header-actions">
          <Link className="race-header-login" href="/login">Entrar</Link>
          <Link className="race-button race-button-primary race-header-cta" href="/inscricao">
            Entrar no grid <ArrowUpRight aria-hidden="true" size={16} />
          </Link>
          <button
            ref={triggerRef}
            className="race-menu-trigger"
            type="button"
            aria-label="Abrir menu"
            aria-expanded={open}
            aria-controls="race-cinematic-menu"
            onClick={() => setOpen(true)}
          >
            <span>Menu</span>
            <Menu aria-hidden="true" />
          </button>
        </div>
      </header>

      <div
        ref={menuRef}
        id="race-cinematic-menu"
        className={`race-mobile-menu cinema-menu${open ? " is-open" : ""}`}
        aria-hidden={!open}
      >
        <div className="cinema-menu-media" aria-hidden="true">
          <Image
            key={previewVisual.src}
            src={previewVisual.src}
            alt=""
            fill
            quality={88}
            sizes="(max-width: 900px) 100vw, 42vw"
            style={{ objectPosition: previewVisual.position }}
          />
          <div className="cinema-menu-caption">
            <span>{previewItem.index}</span>
            <strong>{previewItem.label}</strong>
            <small>UDK • Temporada 2026</small>
          </div>
        </div>

        <div className="race-mobile-menu-head">
          <OfficialLogo variant="negative" width={172} />
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

        <nav aria-label="Navegação imersiva">
          {navigation.map(({ href, label, index }, itemIndex) => (
            <Link
              key={href}
              href={href}
              style={{ "--menu-index": itemIndex } as React.CSSProperties}
              aria-current={isActive(pathname, href) ? "page" : undefined}
              onMouseEnter={() => setPreview(itemIndex)}
              onFocus={() => setPreview(itemIndex)}
            >
              <span>{index}</span>
              {label}
              <ArrowUpRight aria-hidden="true" />
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
