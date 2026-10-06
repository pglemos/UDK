import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin } from "lucide-react";
import { EditorialEmpty, EditorialHeading } from "../components/race/editorial-primitives";
import { RaceShell } from "../components/race/race-shell";
import { getPublicContentBundle } from "../lib/public-content";
import { fallbackFederations } from "../lib/public-content-fallbacks";
import { getNextUpcomingStage, getPublicData, getStageAction } from "../lib/public-data";
import { newsVisual, premiumVisuals } from "../lib/visual-assets";

export const metadata: Metadata = {
  title: "Ultras do Kart",
  description: "Portal oficial do campeonato Ultras do Kart.",
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const [{ drivers, stages }, { news, sponsors }] = await Promise.all([
    getPublicData(),
    getPublicContentBundle(),
  ]);

  const nextStage = getNextUpcomingStage(stages);
  const nextStageAction = getStageAction(nextStage);
  const topDrivers = [...drivers]
    .sort((a, b) => b.points - a.points || (a.position ?? 999) - (b.position ?? 999))
    .slice(0, 5);
  const remainingStages = stages.filter((stage) => stage.id !== nextStage?.id);
  const followingStage = getNextUpcomingStage(remainingStages);
  const stagePreview = [
    followingStage,
    getNextUpcomingStage(remainingStages.filter((stage) => stage.id !== followingStage?.id)),
  ].filter((stage) => stage !== null);
  const featuredNews = news[0] ?? null;
  const secondaryNews = news.slice(1, 4);
  const featuredNewsVisual = newsVisual(0);

  return (
    <RaceShell showFooterCallout={false}>
      <main id="conteudo" tabIndex={-1} className="cinema-home">
        <section className="cinema-home-hero">
          <div className="race-container udk-team-opening">
            <div className="udk-team-copy">
              <h1>
                <span>ULTRAS</span>
                <span>DO KART</span>
              </h1>
              <p className="udk-season-location">
                Campeonato 2026 <span>Betim, MG</span>
              </p>
              <section className="udk-race-ticket" aria-label="Próxima etapa">
                <div className="udk-ticket-heading">
                  <h2>Próxima etapa</h2>
                  <CalendarDays aria-hidden="true" />
                </div>
                <div className="udk-ticket-date">
                  <time dateTime={nextStage?.startsAt ?? undefined}>
                    {nextStage?.date ?? "Em breve"}
                  </time>
                  <span>{nextStage?.time ?? "Horário a definir"}</span>
                </div>
                <h3>{nextStage?.title ?? "Calendário oficial"}</h3>
                <p>{nextStage?.track ?? "Traçado a definir"}</p>
                <div className="udk-ticket-actions">
                  <Link href={nextStageAction.href} className="race-button race-button-primary">
                    {nextStageAction.label} <ArrowRight aria-hidden="true" />
                  </Link>
                  <Link href="/calendario" className="cinema-arrow-link">
                    Ver calendário <ArrowRight aria-hidden="true" />
                  </Link>
                </div>
              </section>
            </div>
            <figure className="udk-team-photo">
              <div className="cinema-home-hero-media">
                <Image
                  src={premiumVisuals.race.src}
                  alt={premiumVisuals.race.alt}
                  fill
                  priority
                  quality={90}
                  sizes="(max-width: 760px) 100vw, 50vw"
                  style={{ objectPosition: premiumVisuals.race.position }}
                />
              </div>
              <figcaption>
                <MapPin aria-hidden="true" /> Kartódromo Internacional de Betim
              </figcaption>
            </figure>
          </div>
        </section>

        <section className="udk-season-board" aria-label="Resumo da temporada">
          <div className="race-container udk-season-board-grid">
            <section className="cinema-ranking">
              <EditorialHeading
                index=""
                title="Classificação"
                action={{ href: "/classificacao", label: "Ver completa" }}
              />
              {topDrivers.length ? (
                <ol className="udk-leader-list">
                  {topDrivers.map((driver, index) => (
                    <li key={driver.slug}>
                      <Link href={`/pilotos/${driver.slug}`}>
                        <span className="udk-leader-position">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <div>
                          <strong>{driver.name}</strong>
                          <small>{driver.category}</small>
                        </div>
                        <span className="udk-leader-points">
                          {driver.points}
                          <small>pts</small>
                        </span>
                        <ArrowRight aria-hidden="true" />
                      </Link>
                    </li>
                  ))}
                </ol>
              ) : (
                <EditorialEmpty
                  index=""
                  title="Classificação ainda não publicada"
                  description="Consulte os resultados após a primeira etapa."
                />
              )}
              <Link href="/resultados" className="cinema-arrow-link udk-board-more">
                Resultados e tempos <ArrowRight aria-hidden="true" />
              </Link>
            </section>
            <section className="cinema-season">
              <EditorialHeading
                index=""
                title="Próximas etapas"
                action={{ href: "/calendario", label: "Todas as datas" }}
              />
              {stagePreview.length ? (
                <div className="udk-next-dates">
                  {stagePreview.map((stage) => (
                    <Link href="/calendario" key={stage.id}>
                      <time dateTime={stage.startsAt ?? undefined}>{stage.date}</time>
                      <div>
                        <h3>{stage.title}</h3>
                        <p>{stage.track}</p>
                        <small>
                          {stage.time} · {stage.city}
                        </small>
                      </div>
                      <ArrowRight aria-hidden="true" />
                    </Link>
                  ))}
                </div>
              ) : (
                <p>Novas datas serão publicadas pela organização.</p>
              )}
              <Link href="/regulamento" className="cinema-arrow-link udk-board-more">
                Regulamento 2026 <ArrowRight aria-hidden="true" />
              </Link>
            </section>
          </div>
        </section>

        <section className="cinema-news">
          <div className="race-container">
            <EditorialHeading
              index="06"
              title="Notícias"
              description="Comunicados da organização e cobertura das etapas."
              action={{ href: "/noticias", label: "Todas as notícias" }}
            />

            {featuredNews ? (
              <div className="cinema-news-layout">
                <Link href={`/noticias/${featuredNews.slug}`} className="cinema-news-feature">
                  <div className="cinema-news-feature-media">
                    <Image
                      src={featuredNews.coverImageUrl ?? featuredNewsVisual.src}
                      alt={`Capa da notícia: ${featuredNews.title}`}
                      fill
                      quality={86}
                      sizes="(max-width: 900px) 100vw, 62vw"
                      style={{ objectPosition: featuredNewsVisual.position }}
                    />
                  </div>
                  <div>
                    <h3>{featuredNews.title}</h3>
                    <span>{featuredNews.category}</span>
                    <p>{featuredNews.summary}</p>
                    <time>{new Date(featuredNews.publishedAt).toLocaleDateString("pt-BR")}</time>
                  </div>
                </Link>
                <div className="cinema-news-secondary">
                  {secondaryNews.map((item) => (
                    <Link href={`/noticias/${item.slug}`} key={item.slug}>
                      <h3>{item.title}</h3>
                      <span>{item.category}</span>
                      <time>{new Date(item.publishedAt).toLocaleDateString("pt-BR")}</time>
                      <ArrowRight aria-hidden="true" />
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <EditorialEmpty
                index="06"
                title="Nenhuma notícia publicada"
                description="Os comunicados da organização aparecerão aqui."
                action={{ href: "/calendario", label: "Acompanhar o calendário" }}
              />
            )}
          </div>
        </section>

        <section className="cinema-sponsors">
          <div className="race-container">
            <h2>Patrocinadores</h2>
            {sponsors.length ? (
              <div className="cinema-sponsor-list">
                {sponsors.map((sponsor) => {
                  const content = (
                    <>
                      <span className="cinema-sponsor-mark" data-sponsor-slug={sponsor.slug}>
                        <Image
                          src={sponsor.logoUrl}
                          alt={`Logo ${sponsor.name}`}
                          width={220}
                          height={100}
                          sizes="(max-width: 720px) 140px, 180px"
                          loading="eager"
                        />
                      </span>
                      <strong>{sponsor.name}</strong>
                    </>
                  );

                  return sponsor.websiteUrl ? (
                    <a
                      key={sponsor.slug}
                      className="cinema-sponsor-item"
                      href={sponsor.websiteUrl}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Abrir Instagram de ${sponsor.name}`}
                    >
                      {content}
                    </a>
                  ) : (
                    <div key={sponsor.slug} className="cinema-sponsor-item">
                      {content}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p>
                As parcerias oficiais serão exibidas assim que forem publicadas pela organização.
              </p>
            )}
            {fallbackFederations.length ? (
              <div className="cinema-federation-list" aria-label="Federações parceiras">
                {fallbackFederations.map((federation) => (
                  <a
                    key={federation.slug}
                    className="cinema-federation-item"
                    href={federation.websiteUrl}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Abrir Instagram de ${federation.name}`}
                  >
                    <span className="cinema-federation-mark" data-sponsor-slug={federation.slug}>
                      <Image
                        src={federation.logoUrl}
                        alt={`Logo ${federation.name}`}
                        width={160}
                        height={40}
                        sizes="160px"
                        loading="eager"
                      />
                    </span>
                    <span className="cinema-federation-copy">
                      <small>{federation.label}</small>
                      <strong>{federation.name}</strong>
                    </span>
                    <ArrowRight aria-hidden="true" />
                  </a>
                ))}
              </div>
            ) : null}
          </div>
        </section>
      </main>
    </RaceShell>
  );
}
