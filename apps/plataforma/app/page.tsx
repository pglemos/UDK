import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  ChevronRight,
  Flag,
  Gauge,
  MapPin,
  ShieldCheck,
  Timer,
  Trophy,
  Users,
} from "lucide-react";
import { RaceCountdown, Reveal } from "../components/race/motion";
import { RaceShell } from "../components/race/race-shell";
import { getPublicContentBundle } from "../lib/public-content";
import { getPublicData } from "../lib/public-data";

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

  const nextStage = stages[0] ?? null;
  const latestNews = news.slice(0, 3);
  const stagePreview = stages.slice(0, 4);
  const topDrivers = [...drivers]
    .sort((a, b) => b.points - a.points || (a.position ?? 999) - (b.position ?? 999))
    .slice(0, 5);
  const categories = new Set(drivers.map((driver) => driver.category)).size;
  const totalPodiums = drivers.reduce((sum, driver) => sum + driver.podiums, 0);

  return (
    <RaceShell>
      <main id="conteudo" className="udk-home">
        <section className="udk-home-hero">
          <div className="udk-home-media" aria-hidden="true">
            <img src="/media/udk-race-hero.webp" alt="" fetchPriority="high" />
          </div>
          <div className="race-container udk-home-hero-inner">
            <Reveal className="udk-home-copy">
              <span>Campeonato UDK 2026</span>
              <h1>
                Ultras
                <em>do Kart</em>
              </h1>
              <p>
                Um campeonato feito para quem trata cada volta como evolução: disputa intensa,
                respeito no grid e performance construída etapa após etapa.
              </p>
              <div className="udk-home-actions">
                <Link href="/inscricao" className="race-button race-button-primary">
                  Entrar no grid <ArrowRight aria-hidden="true" />
                </Link>
                <Link href="/calendario" className="race-button race-button-ghost">
                  Ver calendário <CalendarDays aria-hidden="true" />
                </Link>
              </div>
              <div className="udk-hero-principles" aria-label="Pilares do UDK">
                <span>Ritmo</span>
                <span>Evolução</span>
                <span>Respeito</span>
                <span>Disputa limpa</span>
              </div>
            </Reveal>

            <Reveal className="udk-hero-stage-card" delay={120}>
              <div className="udk-hero-stage-topline">
                <span>Próxima etapa</span>
                <b>{nextStage?.status === "registration" ? "Inscrições abertas" : "Temporada 2026"}</b>
              </div>
              <div className="udk-hero-stage-date">
                <strong>{nextStage?.date ?? "A definir"}</strong>
                <span>{nextStage?.title ?? "Calendário oficial"}</span>
              </div>
              <div className="udk-hero-stage-location">
                <MapPin aria-hidden="true" />
                <div>
                  <strong>{nextStage?.location ?? "Kartódromo Internacional de Betim"}</strong>
                  <span>{nextStage?.track ?? "Traçado oficial"} • {nextStage?.city ?? "Betim/MG"}</span>
                </div>
              </div>
              <div className="udk-hero-stage-countdown">
                <span>Até a largada</span>
                {nextStage?.startsAt ? <RaceCountdown target={nextStage.startsAt} /> : <b>Em breve</b>}
              </div>
              <Link href="/calendario" className="udk-hero-stage-link">
                Ver detalhes da etapa <ArrowRight aria-hidden="true" />
              </Link>
            </Reveal>
          </div>
        </section>

        <section className="udk-home-marquee" aria-label="Identidade do campeonato">
          <div>
            <span>Ultras do Kart</span>
            <i />
            <span>Performance em pista</span>
            <i />
            <span>Temporada 2026</span>
            <i />
            <span>Kartódromo de Betim</span>
            <i />
            <span>Ultras do Kart</span>
          </div>
        </section>

        <section className="race-container udk-stat-grid" aria-label="Números do campeonato">
          <article className="udk-stat-card">
            <Flag aria-hidden="true" />
            <strong>{String(stages.length).padStart(2, "0")}</strong>
            <span>Etapas oficiais</span>
          </article>
          <article className="udk-stat-card">
            <Users aria-hidden="true" />
            <strong>{String(drivers.length).padStart(2, "0")}</strong>
            <span>Pilotos no grid</span>
          </article>
          <article className="udk-stat-card">
            <Gauge aria-hidden="true" />
            <strong>{totalPodiums}</strong>
            <span>Pódios acumulados</span>
          </article>
          <article className="udk-stat-card">
            <ShieldCheck aria-hidden="true" />
            <strong>{String(categories).padStart(2, "0")}</strong>
            <span>Categorias</span>
          </article>
        </section>

        <section className="race-section udk-season-section">
          <div className="race-container">
            <div className="udk-section-title is-wide">
              <div>
                <span>Temporada em movimento</span>
                <h2>Da preparação à bandeirada.</h2>
                <p>Calendário, traçado e contexto de cada encontro em uma leitura clara, visual e feita para piloto.</p>
              </div>
              <Link href="/calendario">Calendário completo <ArrowRight aria-hidden="true" /></Link>
            </div>

            <div className="udk-season-grid">
              <Reveal className="udk-stage-feature">
                <div className="udk-stage-feature-media">
                  <img src={nextStage?.heroImageUrl ?? "/media/udk-race-hero.webp"} alt="" loading="lazy" />
                </div>
                <div className="udk-stage-feature-copy">
                  <span>{nextStage?.date ?? "Data a definir"}</span>
                  <h3>{nextStage?.title ?? "Próxima etapa UDK"}</h3>
                  <p>{nextStage?.shortDescription ?? "Ritmo, estratégia e disputa limpa no Kartódromo Internacional de Betim."}</p>
                  <div>
                    <b><MapPin aria-hidden="true" /> {nextStage?.city ?? "Betim/MG"}</b>
                    <b><Timer aria-hidden="true" /> {nextStage?.time ?? "Horário a definir"}</b>
                  </div>
                  <Link href="/calendario" className="race-button race-button-primary">
                    Ver etapa <ChevronRight aria-hidden="true" />
                  </Link>
                </div>
              </Reveal>

              <div className="udk-stage-rail">
                {stagePreview.map((stage, index) => (
                  <Reveal key={stage.id} delay={index * 60}>
                    <Link href="/calendario" className={`udk-stage-rail-item${index === 0 ? " is-current" : ""}`}>
                      <strong>{String(index + 1).padStart(2, "0")}</strong>
                      <div>
                        <span>{stage.date}</span>
                        <h3>{stage.title}</h3>
                        <p>{stage.track}</p>
                      </div>
                      <ChevronRight aria-hidden="true" />
                    </Link>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="race-section udk-ranking-section">
          <div className="race-container udk-ranking-layout">
            <Reveal className="udk-ranking-copy">
              <span>Classificação oficial</span>
              <h2>Quem entrega volta após volta aparece no topo.</h2>
              <p>
                Pontos, vitórias e pódios apresentados sem ruído. A pista decide; o portal registra.
              </p>
              <div className="udk-ranking-actions">
                <Link href="/classificacao" className="race-button race-button-primary">
                  Ver classificação <Trophy aria-hidden="true" />
                </Link>
                <Link href="/pilotos" className="race-button race-button-ghost">
                  Conhecer pilotos
                </Link>
              </div>
            </Reveal>

            <Reveal className="udk-ranking-board" delay={100}>
              <div className="udk-ranking-board-head">
                <span>Top 5</span>
                <b>Temporada 2026</b>
              </div>
              {topDrivers.map((driver, index) => (
                <Link href={`/pilotos/${driver.slug}`} className="udk-ranking-row" key={driver.slug}>
                  <span className={`udk-ranking-position position-${index + 1}`}>{index + 1}</span>
                  <div className="udk-ranking-avatar">
                    {driver.avatarUrl ? <img src={driver.avatarUrl} alt="" loading="lazy" /> : <strong>#{driver.number}</strong>}
                  </div>
                  <div className="udk-ranking-driver">
                    <strong>{driver.name}</strong>
                    <span>{driver.category}</span>
                  </div>
                  <div className="udk-ranking-data">
                    <b>{driver.points}</b>
                    <span>pts</span>
                  </div>
                  <ChevronRight aria-hidden="true" />
                </Link>
              ))}
            </Reveal>
          </div>
        </section>

        <section className="race-section udk-home-news">
          <div className="race-container">
            <div className="udk-section-title is-wide">
              <div>
                <span>Conteúdo oficial</span>
                <h2>Notícias do grid.</h2>
              </div>
              <Link href="/noticias">Ver todas <ArrowRight aria-hidden="true" /></Link>
            </div>
            <div className="udk-news-grid">
              {latestNews.map((item, index) => (
                <Reveal key={item.slug} delay={index * 70}>
                  <Link href={`/noticias/${item.slug}`} className="udk-news-card">
                    <div className="udk-news-card-media">
                      <img src={item.coverImageUrl ?? "/media/udk-race-hero.webp"} alt="" loading="lazy" />
                    </div>
                    <div className="udk-news-card-copy">
                      <span>{item.category}</span>
                      <h3>{item.title}</h3>
                      <p>{item.summary}</p>
                      <time>{new Date(item.publishedAt).toLocaleDateString("pt-BR")}</time>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="udk-sponsor-strip">
          <div className="race-container udk-sponsor-strip-inner">
            <span>Marcas no grid</span>
            <div>
              {sponsors.map((sponsor) => <strong key={sponsor.slug}>{sponsor.name}</strong>)}
            </div>
          </div>
        </section>

        <section className="race-section udk-final-cta-section">
          <div className="race-container">
            <Reveal className="udk-final-cta">
              <div>
                <span>Temporada 2026</span>
                <h2>Seu nome também pode estar no grid.</h2>
                <p>Crie sua conta, escolha a categoria e acompanhe cada etapa pela plataforma oficial.</p>
              </div>
              <Link href="/inscricao" className="race-button race-button-primary">
                Começar inscrição <ArrowRight aria-hidden="true" />
              </Link>
            </Reveal>
          </div>
        </section>
      </main>
    </RaceShell>
  );
}
