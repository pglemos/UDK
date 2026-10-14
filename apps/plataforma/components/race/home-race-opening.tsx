"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Pause, Play, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { PublicDriver } from "../../lib/public-data";
import { DriverPlaceholder } from "./driver-placeholder";

export type OpeningDriver = Pick<
  PublicDriver,
  "slug" | "name" | "categorySlug" | "avatarUrl" | "heroImageUrl"
>;

const categories = [
  { slug: "rapidos", name: "Ultras Rápidos" },
  { slug: "insanos", name: "Ultras Insanos" },
];

const FILM_SRC = "/media/official/home/ultras-opening.mp4";
const FILM_SEEN_KEY = "udk-filme-visto";

/**
 * O filme abre sozinho na primeira visita da sessão (pedido do organizador, 14/10).
 * Fica de fora quem pediu menos movimento no sistema ou economia de dados (19 MB).
 */
export function shouldAutoOpenFilm({
  reducedMotion,
  saveData,
  alreadySeen,
}: {
  reducedMotion: boolean;
  saveData: boolean;
  alreadySeen: boolean;
}) {
  return !reducedMotion && !saveData && !alreadySeen;
}

function playFilm(dialog: HTMLDialogElement | null, film: HTMLVideoElement | null, muted: boolean) {
  if (dialog && !dialog.open) dialog.showModal();
  if (!film) return;
  film.muted = muted;
  if (!film.getAttribute("src")) film.src = FILM_SRC;
  void film.play().catch(() => {});
}

