import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, ChevronRight, Flag, Gauge, ShieldCheck, Users } from "lucide-react";
import { RaceCountdown } from "../components/race/motion";
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
  const latestNews = news.slice(0, 4);
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
            <div className="udk-home-copy">
              <span>Campeonato UDK 2026</span>
              <h1>Ultras<br />do Kart</h1>
              <p>Pista • evolução • respeito • disputa limpa.</p>
              <div className="udk-home-actions">
                <Link href="/calendario" className="udk-btn udk-btn-primary">
                  Próxima etapa
                </Link>
                <Link href="/calendario" className="udk-btn udk-btn-outline">
                  Ver calendário <CalendarDays aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="udk-next-strip" aria-label="Próxima etapa">
          <div className="race-container udk-next-strip-inner">
            <div className="udk-next-meta">
              <span>Próxima etapa</span>
              <strong>{nextStage?.date ?? "A definir"}</strong>
            </div>
            <div className="udk-next-location">
              <span>Kartódromo</span>
              <strong>{nextStage?.city ?? "Betim / MG"}</strong>
            </div>
            <Link href="/calendario" className="udk-small-link">
              Saiba mais <ChevronRight aria-hidden="true" />
            </Link>
            <div className="udk-countdown-wrap">
              <span>Contagem regressiva</span>
              {nextStage?.startsAt ? (
                <RaceCountdown target={nextStage.startsAt} />
              ) : (
                <div className="udk-countdown-placeholder">—</div>
              )}
            </div>
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

        <section className="race-container udk-home-news">
          <div className="udk-section-title">
            <h2>Últimas notícias</h2>
            <Link href="/noticias">Ver todas <ChevronRight aria-hidden="true" /></Link>
          </div>
          <div className="udk-news-grid">
            {latestNews.map((item) => (
              <Link href={`/noticias/${item.slug}`} className="udk-news-card" key={item.slug}>
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
            ))}
          </div>
        </section>

        <section className="udk-sponsor-strip">
          <div className="race-container udk-sponsor-strip-inner">
            <span>Patrocinadores oficiais</span>
            {sponsors.map((sponsor) => (
              <strong key={sponsor.slug}>{sponsor.name}</strong>
            ))}
          </div>
        </section>
      </main>
    </RaceShell>
  );
}
