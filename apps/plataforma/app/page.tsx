import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowRight,
  CalendarDays,
  Flag,
  MapPin,
  Timer,
  Trophy,
  Users,
} from "lucide-react";
import {
  DriverPoster,
  EditorialEmpty,
  EditorialHeading,
  StageProject,
} from "../components/race/editorial-primitives";
import { HomeHeroMediaLayer } from "../components/race/home-hero-media";
import { CountUp, RaceCountdown, Reveal } from "../components/race/motion";
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
  const driverPreview = [...drivers].sort((a, b) => b.points - a.points).slice(0, 4);
  const featuredNews = news[0] ?? null;
  const secondaryNews = news.slice(1, 4);
  const categories = new Set(drivers.map((driver) => driver.category)).size;
  const totalPodiums = drivers.reduce((sum, driver) => sum + driver.podiums, 0);
  const registrationOpen = nextStageAction.href === "/inscricao";
  const featuredNewsVisual = newsVisual(0);

  return (
    <RaceShell showFooterCallout={false}>
      <main id="conteudo" tabIndex={-1} className="cinema-home">
        <section className="cinema-home-hero" data-design="twice-grind-cinematic">
          <HomeHeroMediaLayer />

          <div className="race-container cinema-home-hero-grid">
            <Reveal className="cinema-home-hero-copy">
              <span>Temporada 2026 • Betim, Minas Gerais</span>
              <h1>
                <span>A pista</span> <em>não espera.</em>
              </h1>
              <p>
                O campeonato Ultras do Kart. Disputa de verdade, evolução a cada volta e uma
                comunidade que vive a pista em Betim.
              </p>
              <div className="cinema-home-actions">
                <Link href="/inscricao" className="race-button race-button-primary">
                  Começar inscrição <ArrowRight aria-hidden="true" />
                </Link>
                <Link href="/calendario" className="race-button race-button-ghost">
                  Ver calendário <CalendarDays aria-hidden="true" />
                </Link>
              </div>
              <small className="cinema-home-action-note">
                Crie sua conta, escolha a categoria e continue pela plataforma oficial.
              </small>
            </Reveal>
          </div>

          <div className="race-container cinema-hero-foot">
            <span>Campeonato Ultras do Kart</span>
            <ArrowDownRight aria-hidden="true" />
          </div>
        </section>

        <section className="cinema-next-race" aria-label="Próxima etapa">
          <div className="race-container cinema-next-stage">
            <div className="cinema-next-stage-main">
              <time>{nextStage?.date ?? "Em breve"}</time>
              <div>
                <div className="cinema-next-stage-head">
                  <span>Próxima etapa</span>
                  <b>{registrationOpen ? "Inscrições abertas" : "Calendário atualizado"}</b>
                </div>
                <h2>{nextStage?.title ?? "Calendário oficial"}</h2>
                <p>{nextStage?.track ?? "Traçado oficial"}</p>
                <div className="cinema-next-stage-location">
                  <MapPin aria-hidden="true" />
                  <span>
                    {nextStage?.location ?? "Kartódromo Internacional de Betim"} ·{" "}
                    {nextStage?.time ?? "Horário a definir"}
                  </span>
                </div>
              </div>
            </div>
            <div className="cinema-next-stage-countdown">
              <span>Até a largada</span>
              {nextStage?.startsAt ? (
                <RaceCountdown target={nextStage.startsAt} />
              ) : (
                <b>Em breve</b>
              )}
            </div>
            <Link href={nextStageAction.href} className="race-button race-button-primary">
              {nextStageAction.label} <ArrowRight aria-hidden="true" />
            </Link>
          </div>
        </section>

        <section className="cinema-quick-links" aria-label="Acesso rápido ao campeonato">
          <div className="race-container cinema-quick-links-grid">
            <Link href="/calendario" className="cinema-quick-link">
              <CalendarDays aria-hidden="true" />
              <span>
                <strong>Calendário</strong>
                <small>Próximas etapas e traçados</small>
              </span>
              <ArrowRight aria-hidden="true" />
            </Link>
            <Link href="/classificacao" className="cinema-quick-link">
              <Trophy aria-hidden="true" />
              <span>
                <strong>Classificação</strong>
                <small>Pontuação e posições do grid</small>
              </span>
              <ArrowRight aria-hidden="true" />
            </Link>
            <Link href="/resultados" className="cinema-quick-link">
              <Timer aria-hidden="true" />
              <span>
                <strong>Resultados</strong>
                <small>Etapas e tempos publicados</small>
              </span>
              <ArrowRight aria-hidden="true" />
            </Link>
          </div>
        </section>

        <section className="cinema-manifesto">
          <div className="race-container cinema-manifesto-grid">
            <Reveal className="cinema-manifesto-copy">
              <h2>O kart é só o começo.</h2>
              <p>
                Um grid que se encontra para competir e voltar melhor. Conheça o campeonato, suas
                categorias e as regras que fazem a disputa acontecer.
              </p>
              <Link href="/regulamento" className="cinema-arrow-link">
                Ler o regulamento <ArrowRight aria-hidden="true" />
              </Link>
            </Reveal>

            <Reveal className="cinema-manifesto-media" delay={100}>
              <Image
                src={premiumVisuals.manifesto.src}
                alt={premiumVisuals.manifesto.alt}
                fill
                quality={88}
                sizes="(max-width: 900px) 100vw, 44vw"
                style={{ objectPosition: premiumVisuals.manifesto.position }}
              />
              <strong>{String(drivers.length).padStart(2, "0")}</strong>
              <span>Pilotos publicados. Uma comunidade em movimento.</span>
            </Reveal>
          </div>
        </section>

        <section className="cinema-season">
          <div className="race-container">
            <EditorialHeading
              index="02"
              title="O próximo encontro é na pista."
              description="Datas, traçados e tudo que você precisa para acompanhar a temporada 2026."
              action={{ href: "/calendario", label: "Calendário completo" }}
              inverse
            />

            <div className="cinema-season-grid">
              {nextStage ? (
                <StageProject stage={nextStage} index={0} featured />
              ) : (
                <EditorialEmpty
                  index="02"
                  title="O calendário oficial ainda não foi publicado."
                  description="As etapas aparecerão aqui assim que a organização disponibilizar os dados da temporada."
                />
              )}

              {stagePreview.length > 0 ? (
                <div className="cinema-stage-rail" aria-label="Outras etapas da temporada">
                  {stagePreview.map((stage, index) => (
                    <Reveal key={stage.id} delay={index * 55}>
                      <StageProject stage={stage} index={index + 1} />
                    </Reveal>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <section className="cinema-proof" aria-label="Dados reais do campeonato">
          <div className="race-container">
            <article>
              <Flag aria-hidden="true" />
              <strong>
                <CountUp value={stages.length} minimumIntegerDigits={2} />
              </strong>
              <span>etapas oficiais</span>
            </article>
            <article>
              <Users aria-hidden="true" />
              <strong>
                <CountUp value={drivers.length} minimumIntegerDigits={2} />
              </strong>
              <span>pilotos publicados</span>
            </article>
            <article>
              <Trophy aria-hidden="true" />
              <strong>
                <CountUp value={totalPodiums} />
              </strong>
              <span>
                pódios entre {drivers.length} {drivers.length === 1 ? "piloto" : "pilotos"}
              </span>
            </article>
            <article>
              <Timer aria-hidden="true" />
              <strong>
                <CountUp value={categories} minimumIntegerDigits={2} />
              </strong>
              <span>categorias</span>
            </article>
          </div>
        </section>

        <section className="cinema-ranking">
          <div className="race-container">
            <EditorialHeading
              index="03"
              title="A disputa pelo topo."
              description="Confira quem lidera a temporada. Pontuação oficial atualizada a cada etapa."
              action={{ href: "/classificacao", label: "Ver classificação" }}
            />

            {topDrivers.length ? (
              <div className="cinema-ranking-layout">
                <div className="cinema-podium" aria-label="Três primeiros colocados">
                  {topDrivers.slice(0, 3).map((driver, index) => (
                    <Link
                      href={`/pilotos/${driver.slug}`}
                      className={`cinema-podium-card place-${index + 1}`}
                      key={driver.slug}
                    >
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <h3>{driver.name}</h3>
                      <p>{driver.category}</p>
                      <strong>
                        {driver.points}
                        <small>pts</small>
                      </strong>
                    </Link>
                  ))}
                </div>

                <div className="cinema-ranking-list">
                  {topDrivers.slice(3).map((driver, index) => (
                    <Link href={`/pilotos/${driver.slug}`} key={driver.slug}>
                      <span>{String(index + 4).padStart(2, "0")}</span>
                      <div>
                        <strong>{driver.name}</strong>
                        <small>{driver.category}</small>
                      </div>
                      <em>{driver.points} pts</em>
                      <ArrowRight aria-hidden="true" />
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <EditorialEmpty
                index="03"
                title="A classificação ainda não começou."
                description="Os pilotos e pontos aparecerão após a publicação oficial da temporada."
              />
            )}
          </div>
        </section>

        <section className="cinema-drivers">
          <div className="race-container">
            <EditorialHeading
              index="04"
              title="Conheça o grid."
              description="Os pilotos, os pontos e as histórias por trás de cada capacete."
              action={{ href: "/pilotos", label: "Todos os pilotos" }}
              inverse
            />

            {driverPreview.length ? (
              <div className="cinema-driver-mosaic">
                {driverPreview.map((driver, index) => (
                  <DriverPoster driver={driver} index={index} key={driver.slug} />
                ))}
              </div>
            ) : (
              <EditorialEmpty
                index="04"
                title="Os perfis oficiais ainda não foram publicados."
                description="O grid aparecerá aqui quando os pilotos forem disponibilizados pela organização."
              />
            )}
          </div>
        </section>

        <section className="cinema-community">
          <div className="cinema-community-media" aria-hidden="true">
            <Image
              src={premiumVisuals.community.src}
              alt=""
              fill
              quality={88}
              sizes="100vw"
              style={{ objectPosition: premiumVisuals.community.position }}
            />
          </div>
          <div className="race-container cinema-community-copy">
            <h2>Rivais na pista. Ultras em todo lugar.</h2>
            <p>
              Do briefing à bandeirada, a comunidade faz parte de cada volta. Respeito, troca de
              experiência e vontade de acelerar juntos.
            </p>
            <div className="cinema-community-values">
              <span>Respeito</span>
              <span>Constância</span>
              <span>Disputa limpa</span>
              <span>Evolução</span>
            </div>
          </div>
        </section>

        <section className="cinema-news">
          <div className="race-container">
            <EditorialHeading
              index="06"
              title="Direto do paddock."
              description="Comunicados, bastidores e decisões oficiais do campeonato."
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
                    <span>{featuredNews.category}</span>
                    <h3>{featuredNews.title}</h3>
                    <p>{featuredNews.summary}</p>
                    <time>{new Date(featuredNews.publishedAt).toLocaleDateString("pt-BR")}</time>
                  </div>
                </Link>
                <div className="cinema-news-secondary">
                  {secondaryNews.map((item) => (
                    <Link href={`/noticias/${item.slug}`} key={item.slug}>
                      <span>{item.category}</span>
                      <h3>{item.title}</h3>
                      <time>{new Date(item.publishedAt).toLocaleDateString("pt-BR")}</time>
                      <ArrowRight aria-hidden="true" />
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <EditorialEmpty
                index="06"
                title="As histórias oficiais ainda estão sendo preparadas."
                description="Quando a organização publicar comunicados e bastidores, eles aparecerão aqui sem conteúdo fictício para completar o layout."
                action={{ href: "/calendario", label: "Acompanhar o calendário" }}
              />
            )}
          </div>
        </section>

        <section className="cinema-sponsors">
          <div className="race-container">
            <span>Marcas que aceleram com o UDK</span>
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

        <section className="cinema-final-cta">
          <div className="race-container">
            <h2>A próxima largada pode ser sua.</h2>
            <p>
              Crie sua conta, escolha a categoria e acompanhe cada etapa pela plataforma oficial.
            </p>
            <Link href="/inscricao" className="race-button race-button-primary">
              Começar inscrição <ArrowRight aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>
    </RaceShell>
  );
}
