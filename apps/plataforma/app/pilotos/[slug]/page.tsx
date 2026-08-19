import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Flag, MapPin, Trophy } from "lucide-react";
import { EditorialEmpty, EditorialHeading } from "../../../components/race/editorial-primitives";
import { Reveal } from "../../../components/race/motion";
import { RaceShell } from "../../../components/race/race-shell";
import {
  formatLapTime,
  getDriverBySlug,
  getDriverHistory,
  getDriverLaps,
  type PublicLap,
} from "../../../lib/public-data";
import { driverVisual, premiumVisuals, resolveVisualSource } from "../../../lib/visual-assets";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const driver = await getDriverBySlug(slug);
  // O notFound() precisa acontecer aqui: com loading.tsx na raiz a resposta já
  // começa a ser transmitida antes do corpo da página, e o 200 sairia junto.
  if (!driver) notFound();
  const coverSource = resolveVisualSource(
    driver.heroImageUrl ?? driver.avatarUrl,
    premiumVisuals.manifesto,
  );
  return {
    title: driver.name,
    description: `Perfil esportivo de ${driver.name} na temporada UDK 2026.`,
    alternates: { canonical: `/pilotos/${driver.slug}` },
    openGraph: {
      title: `${driver.name} • UDK`,
      description: `${driver.points} pontos, ${driver.wins} vitórias e ${driver.podiums} pódios na temporada.`,
      images: [coverSource],
    },
  };
}

const speedFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatSpeed(speedKph: number | null): string {
  return speedKph == null ? "—" : `${speedFormatter.format(speedKph)} km/h`;
}

