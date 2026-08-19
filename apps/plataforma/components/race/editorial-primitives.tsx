import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronRight, Flag, MapPin, Timer } from "lucide-react";
import type { PublicDriver, PublicStage } from "../../lib/public-data";
import { driverVisual, resolveVisualSource, stageVisual } from "../../lib/visual-assets";
import { DriverPlaceholder } from "./driver-placeholder";
import { localizeRaceText, StatusBadge } from "./ui";

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
    <header
      className={`cinema-editorial-heading tg-editorial-heading${inverse ? " is-inverse" : ""}`}
    >
      <span>{index}</span>
      <div>
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      {action ? (
        <Link href={action.href} className="cinema-arrow-link tg-arrow-link">
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
  const visual = stageVisual(index);
  const imageSource = resolveVisualSource(stage.heroImageUrl, visual);

  return (
    <article
      className={`cinema-stage-project${featured ? " cinema-stage-feature is-featured" : ""}`}
    >
      <div className="cinema-stage-media">
        <Image
          src={imageSource}
          alt={stage.heroImageUrl ? `Imagem da etapa ${stage.title}` : visual.alt}
          fill
          priority={featured}
          loading={featured ? undefined : "lazy"}
          quality={featured ? 90 : 86}
          sizes={featured ? "(max-width: 900px) 100vw, 62vw" : "(max-width: 900px) 100vw, 38vw"}
          style={{ objectPosition: stage.heroImageUrl ? "50% center" : visual.position }}
        />
        <span>{String(index + 1).padStart(2, "0")}</span>
      </div>
      <div className="cinema-stage-copy">
        <div className="cinema-stage-topline">
          <time>{stage.date || "Data a definir"}</time>
          <StatusBadge status={stage.status} />
        </div>
        <h3>{localizeRaceText(stage.title)}</h3>
        <p>{stage.shortDescription ?? stage.track}</p>
        <div className="cinema-stage-meta">
          <span>
            <MapPin aria-hidden="true" /> {stage.city}
          </span>
          <span>
            <Flag aria-hidden="true" /> {stage.track}
          </span>
          <span>
            <Timer aria-hidden="true" /> {stage.time || "Horário a definir"}
          </span>
        </div>
        <Link href="/calendario" className="cinema-arrow-link">
          Ver etapa <ChevronRight aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}

export function DriverPoster({ driver, index = 0 }: { driver: PublicDriver; index?: number }) {
  const fallback = driverVisual(index);
  const source = resolveVisualSource(driver.avatarUrl, fallback);
  const hasPublishedPortrait = Boolean(driver.avatarUrl) && source !== fallback.src;

  return (
    <Link
      href={`/pilotos/${driver.slug}`}
      className={`cinema-driver-poster tg-driver-poster${hasPublishedPortrait ? "" : " is-fallback"}`}
      style={{ "--poster-index": index } as React.CSSProperties}
    >
      <div className="cinema-driver-poster-media tg-driver-poster-media">
        {hasPublishedPortrait ? (
          <Image
            src={source}
            alt={`Retrato de ${driver.name}`}
            fill
            priority={index === 0}
            loading={index === 0 ? undefined : "lazy"}
            quality={86}
            sizes="(max-width: 640px) 100vw, (max-width: 1180px) 50vw, 34vw"
            style={{ objectPosition: "50% center" }}
          />
        ) : (
          <DriverPlaceholder name={driver.name} />
        )}
      </div>
      <div className="cinema-driver-poster-copy tg-driver-poster-copy">
        <span>{driver.category}</span>
        <h3>{driver.name}</h3>
        <div>
          <b>{driver.points} pts</b>
          <em>
            {driver.wins} {driver.wins === 1 ? "vitória" : "vitórias"}
          </em>
        </div>
      </div>
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
    <section className="cinema-empty tg-editorial-empty">
      <span>{index}</span>
      <div>
        <Flag aria-hidden="true" />
        <h2>{title}</h2>
        <p>{description}</p>
        {action ? (
          <Link href={action.href} className="cinema-arrow-link tg-arrow-link">
            {action.label} <ArrowRight aria-hidden="true" />
          </Link>
        ) : null}
      </div>
    </section>
  );
}
