import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Flag } from "lucide-react";
import { Reveal } from "../../../components/race/motion";
import { RaceShell } from "../../../components/race/race-shell";
import { DriverVisual, EmptyState } from "../../../components/race/ui";
import {
  formatLapTime,
  getDriverBySlug,
  getDriverHistory,
} from "../../../lib/public-data";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const driver = await getDriverBySlug(slug);

  if (!driver) return { title: "Piloto não encontrado" };

  return {
    title: driver.name,
    description: `Perfil esportivo de ${driver.name}, #${driver.number}, na temporada UDK 2026.`,
    alternates: { canonical: `/pilotos/${driver.slug}` },
    openGraph: {
      title: `${driver.name} • UDK`,
      description: `${driver.points} pontos, ${driver.wins} vitórias e ${driver.podiums} pódios na temporada.`,
      images: driver.heroImageUrl || driver.avatarUrl ? [driver.heroImageUrl ?? driver.avatarUrl ?? ""] : [],
    },
  };
}

export default async function DriverProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [driver, history] = await Promise.all([
    getDriverBySlug(slug),
    getDriverHistory(slug),
  ]);

  if (!driver) notFound();

  const pointsScale = Math.min(100, Math.max(8, driver.points));
  const winsScale = Math.min(100, driver.wins * 18);
  const podiumScale = Math.min(100, driver.podiums * 13);
  const polesScale = Math.min(100, driver.poles * 18);

  return (
    <RaceShell>
      <main id="conteudo">
        <section className="race-profile-hero">
          <div className="race-container">
            <Link className="race-text-link" href="/pilotos">
              <ArrowLeft aria-hidden="true" /> Voltar ao grid
            </Link>
            <div className="race-profile-layout">
              <div className="race-profile-copy">
                <span className="race-kicker">{driver.category}</span>
                <h1>{driver.name}</h1>
                <p>
                  #{driver.number}
                  {driver.teamName ? ` • ${driver.teamName}` : ""}
                  {driver.city ? ` • ${driver.city}` : ""}
                </p>
                <div className="race-hero-actions">
                  <Link className="race-button race-button-primary" href="/classificacao">
                    Ver classificação <ArrowRight aria-hidden="true" />
                  </Link>
                  <Link className="race-button race-button-ghost" href="/resultados">
                    Últimos resultados
                  </Link>
                </div>
              </div>
              <div>
                <span className="race-profile-number">#{driver.number}</span>
                <DriverVisual driver={driver} large />
              </div>
            </div>
          </div>
        </section>

        <div className="race-container">
          <div className="race-profile-stats">
            <div className="race-profile-stat">
              <strong>{driver.position ? `P${driver.position}` : "—"}</strong>
              <span>Posição geral</span>
            </div>
            <div className="race-profile-stat">
              <strong>{driver.points}</strong>
              <span>Pontos</span>
            </div>
            <div className="race-profile-stat">
              <strong>{driver.wins}</strong>
              <span>Vitórias</span>
            </div>
            <div className="race-profile-stat">
              <strong>{driver.podiums}</strong>
              <span>Pódios</span>
            </div>
          </div>
        </div>

        <section className="race-section">
          <div className="race-container">
            <div className="race-grid">
              <Reveal>
                <article className="race-result-overview">
                  <span className="race-kicker">Perfil esportivo</span>
                  <h2>Sobre o piloto</h2>
                  <p>
                    {driver.bio ??
                      `${driver.name} compete com o número ${driver.number} na categoria ${driver.category}. O perfil será atualizado com trajetória, equipe e objetivos autorizados pelo piloto.`}
                  </p>
                </article>
              </Reveal>

              <Reveal delay={70}>
                <article className="race-result-overview">
                  <span className="race-kicker">Performance</span>
                  <h2>Indicadores</h2>
                  <div className="race-performance">
                    {[
                      ["Pontos", pointsScale, driver.points],
                      ["Vitórias", winsScale, driver.wins],
                      ["Pódios", podiumScale, driver.podiums],
                      ["Poles", polesScale, driver.poles],
                    ].map(([label, scale, value]) => (
                      <div className="race-performance-row" key={String(label)}>
                        <span>{label}</span>
                        <div className="race-performance-bar">
                          <i style={{ width: `${scale}%` }} />
                        </div>
                        <b>{value}</b>
                      </div>
                    ))}
                  </div>
                </article>
              </Reveal>

              <Reveal delay={140}>
                <article className="race-result-overview">
                  <span className="race-kicker">Temporada 2026</span>
                  <h2>Identidade</h2>
                  <div className="race-summary-list">
                    <div><span>Número</span><b>#{driver.number}</b></div>
                    <div><span>Categoria</span><b>{driver.category}</b></div>
                    <div><span>Equipe</span><b>{driver.teamName ?? "Individual"}</b></div>
                    <div><span>Cidade</span><b>{driver.city ?? "Não publicada"}</b></div>
                  </div>
                </article>
              </Reveal>
            </div>
          </div>
        </section>

        <section className="race-section is-panel">
          <div className="race-container">
            <div className="race-section-heading">
              <div>
                <span className="race-kicker">Histórico</span>
                <h2>Últimas sessões</h2>
              </div>
            </div>

            {history.length ? (
              <div className="race-timeline">
                {history.map((entry, index) => (
                  <Reveal key={entry.id} delay={index * 45}>
                    <article className="race-timeline-item">
                      <strong className="race-timeline-date">P{entry.position}</strong>
                      <div className="race-timeline-copy">
                        <h3>{entry.stageTitle || "Sessão oficial"}</h3>
                        <p>
                          Kart {entry.kartNumber ?? "—"} • {entry.laps} voltas • melhor volta {formatLapTime(entry.bestLapMs)}
                        </p>
                      </div>
                      <span className="race-points">{entry.points} pts</span>
                    </article>
                  </Reveal>
                ))}
              </div>
            ) : (
              <EmptyState
                eyebrow="Histórico esportivo"
                title="Nenhuma sessão publicada"
                description="O histórico aparecerá quando resultados individuais forem disponibilizados."
              />
            )}
          </div>
        </section>

        <section className="race-section">
          <div className="race-container">
            <div className="race-cta">
              <Flag aria-hidden="true" />
              <span className="race-kicker">Próxima disputa</span>
              <h2>A temporada continua.</h2>
              <p>Veja quando este piloto volta ao grid e acompanhe a evolução da classificação.</p>
              <div className="race-hero-actions">
                <Link className="race-button race-button-primary" href="/calendario">
                  Ver calendário
                </Link>
                <Link className="race-button race-button-ghost" href="/pilotos">
                  Conhecer outros pilotos
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </RaceShell>
  );
}