export default async function DriverProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [driver, history, laps] = await Promise.all([
    getDriverBySlug(slug),
    getDriverHistory(slug),
    getDriverLaps(slug),
  ]);
  if (!driver) notFound();

  const lapsByEntry = new Map<string, PublicLap[]>();
  for (const lap of laps) {
    const entryLaps = lapsByEntry.get(lap.resultEntryId) ?? [];
    entryLaps.push(lap);
    lapsByEntry.set(lap.resultEntryId, entryLaps);
  }
  const lapSessions = history
    .map((entry) => ({ entry, laps: lapsByEntry.get(entry.id) ?? [] }))
    .filter((session) => session.laps.length > 0);

  const portraitFallback = driverVisual(driver.position ?? 0);
  const heroSource = resolveVisualSource(
    driver.heroImageUrl ?? driver.avatarUrl,
    premiumVisuals.manifesto,
  );
  const portraitSource = resolveVisualSource(driver.avatarUrl, portraitFallback);
  const hasPublishedHero =
    Boolean(driver.heroImageUrl || driver.avatarUrl) && heroSource !== premiumVisuals.manifesto.src;
  const hasPublishedPortrait = Boolean(driver.avatarUrl) && portraitSource !== portraitFallback.src;

  return (
    <RaceShell>
      <main id="conteudo" className="tg-driver-profile">
        <section className="tg-driver-profile-hero">
          <div className="tg-driver-profile-media" aria-hidden="true">
            <Image
              src={heroSource}
              alt=""
              fill
              priority
              quality={90}
              sizes="100vw"
              style={{
                objectPosition: hasPublishedHero ? "50% center" : premiumVisuals.manifesto.position,
              }}
            />
          </div>
          <div className="race-container tg-driver-profile-hero-inner">
            <Link className="tg-arrow-link" href="/pilotos">
              <ArrowLeft aria-hidden="true" /> Voltar ao grid
            </Link>
            <div className="tg-driver-profile-copy">
              <span>{driver.category}</span>
              <h1>{driver.name}</h1>
              <p>{[driver.teamName, driver.city].filter(Boolean).join(" • ")}</p>
              <div className="tg-hero-actions">
                <Link className="race-button race-button-primary" href="/classificacao">
                  Ver classificação <ArrowRight aria-hidden="true" />
                </Link>
                <Link className="race-button race-button-ghost" href="/resultados">
                  Resultados
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="tg-driver-profile-stats">
          <div className="race-container">
            <article>
              <span>Posição</span>
              <strong>{driver.position ? `P${driver.position}` : "—"}</strong>
            </article>
            <article>
              <span>Pontos</span>
              <strong>{driver.points}</strong>
            </article>
            <article>
              <span>Vitórias</span>
              <strong>{driver.wins}</strong>
            </article>
            <article>
              <span>Pódios</span>
              <strong>{driver.podiums}</strong>
            </article>
            <article>
              <span>Largadas na pole</span>
              <strong>{driver.poles}</strong>
            </article>
          </div>
        </section>

        <section className="tg-profile-story">
          <div className="race-container tg-profile-story-grid">
            <Reveal className="tg-profile-bio">
              <span>01 / Perfil</span>
              <h2>Quem está por trás do capacete.</h2>
              <p>
                {driver.bio ??
                  `${driver.name} compete na categoria ${driver.category}. A trajetória, equipe e objetivos serão publicados quando autorizados pelo piloto.`}
              </p>
              <div>
                <span>
                  <Trophy aria-hidden="true" /> {driver.category}
                </span>
                <span>
                  <MapPin aria-hidden="true" /> {driver.city ?? "Cidade não publicada"}
                </span>
              </div>
            </Reveal>
            <div className={`tg-profile-portrait${hasPublishedPortrait ? "" : " is-fallback"}`}>
              <Image
                src={portraitSource}
                alt={hasPublishedPortrait ? `Retrato de ${driver.name}` : portraitFallback.alt}
                fill
                quality={88}
                sizes="(max-width: 760px) 100vw, 42vw"
                style={{
                  objectPosition: hasPublishedPortrait ? "50% center" : portraitFallback.position,
                }}
              />
            </div>
          </div>
        </section>

        <section className="tg-profile-history">
          <div className="race-container">
            <EditorialHeading
              index="02"
              title="Sessão por sessão, a evolução ganha forma."
              description="Histórico esportivo publicado pela organização."
              inverse
            />
            {history.length ? (
              <div className="tg-history-list">
                {history.map((entry, index) => (
                  <Reveal key={entry.id} delay={index * 45}>
                    <article>
                      <span>P{entry.position}</span>
                      <div>
                        <h3>{entry.stageTitle || "Sessão oficial"}</h3>
                        <p>
                          Kart {entry.kartNumber ?? "—"} • {entry.laps} voltas • melhor volta{" "}
                          {formatLapTime(entry.bestLapMs)}
                        </p>
                      </div>
                      <strong>{entry.points} pts</strong>
                    </article>
                  </Reveal>
                ))}
              </div>
            ) : (
              <EditorialEmpty
                index="02"
                title="Nenhuma sessão individual publicada."
                description="O histórico aparecerá quando os resultados oficiais forem disponibilizados."
              />
            )}

            <section id="volta-a-volta" className="tg-profile-laps">
              <EditorialHeading
                index="03"
                title="Volta a volta, sem perder nenhum detalhe."
                description="Tempos, velocidade e tempo acumulado conforme o relatório oficial do sistema de cronometragem."
                inverse
              />
              {lapSessions.length ? (
                <div className="tg-lap-sessions">
                  {lapSessions.map(({ entry, laps: sessionLaps }) => (
                    <article className="tg-lap-session" key={entry.id}>
                      <header className="tg-lap-session-header">
                        <div>
                          <span>{entry.stageTitle || "Sessão oficial"}</span>
                          <h3>{sessionLaps.length} voltas registradas</h3>
                        </div>
                        <p>Melhor volta {formatLapTime(entry.bestLapMs)}</p>
                      </header>
                      <div className="tg-laps-table-wrap">
                        <table className="udk-data-table tg-laps-table">
                          <caption className="sr-only">
                            Volta a volta de {driver.name} em {entry.stageTitle || "sessão oficial"}
                          </caption>
                          <thead>
                            <tr>
                              <th scope="col">Volta</th>
                              <th scope="col">Tempo da volta</th>
                              <th scope="col">Tempo acumulado</th>
                              <th scope="col">Velocidade</th>
                              <th scope="col">Situação</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sessionLaps.map((lap) => (
                              <tr key={lap.id}>
                                <td data-label="Volta">{lap.lapNumber}</td>
                                <td data-label="Tempo da volta">{formatLapTime(lap.lapTimeMs)}</td>
                                <td data-label="Tempo acumulado">
                                  {formatLapTime(lap.elapsedTimeMs)}
                                </td>
                                <td data-label="Velocidade">{formatSpeed(lap.speedKph)}</td>
                                <td data-label="Situação">
                                  <span className={lap.valid ? "" : "is-invalid"}>
                                    {lap.valid ? "Registrada" : (lap.invalidReason ?? "Não válida")}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <EditorialEmpty
                  index="03"
                  title="Volta a volta ainda não publicada."
                  description="Os detalhes individuais aparecerão aqui quando o relatório oficial for importado."
                />
              )}
            </section>
          </div>
        </section>

        <section className="tg-inline-cta">
          <div className="race-container">
            <Flag aria-hidden="true" />
            <div>
              <span>Próxima disputa</span>
              <h2>A temporada continua.</h2>
            </div>
            <Link href="/calendario" className="race-button race-button-primary">
              Ver calendário <ArrowRight aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>
    </RaceShell>
  );
}
