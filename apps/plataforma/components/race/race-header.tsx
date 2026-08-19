"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
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

function BrandLockup({ compact = false }: { compact?: boolean }) {
  return (
    <OfficialLogo
      variant="negative"
      width={compact ? 116 : 148}
      priority={!compact}
      className="race-brand-official-wordmark"
    />
  );
}

export function RaceHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [preview, setPreview] = useState(0);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const previousOverflowRef = useRef<string | null>(null);
  const restoreFocusTimerRef = useRef<number | null>(null);
  const home = pathname === "/";
  const previewItem = navigation[preview] ?? navigation[0];
  const previewVisual = menuVisuals[preview] ?? menuVisuals[0];

  const handleSkipToContent = useCallback((event: MouseEvent<HTMLAnchorElement>) => {
    const target = document.getElementById("conteudo");
    if (!target) return;

    event.preventDefault();
    target.focus({ preventScroll: true });
    target.scrollIntoView({ block: "start" });
    window.history.replaceState(null, "", "#conteudo");
  }, []);

  const focusTrigger = useCallback(() => {
    if (restoreFocusTimerRef.current !== null) {
      window.clearTimeout(restoreFocusTimerRef.current);
    }
    restoreFocusTimerRef.current = window.setTimeout(() => {
      triggerRef.current?.focus({ preventScroll: true });
      restoreFocusTimerRef.current = null;
    }, 120);
  }, []);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 48);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(
    () => () => {
      if (restoreFocusTimerRef.current !== null) {
        window.clearTimeout(restoreFocusTimerRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    if (!open) {
      if (previousOverflowRef.current !== null) {
        document.body.style.overflow = previousOverflowRef.current;
        previousOverflowRef.current = null;
      }
      return;
    }

    if (restoreFocusTimerRef.current !== null) {
      window.clearTimeout(restoreFocusTimerRef.current);
      restoreFocusTimerRef.current = null;
    }

    previousOverflowRef.current = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const outsideMenu = Array.from(document.querySelectorAll<HTMLElement>(".race-site > *")).filter(
      (element) => element !== menuRef.current && !element.hasAttribute("inert"),
    );
    outsideMenu.forEach((element) => {
      element.setAttribute("inert", "");
    });

    const focusClose = () => closeRef.current?.focus({ preventScroll: true });
    const focusFrame = window.requestAnimationFrame(focusClose);
    const focusTimer = window.setTimeout(focusClose, 120);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        focusTrigger();
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
      window.cancelAnimationFrame(focusFrame);
      window.clearTimeout(focusTimer);
      outsideMenu.forEach((element) => {
        element.removeAttribute("inert");
      });
      if (previousOverflowRef.current !== null) {
        document.body.style.overflow = previousOverflowRef.current;
        previousOverflowRef.current = null;
      }
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [focusTrigger, open]);

  return (
    <>
      <a className="race-skip-link" href="#conteudo" onClick={handleSkipToContent}>
        Pular para o conteúdo
      </a>
      <header
        className={[
          "race-header cinema-header",
          home && !scrolled ? "race-header-overlay" : "",
          scrolled ? "is-compact" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <Link className="race-brand" href="/" aria-label="UDK, página inicial">
          <BrandLockup />
        </Link>

        <nav className="race-nav" aria-label="Navegação principal">
          {navigation.slice(0, 5).map(({ href, label }) => (
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
          <Link className="race-header-login" href="/login">
            Entrar
          </Link>
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
            onPointerDown={(event) => event.preventDefault()}
            onClick={() => setOpen(true)}
          >
            <span className="sr-only">Menu</span>
            <Menu aria-hidden="true" size={24} />
          </button>
        </div>
      </header>

      <div
        ref={menuRef}
        id="race-cinematic-menu"
        className={`race-mobile-menu cinema-menu${open ? " is-open" : ""}`}
        aria-hidden={!open}
        aria-label="Menu principal"
        aria-modal="true"
        inert={!open}
        role="dialog"
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
          <span className="race-menu-brand" aria-label="UDK">
            <BrandLockup compact />
          </span>
          <button
            key={open ? "menu-close-open" : "menu-close-closed"}
            ref={(element) => {
              closeRef.current = element;
              if (element && open) {
                element.focus({ preventScroll: true });
              }
            }}
            type="button"
            aria-label="Fechar menu"
            autoFocus={open}
            onClick={() => {
              setOpen(false);
              focusTrigger();
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
          <Link className="race-button race-button-ghost" href="/login">
            Entrar
          </Link>
          <Link className="race-button race-button-primary" href="/inscricao">
            Entrar no grid
          </Link>
        </div>
        <p>UDK 2026 • Kartódromo Internacional de Betim</p>
      </div>
    </>
  );
}