export function HomeRaceOpening({ drivers }: { drivers: OpeningDriver[] }) {
  const [category, setCategory] = useState("rapidos");
  const [page, setPage] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [filmOpen, setFilmOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const film = useRef<HTMLVideoElement>(null);
  const lineup = drivers.filter((driver) => driver.categorySlug === category);
  const pages = Math.ceil(lineup.length / 2);
  const visibleDrivers = lineup.slice(page * 2, page * 2 + 2);
  const stopped = paused || reducedMotion || hovered || focused || hidden || filmOpen;

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotion = () => setReducedMotion(preference.matches);
    const syncVisibility = () => setHidden(document.hidden);
    syncMotion();
    syncVisibility();
    preference.addEventListener("change", syncMotion);
    document.addEventListener("visibilitychange", syncVisibility);
    return () => {
      preference.removeEventListener("change", syncMotion);
      document.removeEventListener("visibilitychange", syncVisibility);
    };
  }, []);

  useEffect(() => {
    if (stopped || pages < 2) return;
    const timer = window.setTimeout(() => setPage((current) => (current + 1) % pages), 6500);
    return () => window.clearTimeout(timer);
  }, [page, category, pages, stopped]);

  useEffect(() => {
    let alreadySeen = false;
    try {
      alreadySeen = window.sessionStorage.getItem(FILM_SEEN_KEY) === "1";
      window.sessionStorage.setItem(FILM_SEEN_KEY, "1");
    } catch {
      // sessionStorage bloqueado (navegação privada): abre mesmo assim
    }
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    const open = shouldAutoOpenFilm({
      reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      saveData: connection?.saveData === true,
      alreadySeen,
    });
    if (!open) return;
    setFilmOpen(true);
    // o navegador só deixa tocar sozinho sem som; o som fica no controle do vídeo
    playFilm(dialog.current, film.current, true);
  }, []);

  useEffect(() => {
    // Esc fecha o diálogo pelo navegador: para o filme junto (o X e o clique fora usam closeFilm)
    const element = dialog.current;
    if (!element) return;
    const stopFilm = () => {
      film.current?.pause();
      setFilmOpen(false);
    };
    element.addEventListener("cancel", stopFilm);
    element.addEventListener("close", stopFilm);
    return () => {
      element.removeEventListener("cancel", stopFilm);
      element.removeEventListener("close", stopFilm);
    };
  }, []);

  function openFilm() {
    setFilmOpen(true);
    playFilm(dialog.current, film.current, false);
  }

  // fechar tem que parar o vídeo na hora: só com o evento "close" o áudio seguia tocando com o
  // diálogo fechado (visto em produção em 14/10)
  function closeFilm() {
    film.current?.pause();
    dialog.current?.close();
    setFilmOpen(false);
  }

  return (
    <div
      className={`udk-film-lineup${reducedMotion ? " has-reduced-motion" : ""}`}
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") setHovered(true);
      }}
      onPointerLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
      }}
      role="region"
      aria-label="Pilotos do campeonato"
    >
      <div className="udk-film-categories" aria-label="Escolher categoria">
        {categories.map((item) => (
          <button
            key={item.slug}
            type="button"
            aria-pressed={category === item.slug}
            onClick={() => {
              setCategory(item.slug);
              setPage(0);
            }}
          >
            {item.name}
          </button>
        ))}
      </div>

      <div className="udk-film-viewport">
        <div className="udk-film-portraits" key={`${category}-${page}`}>
          {visibleDrivers.map((driver) => {
            const portrait = driver.heroImageUrl ?? driver.avatarUrl;
            return (
              <Link
                href={`/pilotos/${driver.slug}`}
                className="udk-film-driver"
                key={driver.slug}
                aria-label={`Ver perfil de ${driver.name}`}
              >
                <div className="udk-film-portrait">
                  {portrait ? (
                    <Image
                      src={portrait}
                      alt={`Retrato oficial de ${driver.name}`}
                      fill
                      sizes="(max-width: 760px) 45vw, (max-width: 1100px) 26vw, 24vw"
                      quality={86}
                      preload={page === 0}
                    />
                  ) : (
                    <DriverPlaceholder name={driver.name} />
                  )}
                </div>
                <span>{driver.name}</span>
                <ArrowRight aria-hidden="true" />
              </Link>
            );
          })}
          {!lineup.length ? (
            <Link href="/pilotos" className="udk-film-empty">
              Conheça os pilotos <ArrowRight aria-hidden="true" />
            </Link>
          ) : null}
        </div>
      </div>

      <div className="udk-film-controls">
        <button type="button" className="udk-film-watch" onClick={openFilm}>
          <Play aria-hidden="true" /> Assistir ao filme
        </button>
        {pages > 1 ? (
          <div className="udk-film-pagination">
            <span aria-label={`Página ${page + 1} de ${pages}`}>
              {String(page + 1).padStart(2, "0")} <span>/ {String(pages).padStart(2, "0")}</span>
            </span>
            <button
              type="button"
              aria-label="Pilotos anteriores"
              onClick={() => setPage((current) => (current - 1 + pages) % pages)}
            >
              <ArrowLeft aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label={paused ? "Retomar apresentação" : "Pausar apresentação"}
              aria-pressed={paused}
              onClick={() => setPaused(!paused)}
            >
              {paused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
            </button>
            <button
              type="button"
              aria-label="Próximos pilotos"
              onClick={() => setPage((current) => (current + 1) % pages)}
            >
              <ArrowRight aria-hidden="true" />
            </button>
          </div>
        ) : null}
      </div>

      <dialog
        ref={dialog}
        className="udk-film-dialog"
        aria-label="Filme oficial Ultras do Kart"
        onClick={(event) => {
          if (event.target === event.currentTarget) closeFilm();
        }}
      >
        <div className="udk-film-dialog-heading">
          <h2>Ultras do Kart</h2>
          <button type="button" aria-label="Fechar filme" onClick={closeFilm}>
            <X aria-hidden="true" />
          </button>
        </div>
        <video
          ref={film}
          width={2048}
          height={512}
          controls
          playsInline
          preload="none"
          poster="/media/official/home/ultras-opening.webp"
          aria-label="Filme Ultras do Kart"
        >
          Seu navegador não suporta vídeo.
        </video>
      </dialog>
    </div>
  );
}
