import type { Metadata } from "next";
import Link from "next/link";
import { Flag, Timer, Trophy, Users } from "lucide-react";
import { PublicLayout } from "../components/public-layout";
import { getPublicData } from "../lib/public-data";

export const metadata: Metadata = {
  title: "UDK • Ultras do Kart",
  description: "Portal oficial do campeonato Ultras do Kart, com calendário, resultados e classificação.",
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const { drivers, stages } = await getPublicData();
  const nextStage = stages[0] ?? {
    date: "A definir",
    title: "Próxima etapa",
    track: "Kartódromo Internacional de Betim",
    time: "Em breve",
  };

  return (
    <PublicLayout>
      <main>
        <section className="public-hero">
          <div className="public-hero-copy">
            <span className="public-eyebrow">Temporada 2026</span>
            <h1>Velocidade.<br /><b>Estratégia.</b><br />Legado.</h1>
            <p>
              O campeonato que reúne pilotos intensos de Betim em provas regulares e Endurance,
              com operação oficial, resultados versionados e classificação pública.
            </p>
            <div className="public-actions">
              <Link href="/inscricao" className="public-button">Entrar no grid</Link>
              <Link href="/classificacao" className="public-button public-button-ghost">Ver classificação</Link>
            </div>
          </div>
          <div className="public-hero-panel">
            <Timer aria-hidden="true" />
            <small>Próxima largada</small>
            <strong>{nextStage.date}</strong>
            <p>{nextStage.title} • {nextStage.time}</p>
            <span>{nextStage.track}</span>
          </div>
        </section>

        <section className="public-stats" aria-label="Números da temporada">
          <div><Users /><b>60</b><span>pilotos</span></div>
          <div><Flag /><b>08</b><span>corridas</span></div>
          <div><Trophy /><b>02</b><span>categorias</span></div>
          <div><Timer /><b>02</b><span>endurances</span></div>
        </section>

        <section className="public-section">
          <div className="public-heading">
            <span>Classificação</span>
            <h2>Os líderes do grid</h2>
          </div>
          <div className="public-podium">
            {drivers.slice(0, 3).map((driver, index) => (
              <Link href={`/pilotos/${driver.slug}`} className="public-driver" key={driver.slug}>
                <span className="public-place">0{index + 1}</span>
                <div className="public-number">#{driver.number}</div>
                <h3>{driver.name}</h3>
                <p>{driver.category}</p>
                <strong>{driver.points} pts</strong>
              </Link>
            ))}
          </div>
        </section>

        <section className="public-section public-dark">
          <div className="public-heading">
            <span>Calendário</span>
            <h2>Próximas etapas</h2>
          </div>
          <div className="public-schedule">
            {stages.map((stage) => (
              <article key={`${stage.date}-${stage.title}`}>
                <b>{stage.date}</b>
                <div><h3>{stage.title}</h3><p>{stage.track}</p></div>
                <strong>{stage.time}</strong>
              </article>
            ))}
          </div>
        </section>
      </main>
    </PublicLayout>
  );
}
