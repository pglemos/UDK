import Link from "next/link";
import { ArrowRight, ChevronRight, Flag, MapPin, Timer } from "lucide-react";
import type { PublicDriver, PublicStage } from "../../lib/public-data";
import { OfficialLogo } from "./official-logo";
import { StatusBadge } from "./ui";

export function EditorialHeading({
  index,
  title,
  description,
  action,
  inverse = false,
}: {
  index: string;
  title: string;
  description?: string;
  action?: { href: string; label: string };
  inverse?: boolean;
}) {
  return (
    <header className={`tg-editorial-heading${inverse ? " is-inverse" : ""}`}>
      <span>{index}</span>
      <div>
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      {action ? (
        <Link href={action.href} className="tg-arrow-link">
          {action.label} <ArrowRight aria-hidden="true" />
        </Link>
      ) : null}
    </header>
  );
}

export function StageProject({
  stage,
  index,
  featured = false,
}: {
  stage: PublicStage;
  index: number;
  featured?: boolean;
}) {
  return (
    <article className={`tg-stage-project${featured ? " is-featured" : ""}`}>
      <div className="tg-stage-project-media">
        <img
          src={stage.heroImageUrl ?? "/media/udk-race-hero.webp"}
          alt=""
          loading={featured ? "eager" : "lazy"}
        />
        <span>{String(index + 1).padStart(2, "0")}</span>
      </div>
      <div className="tg-stage-project-copy">
        <div className="tg-stage-project-topline">
          <time>{stage.date || "Data a definir"}</time>
          <StatusBadge status={stage.status} />
        </div>
        <h3>{stage.title}</h3>
        <p>{stage.shortDescription ?? stage.track}</p>
        <div className="tg-stage-project-meta">
          <span><MapPin aria-hidden="true" /> {stage.city}</span>
          <span><Flag aria-hidden="true" /> {stage.track}</span>
          <span><Timer aria-hidden="true" /> {stage.time || "Horário a definir"}</span>
        </div>
        <Link href="/calendario" className="tg-arrow-link">
          Ver etapa <ChevronRight aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}

export function DriverPoster({ driver, index = 0 }: { driver: PublicDriver; index?: number }) {
  return (
    <Link
      href={`/pilotos/${driver.slug}`}
      className="tg-driver-poster"
      style={{ "--poster-index": index } as React.CSSProperties}
    >
      <div className="tg-driver-poster-media">
        {driver.avatarUrl ? (
          <img src={driver.avatarUrl} alt="" loading="lazy" />
        ) : (
          <div className="tg-driver-fallback" aria-hidden="true">
            <OfficialLogo variant="mark-light" width={74} />
            <strong>#{driver.number}</strong>
          </div>
        )}
      </div>
      <div className="tg-driver-poster-copy">
        <span>{driver.category}</span>
        <h3>{driver.name}</h3>
        <div>
          <b>{driver.points} pts</b>
          <em>{driver.wins} vitórias</em>
        </div>
      </div>
      <span className="tg-driver-poster-number">#{driver.number}</span>
      <ChevronRight aria-hidden="true" />
    </Link>
  );
}

export function EditorialEmpty({
  index,
  title,
  description,
  action,
}: {
  index: string;
  title: string;
  description: string;
  action?: { href: string; label: string };
}) {
  return (
    <section className="tg-editorial-empty">
      <span>{index}</span>
      <div>
        <Flag aria-hidden="true" />
        <h2>{title}</h2>
        <p>{description}</p>
        {action ? (
          <Link href={action.href} className="tg-arrow-link">
            {action.label} <ArrowRight aria-hidden="true" />
          </Link>
        ) : null}
      </div>
    </section>
  );
}
