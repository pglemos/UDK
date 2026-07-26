import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Flag,
  ShieldCheck,
  Trophy,
  Users,
} from "lucide-react";
import { CountUp, RaceCountdown, Reveal } from "../components/race/motion";
import { RaceShell } from "../components/race/race-shell";
import {
  DriverVisual,
  EmptyState,
  SectionHeading,
  StageMeta,
  StatusBadge,
  TrackGlyph,
} from "../components/race/ui";
import { getPublicContentBundle } from "../lib/public-content";
import { formatLapTime, getPublicData } from "../lib/public-data";

export const metadata: Metadata = {
  title: "Ultras do Kart",
  description:
    "Portal oficial do campeonato Ultras do Kart: calendário, classificação, resultados, pilotos e inscrições.",
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const [{ drivers, stages, results }, { news, sponsors }] = await Promise.all([
    getPublicData(),
    getPublicContentBundle(),
  ]);

  const now = Date.now();
  const nextStage =
    stages.find((stage) => stage.startsAt && new Date(stage.startsAt).getTime() >= now) ??
    stages[0] ??
    null;
  const topDrivers = drivers.slice(0, 3);
  const latestResults = results.slice(0, 3);
  const latestNews = news.slice(0, 4);
  const categories = new Set(drivers.map((driver) => driver.category)).size;

  return (
    <RaceShell>
      <main id="conteudo">
        <section className="race-hero">
          <div className="race-hero-media" aria-hidden="true">
            <img src="/media/udk-race-hero.webp" alt="" fetchPriority="high" />
          </div>
          <div className="race-container race-hero-content">
            <div className="race-hero-copy">
              <span className="race-kicker">Campeonato UDK 2026</span>
              <h1>
                Ultras
                <em>do Kart</em>
              </h1>
              <p>
                Kart de verdade, disputa limpa e evolução em cada décimo. Acompanhe a temporada
                oficial, conheça o grid e entre para a próxima largada.
              </p>
              <div className="race-hero-actions">
                <Link className="race-button race-button-primary" href="/inscricao">
                  Entrar no grid <ArrowRight aria-hidden="true" />
                </Link>
                <Link className="race-button race-button-ghost" href="/calendario">
                  Ver calendário
                </Link>
              </div>
            </div>

            <aside className="race-next-race" aria-label="Próxima etapa">
              {nextStage ? (
                <>
                  <div className="race-next-race-head">
                    <span className="race-kicker">Próxima largada</span>
                    <StatusBadge status={nextStage.status} />
                  </div>
                  <h2>{nextStage.date || nextStage.title}</h2>
                  <p>{nextStage.title} • {nextStage.city}</p>
                  <StageMeta stage={nextStage} />
                  <RaceCountdown target={nextStage.startsAt} />
                </>
              ) : (
                <>
                  <span className="race-kicker">Calendário oficial</span>
                  <h2>Próxima etapa</h2>
                  <p>A organização publicará em breve a próxima data da temporada.</p>
                  <Link className="race-button race-button-secondary" href="/calendario">
                    Acompanhar calendário
                  </Link>
                </>
              )}
            </aside>
          </div>
        </section>

        <div className="race-telemetry" aria-label="Informações do campeonato">
          <div className="race-telemetry-track">
            {[0, 1].map((copy) => (
              <div key={copy}>
                <span>Temporada oficial 2026</span>
                <span>Kartódromo Internacional de Betim</span>
                <span>Rápidos e Insanos</span>
                <span>Resultados versionados</span>
                <span>Disputa limpa</span>
              </div>
            ))}
          </div>
        </div>

        <section className="race-section is-tight">
          <div className="race-container">
            <Reveal>
              <div className="race-stats" aria-label="Números da temporada">
                <div className="race-stat">
                  <Users aria-hidden="true" />
                  <strong><CountUp value={drivers.length} /></strong>
                  <span>Pilotos no grid</span>
                </div>
                <div className="race-stat">
                  <Flag aria-hidden="true" />
                  <strong><CountUp value={stages.length} /></strong>
                  <span>Etapas publicadas</span>
                </div>
                <div className="race-stat">
                  <Trophy aria-hidden="true" />
                  <strong><CountUp value={categories} /></strong>
                  <span>Categorias</span>
                </div>
                <div className="race-stat">
                  <ShieldCheck aria-hidden="true" />
                  <strong><CountUp value={results.length} /></strong>
                  <span>Resultados oficiais</span>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        <section className="race-section">
          <div className="race-container">
            <Reveal>
              <SectionHeading
                eyebrow="Classificação"
                title="Quem dita o ritmo"
                description="Os líderes do campeonato, com pontos, vitórias e consistência acumulados na temporada."
                action={{ href: "/classificacao", label: "Classificação completa" }}
              />
            </Reveal>

            {topDrivers.length ? (
              <div className="race-podium">
                {topDrivers.map((driver, index) => {
                  const place = index + 1;
                  return (
                    <Reveal key={driver.slug} delay={index * 90}>
                      <Link
                        className={`race-podium-card is-${place === 1 ? "first" : place === 2 ? "second" : "third"}`}
                        href={`/pilotos/${driver.slug}`}
                      >
                        <div className="race-podium-place">
                          <strong>0{place}</strong>
                          <DriverVisual driver={driver} />
                        </div>
                        <h3>{driver.name}</h3>
                        <p>#{driver.number} • {driver.category}</p>
                        <div className="race-podium-points">
                          <div>
                            <strong>{driver.points} pts</strong>
                            <span>temporada 2026</span>
                          </div>
                          <span>{driver.wins} vitórias • {driver.podiums} pódios</span>
                        </div>
                      </Link>
                    </Reveal>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                title="Classificação aguardando publicação"
                description="Assim que a organização homologar os primeiros pontos, os líderes aparecerão aqui."
                action={{ href: "/classificacao", label: "Abrir classificação" }}
              />
            )}
          </div>
        </section>

        <section className="race-section is-panel">
          <div className="race-container">
            <Reveal>
              <SectionHeading
                eyebrow="Calendário"
                title="A próxima bandeirada"
                description="Datas, traçados, formatos e status das etapas oficiais."
                action={{ href: "/calendario", label: "Ver temporada" }}
              />
            </Reveal>

            {nextStage ? (
              <Reveal>
                <article className="race-highlight-panel">
                  <div>
                    <div className="race-next-race-head">
                      <span className="race-kicker">Etapa em destaque</span>
                      <StatusBadge status={nextStage.status} />
                    </div>
                    <h2>{nextStage.title}</h2>
                    <p>
                      {nextStage.shortDescription ??
                        "Uma noite para testar precisão, leitura de corrida e coragem em cada curva."}
                    </p>
                    <StageMeta stage={nextStage} />
                    <div className="race-hero-actions">
                      <Link className="race-button race-button-primary" href="/calendario">
                        Detalhes da etapa <ArrowRight aria-hidden="true" />
                      </Link>
                      <Link className="race-button race-button-ghost" href="/inscricao">
                        Inscrever-se
                      </Link>
                    </div>
                  </div>
                  {nextStage.trackMapUrl ? (
                    <img src={nextStage.trackMapUrl} alt={`Mapa do ${nextStage.track}`} />
                  ) : (
                    <TrackGlyph label={`Representação do ${nextStage.track}`} />
                  )}
                </article>
              </Reveal>
            ) : (
              <EmptyState
                title="Calendário em preparação"
                description="A próxima etapa será exibida após a publicação oficial."
              />
            )}
          </div>
        </section>

        <section className="race-section">
          <div className="race-container">
            <Reveal>
              <SectionHeading
                eyebrow="Resultados"
                title="O cronômetro não mente"
                description="Sessões oficiais, melhor volta e versão homologada de cada resultado."
                action={{ href: "/resultados", label: "Todos os resultados" }}
              />
            </Reveal>

            {latestResults.length ? (
              <div className="race-grid">
                {latestResults.map((result, index) => (
                  <Reveal key={result.id} delay={index * 70}>
                    <Link className="race-result-card" href={`/resultados?resultado=${result.id}`}>
                      <div className="race-result-card-meta">
                        <StatusBadge status={result.status} />
                        <span>Versão {result.version}</span>
                      </div>
                      <h3>{result.stageTitle}</h3>
                      <p>{result.category} • {result.track}</p>
                      <div className="race-fastest-lap">
                        <span>Melhor volta</span>
                        <strong>{formatLapTime(result.fastestLapMs)}</strong>
                      </div>
                    </Link>
                  </Reveal>
                ))}
              </div>
            ) : (
              <EmptyState
                title="Nenhum resultado publicado"
                description="Os resultados aparecerão aqui somente após a publicação oficial pela organização."
                action={{ href: "/resultados", label: "Abrir resultados" }}
              />
            )}
          </div>
        </section>

        <section className="race-section is-panel">
          <div className="race-container">
            <Reveal>
              <SectionHeading
                eyebrow="Notícias"
                title="Direto do paddock"
                description="Comunicados, bastidores, alterações e tudo que movimenta o UDK."
                action={{ href: "/noticias", label: "Ver notícias" }}
              />
            </Reveal>

            {latestNews.length ? (
              <div className="race-grid">
                {latestNews.slice(0, 3).map((item, index) => (
                  <Reveal key={item.slug} delay={index * 80}>
                    <Link className="race-news-card" href={`/noticias/${item.slug}`}>
                      <div
                        className="race-news-card-media"
                        style={item.coverImageUrl ? { backgroundImage: `linear-gradient(0deg, var(--race-panel), transparent 65%), url("${item.coverImageUrl}")` } : undefined}
                        aria-hidden="true"
                      />
                      <div className="race-news-meta">
                        <span>{item.category}</span>
                        <span>{item.readingMinutes} min</span>
                      </div>
                      <h3>{item.title}</h3>
                      <p>{item.summary}</p>
                    </Link>
                  </Reveal>
                ))}
              </div>
            ) : (
              <EmptyState
                title="O paddock ainda está silencioso"
                description="Os comunicados oficiais serão publicados aqui. Enquanto isso, acompanhe o Instagram do UDK."
                action={{ href: "https://www.instagram.com/ultrasdokart", label: "Abrir Instagram" }}
              />
            )}
          </div>
        </section>

        <section className="race-section is-tight">
          <div className="race-container">
            <span className="race-kicker">Parceiros oficiais</span>
            <div className="race-sponsor-rail">
              {sponsors.length ? (
                sponsors.map((sponsor) => (
                  <a
                    key={sponsor.slug}
                    href={sponsor.websiteUrl || "#"}
                    target={sponsor.websiteUrl ? "_blank" : undefined}
                    rel={sponsor.websiteUrl ? "noreferrer" : undefined}
                    aria-label={sponsor.name}
                  >
                    {sponsor.logoUrl ? <img src={sponsor.logoUrl} alt={sponsor.name} /> : sponsor.name}
                  </a>
                ))
              ) : (
                <span>Espaço reservado aos patrocinadores da temporada</span>
              )}
            </div>
          </div>
        </section>

        <section className="race-section">
          <div className="race-container">
            <Reveal>
              <div className="race-cta">
                <span className="race-kicker">Sua vez</span>
                <h2>O grid não espera.</h2>
                <p>
                  Crie sua conta, escolha a categoria e acompanhe cada etapa da sua participação
                  dentro da plataforma oficial.
                </p>
                <div className="race-hero-actions">
                  <Link className="race-button race-button-primary" href="/inscricao">
                    Começar inscrição <ArrowRight aria-hidden="true" />
                  </Link>
                  <Link className="race-button race-button-ghost" href="/regulamento">
                    Ler regulamento
                  </Link>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      </main>
    </RaceShell>
  );
}
