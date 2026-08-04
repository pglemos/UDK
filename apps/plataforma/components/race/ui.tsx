import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  Flag,
  Search,
  Timer,
  Trophy,
} from "lucide-react";
import type { PageMeta, PublicDriver, PublicStage } from "../../lib/public-data";
import { driverVisual, pageHeroVisual } from "../../lib/visual-assets";
import { OfficialLogo } from "./official-logo";

export function PageHero({
  eyebrow = "Temporada 2026",
  title,
  description,
  index = "UDK",
}: {
  eyebrow?: string;
  title: string;
  description: string;
  index?: string;
  compact?: boolean;
}) {
  const visual = pageHeroVisual(index);

  return (
    <section className="udk-page-hero tg-page-hero">
      <div className="udk-page-hero-media" aria-hidden="true">
        <Image
          src={visual.src}
          alt=""
          fill
          priority
          quality={90}
          sizes="100vw"
          style={{ objectPosition: visual.position }}
        />
      </div>
      <div className="race-container udk-page-hero-inner">
        <div className="udk-page-hero-copy">
          <span>{eyebrow}</span>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        <div className="tg-page-hero-index" aria-hidden="true">{index}</div>
        <div className="tg-page-scroll" aria-hidden="true"><i /> Explore</div>
      </div>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="race-section-heading tg-section-heading">
      <span>{eyebrow}</span>
      <div>
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      {action ? (
        <Link className="tg-arrow-link" href={action.href}>
          {action.label} <ArrowRight aria-hidden="true" />
        </Link>
      ) : null}
    </div>
  );
}

const statusLabels: Record<string, string> = {
  scheduled: "Programada",
  registration_open: "Inscrições abertas",
  registration: "Inscrições abertas",
  summary: "Resumo público",
  completed: "Concluída",
  cancelled: "Cancelada",
  provisional: "Provisório",
  homologated: "Homologado",
  official: "Oficial",
  published: "Publicado",
  rectified: "Retificado",
  active: "Ativo",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`race-status race-status-${status.replaceAll("_", "-")}`}>
      {statusLabels[status] ?? status}
    </span>
  );
}

export function DriverVisual({
  driver,
  large = false,
}: {
  driver: PublicDriver;
  large?: boolean;
}) {
  const fallback = driverVisual(Number.parseInt(driver.number, 10) || 0);

  return (
    <div className={`race-driver-visual${large ? " is-large" : ""}${driver.avatarUrl ? "" : " is-fallback"}`}>
      {driver.avatarUrl ? (
        <Image
          src={driver.avatarUrl}
          alt=""
          fill
          quality={86}
          sizes={large ? "240px" : "120px"}
        />
      ) : (
        <>
          <Image
            className="driver-fallback-photo"
            src={fallback.src}
            alt=""
            fill
            quality={82}
            sizes={large ? "240px" : "120px"}
            style={{ objectPosition: fallback.position }}
          />
          <span className="driver-fallback-shade" aria-hidden="true" />
          <OfficialLogo variant="mark-light" width={large ? 76 : 50} />
          <strong>#{driver.number}</strong>
        </>
      )}
    </div>
  );
}

export function TrackGlyph({ label = "Traçado oficial" }: { label?: string }) {
  return (
    <svg className="race-track-glyph" viewBox="0 0 220 130" role="img" aria-label={label}>
      <path
        d="M22 92c21-7 26-28 43-39 19-13 43 8 62-3 19-12 8-38 29-43 19-4 43 20 38 39-4 15-25 15-29 30-5 18 24 23 14 39-12 18-46-8-63 1-17 8-23 25-45 18-18-5-25-21-49-42Z"
        pathLength="1"
      />
      <circle cx="22" cy="92" r="4" />
    </svg>
  );
}

export function StageMeta({ stage }: { stage: PublicStage }) {
  return (
    <div className="race-stage-meta">
      <span><Flag aria-hidden="true" /> {stage.track}</span>
      <span><Timer aria-hidden="true" /> {stage.time}</span>
      <span><Trophy aria-hidden="true" /> {stage.format || "Etapa oficial"}</span>
    </div>
  );
}

export function EmptyState({
  eyebrow = "Grid vazio",
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="race-empty tg-empty-state">
      <span>{eyebrow}</span>
      <Flag aria-hidden="true" />
      <h2>{title}</h2>
      <p>{description}</p>
      {action ? (
        <Link className="race-button race-button-primary" href={action.href}>
          {action.label} <ChevronRight aria-hidden="true" />
        </Link>
      ) : null}
    </div>
  );
}

function paginationHref(basePath: string, current: URLSearchParams, page: number): string {
  const params = new URLSearchParams(current);
  params.set("page", String(page));
  return `${basePath}?${params.toString()}`;
}

export function RacePagination({
  meta,
  basePath,
  params,
}: {
  meta: PageMeta;
  basePath: string;
  params: Record<string, string | undefined>;
}) {
  if (meta.totalPages <= 1) return null;

  const current = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value && key !== "page") current.set(key, value);
  });

  const pages = new Set<number>([1, meta.totalPages, meta.page - 1, meta.page, meta.page + 1]);
  const visible = [...pages]
    .filter((page) => page >= 1 && page <= meta.totalPages)
    .sort((a, b) => a - b);

  return (
    <nav className="race-pagination" aria-label="Paginação">
      <Link
        href={paginationHref(basePath, current, Math.max(1, meta.page - 1))}
        aria-disabled={!meta.hasPreviousPage}
        tabIndex={meta.hasPreviousPage ? undefined : -1}
      >
        <ArrowLeft aria-hidden="true" /> <span>Anterior</span>
      </Link>
      <div>
        {visible.map((page, index) => (
          <span key={page} className="race-page-slot">
            {index > 0 && page - (visible[index - 1] ?? page) > 1 ? <i aria-hidden="true">…</i> : null}
            <Link href={paginationHref(basePath, current, page)} aria-current={page === meta.page ? "page" : undefined}>
              {page}
            </Link>
          </span>
        ))}
      </div>
      <Link
        href={paginationHref(basePath, current, Math.min(meta.totalPages, meta.page + 1))}
        aria-disabled={!meta.hasNextPage}
        tabIndex={meta.hasNextPage ? undefined : -1}
      >
        <span>Próxima</span> <ArrowRight aria-hidden="true" />
      </Link>
    </nav>
  );
}

export function SearchField({
  name = "q",
  defaultValue = "",
  placeholder = "Buscar",
}: {
  name?: string;
  defaultValue?: string;
  placeholder?: string;
}) {
  return (
    <label className="race-search-field">
      <Search aria-hidden="true" />
      <span className="sr-only">{placeholder}</span>
      <input name={name} defaultValue={defaultValue} placeholder={placeholder} />
    </label>
  );
}
