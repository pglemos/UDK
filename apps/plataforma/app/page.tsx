import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowRight,
  CalendarDays,
  ChevronRight,
  Flag,
  MapPin,
  Timer,
  Trophy,
  Users,
} from "lucide-react";
import { DriverPoster, EditorialEmpty, EditorialHeading, StageProject } from "../components/race/editorial-primitives";
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
  const topDrivers = [...drivers]
    .sort((a, b) => b.points - a.points || (a.position ?? 999) - (b.position ?? 999))
    .slice(0, 5);
  const stagePreview = stages.slice(0, 5);
  const driverPreview = [...drivers].sort((a, b) => b.points - a.points).slice(0, 5);
  const featuredNews = news[0] ?? null;
  const secondaryNews = news.slice(1, 3);
  const categories = new Set(drivers.map((driver) => driver.category)).size;

  return (
    <RaceShell>
      <main id="conteudo" className="tg-home">
        <section className="tg-home-hero" data-design="twice-grind-hero">
          <div className="tg-home-hero-media" aria-hidden="true">
            <img src="/media/udk-race-hero.webp" alt="" fetchPriority="high" />
          </div>
          <div className="tg-home-hero-shade" aria-hidden="true" />
          <div className="race-container tg-home-hero-grid">
            <div className="tg-home-hero-copy">
              <span className="tg-hero-season">Temporada 2026 • Betim, MG</span>
              <h1>
                A pista
                <em>não espera.</em>
              </h1>
              <p>
                Competição, evolução e respeito em um campeonato feito por quem vive cada volta além do cronômetro.
              </p>
              <div className="tg-hero-actions">
                <Link href="/inscricao" className="race-button race-button-primary">
                  Entrar no grid <ArrowRight aria-hidden="true" />
                </Link>
                <Link href="/calendario" className="race-button race-button-ghost">
                  Ver temporada <CalendarDays aria-hidden="true" />
                </Link>
              </div>
            </div>

            <aside className="tg-next-stage">
              <div className="tg-next-stage-head">
                <span>Próxima etapa</span>
                <b>{nextStage?.status === "registration" ? "Inscrições abertas" : "Temporada 2026"}</b>
              </div>
              <time>{nextStage?.date ?? "Data a definir"}</time>
              <h2>{nextStage?.title ?? "Calendário oficial"}</h2>
              <p>{nextStage?.track ?? "Traçado oficial"}</p>
              <div className="tg-next-stage-location">
                <MapPin aria-hidden="true" />
                <span>{nextStage?.location ?? "Kartódromo Internacional de Betim"}<b>{nextStage?.city ?? "Betim/MG"}</b></span>
              </div>
              <div className="tg-next-stage-countdown">
                <span>Até a largada</span>
                {nextStage?.startsAt ? <RaceCountdown target={nextStage.startsAt} /> : <b>Em breve</b>}
              </div>
              <Link href="/calendario" className="tg-arrow-link">
                Detalhes da etapa <ArrowRight aria-hidden="true" />
              </Link>
            </aside>
          </div>

          <div className="tg-home-hero-foot race-container">
            <span>Role para sentir o ritmo</span>
            <ArrowDownRight aria-hidden="true" />
            <b>UDK / 2026</b>
          </div>
        </section>

        <section className="tg-motion-strip" aria-label="Identidade do campeonato">
          <div>
            <span>Ultras do Kart</span><i />
            <span>Performance em pista</span><i />
            <span>Temporada 2026</span><i />
            <span>Kartódromo de Betim</span><i />
            <span>Ultras do Kart</span><i />
          </div>
        </section>

        <section className="tg-manifesto">
          <div className="race-container tg-manifesto-grid">
            <Reveal className="tg-manifesto-copy">
              <span>01 / Manifesto</span>
              <h2>O cronômetro mede a volta. A pista revela o piloto.</h2>
              <p>
                O UDK nasceu para transformar competição em evolução coletiva. Aqui, desempenho importa, mas respeito, constância e coragem para voltar melhor importam tanto quanto.
              </p>
              <Link href="/inscricao" className="tg-arrow-link is-dark">
                Conhecer o campeonato <ArrowRight aria-hidden="true" />
              </Link>
            </Reveal>
            <div className="tg-manifesto-media">
              <img src="/media/udk-race-hero.webp" alt="Kart em ação durante uma etapa do campeonato" loading="lazy" />
              <strong>33</strong>
              <span>Feitos para deixar marca.</span>
            </div>
          </div>
        </section>

        <section className="tg-season-section">
          <div className="race-container">
            <EditorialHeading
              index="02"
              title="Uma temporada contada como grandes capítulos."
              description="Cada etapa tem ritmo, traçado e tensão próprios. O calendário deixa de ser uma lista e passa a mostrar a jornada inteira."
              action={{ href: "/calendario", label: "Calendário completo" }}
              inverse
            />

            {nextStage ? <StageProject stage={nextStage} index={0} featured /> : null}

            <div className="tg-stage-rail" aria-label="Etapas da temporada">
              {stagePreview.slice(1).map((stage, index) => (
                <Reveal key={stage.id} delay={index * 55}>
                  <StageProject stage={stage} index={index + 1} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="tg-proof-strip">
          <div className="race-container">
            <article><Flag aria-hidden="true" /><strong>{String(stages.length).padStart(2, "0")}</strong><span>etapas oficiais</span></article>
            <article><Users aria-hidden="true" /><strong>{String(drivers.length).padStart(2, "0")}</strong><span>pilotos publicados</span></article>
            <article><Trophy aria-hidden="true" /><strong>{String(categories).padStart(2, "0")}</strong><span>categorias</span></article>
            <article><Timer aria-hidden="true" /><strong>2026</strong><span>temporada atual</span></article>
          </div>
        </section>

        <section className="tg-ranking-section">
          <div className="race-container">
            <EditorialHeading
              index="03"
              title="A pista fala. A classificação registra."
              description="Pontos reais, desempenho acumulado e nenhuma estatística inventada para preencher espaço."
              action={{ href: "/classificacao", label: "Ver classificação" }}
            />

            <div className="tg-ranking-layout">
              <div className="tg-ranking-podium" aria-label="Três primeiros colocados">
                {topDrivers.slice(0, 3).map((driver, index) => (
                  <Link href={`/pilotos/${driver.slug}`} className={`tg-podium-card place-${index + 1}`} key={driver.slug}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <div className="tg-podium-number">#{driver.number}</div>
                    <h3>{driver.name}</h3>
                    <p>{driver.category}</p>
                    <strong>{driver.points}<small>pts</small></strong>
                  </Link>
                ))}
              </div>

              <div className="tg-ranking-list">
                {topDrivers.map((driver, index) => (
                  <Link href={`/pilotos/${driver.slug}`} key={driver.slug}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <b>#{driver.number}</b>
                    <div><strong>{driver.name}</strong><small>{driver.category}</small></div>
                    <em>{driver.points} pts</em>
                    <ChevronRight aria-hidden="true" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="tg-drivers-section">
          <div className="race-container">
            <EditorialHeading
              index="04"
              title="Pessoas antes dos números. Pilotos quando a luz apaga."
              description="Conheça quem constrói o grid, volta após volta."
              action={{ href: "/pilotos", label: "Todos os pilotos" }}
              inverse
            />
            <div className="tg-driver-mosaic">
              {driverPreview.map((driver, index) => <DriverPoster driver={driver} index={index} key={driver.slug} />)}
            </div>
          </div>
        </section>

        <section className="tg-community-section">
          <div className="tg-community-media" aria-hidden="true">
            <img src="/media/udk-race-hero.webp" alt="" loading="lazy" />
          </div>
          <div className="race-container tg-community-copy">
            <span>05 / Cultura Ultras</span>
            <h2>Competir sozinho é possível. Evoluir junto é outra história.</h2>
            <p>
              O UDK conecta pilotos que entendem que rivalidade e respeito podem dividir o mesmo grid. A comunidade existe no box, na preparação, no pós-corrida e em cada conselho que reduz décimos.
            </p>
            <div className="tg-community-values">
              <span>Respeito</span><span>Constância</span><span>Disputa limpa</span><span>Evolução</span>
            </div>
          </div>
        </section>

        <section className="tg-news-section">
          <div className="race-container">
            <EditorialHeading
              index="06"
              title="Do paddock para quem acompanha cada volta."
              description="Comunicados, bastidores e decisões oficiais do campeonato."
              action={{ href: "/noticias", label: "Todas as notícias" }}
            />

            {featuredNews ? (
              <div className="tg-news-layout">
                <Link href={`/noticias/${featuredNews.slug}`} className="tg-news-feature">
                  <img src={featuredNews.coverImageUrl ?? "/media/udk-race-hero.webp"} alt="" loading="lazy" />
                  <div>
                    <span>{featuredNews.category}</span>
                    <h3>{featuredNews.title}</h3>
                    <p>{featuredNews.summary}</p>
                    <time>{new Date(featuredNews.publishedAt).toLocaleDateString("pt-BR")}</time>
                  </div>
                </Link>
                <div className="tg-news-secondary">
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

        <section className="tg-sponsors-section">
          <div className="race-container">
            <span>Marcas que aceleram com o UDK</span>
            {sponsors.length ? (
              <div>{sponsors.map((sponsor) => <strong key={sponsor.slug}>{sponsor.name}</strong>)}</div>
            ) : (
              <p>As parcerias oficiais serão exibidas assim que forem publicadas pela organização.</p>
            )}
          </div>
        </section>

        <section className="tg-home-final-cta">
          <div className="race-container">
            <span>07 / Próxima largada</span>
            <h2>O grid não precisa continuar sem o seu nome.</h2>
            <p>Crie sua conta, escolha a categoria e acompanhe cada etapa pela plataforma oficial.</p>
            <Link href="/inscricao" className="race-button race-button-primary">
              Começar inscrição <ArrowRight aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>
    </RaceShell>
  );
}
