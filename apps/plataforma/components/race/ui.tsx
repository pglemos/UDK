import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ChevronRight, Flag, Timer, Trophy } from "lucide-react";
import type { PageMeta, PublicDriver, PublicStage } from "../../lib/public-data";
import { driverVisual, pageHeroVisual, resolveVisualSource } from "../../lib/visual-assets";
import { DriverPlaceholder } from "./driver-placeholder";

export function PageHero({
  eyebrow = "Temporada 2026",
  title,
  description,
  index = "UDK",
  compact = false,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  index?: string;
  compact?: boolean;
}) {
  const visual = pageHeroVisual(index);

  return (
    <section className={`udk-page-hero tg-page-hero${compact ? " is-compact" : ""}`}>
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
        <div className="tg-page-hero-index" aria-hidden="true">
          {index}
        </div>
        {!compact ? (
          <div className="tg-page-scroll" aria-hidden="true">
            <i /> Conheça
          </div>
        ) : null}
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
  pending: "Pendente",
  draft: "Rascunho",
  closed: "Encerrado",
  finished: "Concluído",
  approved: "Aprovado",
  rejected: "Rejeitado",
  nc: "Não classificado",
  not_classified: "Não classificado",
};

const formatLabels: Record<string, string> = {
  regular: "Etapa regular",
  endurance: "Endurance",
  special: "Etapa especial",
};

export function localizeRaceText(value: string | null | undefined): string {
  return value ?? "";
}

export function StatusBadge({ status }: { status: string }) {
  const normalizedStatus = status.trim().toLowerCase();
  const label = statusLabels[normalizedStatus] ?? (status.trim() || "Status não informado");

  return (
    <span className={`race-status race-status-${normalizedStatus.replaceAll("_", "-")}`}>
      {label}
    </span>
  );
}

export function DriverVisual({ driver, large = false }: { driver: PublicDriver; large?: boolean }) {
  const fallback = driverVisual(driver.number ?? 0);
  const source = resolveVisualSource(driver.avatarUrl, fallback);
  const hasPublishedPortrait = Boolean(driver.avatarUrl) && source !== fallback.src;

  return (
    <div
      className={`race-driver-visual${large ? " is-large" : ""}${hasPublishedPortrait ? "" : " is-fallback"}`}
    >
      {hasPublishedPortrait ? (
        <Image
          src={source}
          alt={`Retrato de ${driver.name}`}
          fill
          quality={86}
          sizes={large ? "240px" : "120px"}
        />
      ) : (
        <DriverPlaceholder name={driver.name} className={large ? "is-large" : ""} />
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
      <span>
        <Flag aria-hidden="true" /> {stage.track}
      </span>
      <span>
        <Timer aria-hidden="true" /> {stage.time}
      </span>
      <span>
        <Trophy aria-hidden="true" />{" "}
        {formatLabels[stage.format] ?? (stage.format || "Etapa oficial")}
      </span>
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
      {meta.hasPreviousPage ? (
        <Link href={paginationHref(basePath, current, meta.page - 1)}>
          <ArrowLeft aria-hidden="true" /> <span>Anterior</span>
        </Link>
      ) : (
        <span aria-disabled="true">
          <ArrowLeft aria-hidden="true" /> <span>Anterior</span>
        </span>
      )}
      <div>
        {visible.map((page, index) => (
          <span key={page} className="race-page-slot">
            {index > 0 && page - (visible[index - 1] ?? page) > 1 ? (
              <i aria-hidden="true">…</i>
            ) : null}
            <Link
              href={paginationHref(basePath, current, page)}
              aria-current={page === meta.page ? "page" : undefined}
            >
              {page}
            </Link>
          </span>
        ))}
      </div>
      {meta.hasNextPage ? (
        <Link href={paginationHref(basePath, current, meta.page + 1)}>
          <span>Próxima</span> <ArrowRight aria-hidden="true" />
        </Link>
      ) : (
        <span aria-disabled="true">
          <span>Próxima</span> <ArrowRight aria-hidden="true" />
        </span>
      )}
    </nav>
  );
}

export { SearchField } from "./search-field";
