import type { Metadata } from "next";
import Link from "next/link";
import { Download, Gauge, Medal } from "lucide-react";
import { Reveal } from "../../components/race/motion";
import { RaceShell } from "../../components/race/race-shell";
import {
  EmptyState,
  PageHero,
  RacePagination,
  StatusBadge,
} from "../../components/race/ui";
import {
  formatGap,
  formatLapTime,
  getCategories,
  getResultEntries,
  getResultsPage,
  parsePositiveInt,
} from "../../lib/public-data";

export const metadata: Metadata = {
  title: "Resultados",
  description: "Resultados oficiais, versões, melhor volta e classificação de cada sessão UDK.",
  alternates: { canonical: "/resultados" },
};

function param(value: string | string[] | undefined, fallback = ""): string {
  return Array.isArray(value) ? value[0] ?? fallback : value ?? fallback;
}

export default async function ResultsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const page = parsePositiveInt(params.page, 1, 500);
  const category = param(params.categoria, "geral");
  const status = param(params.status, "todos");
  const selectedId = param(params.resultado);

  const [results, categories] = await Promise.all([
    getResultsPage({ page, pageSize: 8, category, status }),
    getCategories(),
  ]);

  const selected = results.items.find((item) => item.id === selectedId) ?? results.items[0] ?? null;
  const entries = selected ? await getResultEntries(selected.id) : [];
  const leaderTime = entries[0]?.totalTimeMs ?? null;

  return (
    <RaceShell>
      <main id="conteudo">
        <PageHero
          eyebrow="Cronometragem oficial"
          title="Resultados"
          description="Resultado provisório, homologado ou retificado com versão, melhor volta e leitura completa da sessão."
        />

        <section className="race-section is-tight">
          <div className="race-container">
            <form className="race-filter-bar" action="/resultados">
              <select name="resultado" defaultValue={selected?.id ?? ""} aria-label="Etapa ou resultado">
                <option value="">Resultado mais recente</option>
                {results.items.map((result) => (
                  <option value={result.id} key={result.id}>
                    {result.stageTitle} • {result.category}
                  </option>
                ))}
              </select>
              <select name="categoria" defaultValue={category} aria-label="Categoria">
                <option value="geral">Todas as categorias</option>
                {categories.map((item) => (
                  <option value={item.slug} key={item.slug}>{item.name}</option>
                ))}
              </select>
              <select name="status" defaultValue={status} aria-label="Status">
                <option value="todos">Todos os status</option>
                <option value="provisional">Provisórios</option>
                <option value="homologated">Homologados</option>
                <option value="published">Publicados</option>
                <option value="rectified">Retificados</option>
              </select>
              <select name="temporada" defaultValue="2026" aria-label="Temporada">
                <option value="2026">Temporada 2026</option>
              </select>
              <button className="race-button race-button-primary" type="submit">Aplicar</button>
            </form>
          </div>
        </section>

        <section className="race-section is-tight">
          <div className="race-container">
            {selected ? (
              <>
                <div className="race-results-feature">
                  <Reveal>
                    <article className="race-result-overview">
                      <div className="race-result-card-meta">
                        <StatusBadge status={selected.status} />
                        <span>Versão {selected.version}</span>
                        {selected.publishedAt ? (
                          <span>{new Date(selected.publishedAt).toLocaleDateString("pt-BR")}</span>
                        ) : null}
                      </div>
                      <span className="race-kicker">{selected.category}</span>
                      <h2>{selected.stageTitle}</h2>
                      <p>{selected.title || "Sessão oficial"} • {selected.track}</p>
                      <div className="race-fastest-lap">
                        <span><Gauge aria-hidden="true" /> Melhor volta</span>
                        <strong>{formatLapTime(selected.fastestLapMs)}</strong>
                      </div>
                    </article>
                  </Reveal>

                  <Reveal delay={90}>
                    {entries.length ? (
                      <div className="race-results-podium" aria-label="Pódio da sessão">
                        {entries.slice(0, 3).map((entry) => (
                          <article key={entry.id}>
                            <span className={`race-position is-p${entry.position}`}>
                              P{entry.position}
                            </span>
                            <h3>#{entry.driverNumber} {entry.driverName}</h3>
                            <p>{formatLapTime(entry.bestLapMs)}</p>
                            <b>{entry.points} pts</b>
                          </article>
                        ))}
                      </div>
                    ) : (
                      <div className="race-results-podium">
                        <article><span className="race-position is-p1">P1</span><p>Aguardando classificação</p></article>
                        <article><span className="race-position is-p2">P2</span><p>Aguardando classificação</p></article>
                        <article><span className="race-position is-p3">P3</span><p>Aguardando classificação</p></article>
                      </div>
                    )}
                  </Reveal>
                </div>

                {entries.length ? (
                  <Reveal>
                    <div className="race-table-wrap">
                      <table className="race-table">
                        <caption>
                          Resultado da sessão {selected.title || selected.stageTitle}, versão {selected.version}.
                        </caption>
                        <thead>
                          <tr>
                            <th>Pos.</th>
                            <th>Piloto</th>
                            <th>Kart</th>
                            <th>Voltas</th>
                            <th>Tempo total</th>
                            <th>Diferença</th>
                            <th>Melhor volta</th>
                            <th>Penalidade</th>
                            <th>Pontos</th>
                          </tr>
                        </thead>
                        <tbody>
                          {entries.map((entry) => {
                            const gap =
                              leaderTime != null && entry.totalTimeMs != null
                                ? entry.totalTimeMs - leaderTime
                                : null;
                            return (
                              <tr key={entry.id}>
                                <td className={`race-position${entry.position <= 3 ? ` is-p${entry.position}` : ""}`}>
                                  {String(entry.position).padStart(2, "0")}
                                </td>
                                <td>
                                  <Link href={`/pilotos/${entry.driverSlug}`}>
                                    <b>#{entry.driverNumber} {entry.driverName}</b>
                                  </Link>
                                </td>
                                <td>{entry.kartNumber ?? "—"}</td>
                                <td>{entry.laps}</td>
                                <td>{formatLapTime(entry.totalTimeMs)}</td>
                                <td>{formatGap(gap)}</td>
                                <td>{formatLapTime(entry.bestLapMs)}{entry.fastestLap ? " • MV" : ""}</td>
                                <td>{entry.penaltyMs ? `+${entry.penaltyMs / 1000}s` : "—"}</td>
                                <td className="race-points">{entry.points}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </Reveal>
                ) : (
                  <EmptyState
                    eyebrow="Resultado publicado"
                    title="Detalhamento ainda indisponível"
                    description="A versão pública existe, mas a organização ainda não publicou as posições individuais desta sessão."
                  />
                )}

                <div className="race-hero-actions">
                  <Link className="race-button race-button-secondary" href="/regulamento">
                    <Medal aria-hidden="true" /> Critérios de pontuação
                  </Link>
                  <span className="race-button race-button-ghost" aria-disabled="true">
                    <Download aria-hidden="true" /> PDF quando disponível
                  </span>
                </div>
              </>
            ) : (
              <EmptyState
                title="Nenhum resultado publicado"
                description="Resultados provisórios e homologados aparecerão aqui depois da publicação oficial da organização."
                action={{ href: "/calendario", label: "Ver próximas etapas" }}
              />
            )}

            <RacePagination
              meta={results.meta}
              basePath="/resultados"
              params={{
                categoria: category,
                status,
                resultado: selected?.id,
                page: String(page),
              }}
            />
          </div>
        </section>

        <section className="race-section is-panel">
          <div className="race-container">
            <div className="race-cta">
              <span className="race-kicker">Transparência esportiva</span>
              <h2>Cada versão fica identificada.</h2>
              <p>
                Resultados provisórios, homologados e retificados não são misturados. Status e versão
                permanecem visíveis para que o piloto saiba exatamente o que está consultando.
              </p>
              <Link className="race-button race-button-primary" href="/regulamento">
                Ler procedimento oficial
              </Link>
            </div>
          </div>
        </section>
      </main>
    </RaceShell>
  );
}
