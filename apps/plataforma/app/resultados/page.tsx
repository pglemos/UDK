import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ChevronRight, Download, Flag } from "lucide-react";
import { EditorialEmpty, EditorialHeading } from "../../components/race/editorial-primitives";
import { RaceShell } from "../../components/race/race-shell";
import { localizeRaceText, PageHero, RacePagination, StatusBadge } from "../../components/race/ui";
import {
  formatLapTime,
  getResultEntries,
  getResultsPage,
  parsePositiveInt,
} from "../../lib/public-data";
import type { PublicResultEntry } from "../../lib/public-data";
import { formatShortDateLabel } from "../../lib/datetime";
import { officialResultPdfForCategory } from "../../lib/official-result-links";
import { getSportingBreakdowns, type SportingBreakdown } from "../../lib/sporting-breakdown";

export const metadata: Metadata = {
  title: "Resultados",
  description: "Resultados oficiais da temporada UDK 2026.",
  alternates: { canonical: "/resultados" },
};

function param(value: string | string[] | undefined, fallback = ""): string {
  return Array.isArray(value) ? (value[0] ?? fallback) : (value ?? fallback);
}

function isNotClassified(status: string, position: number): boolean {
  return status.toLowerCase() === "nc" || position >= 999;
}

function resultAdjustments(
  entry: PublicResultEntry,
  sporting: SportingBreakdown | undefined,
): string[] {
  return [
    entry.pole ? "Pole +1" : null,
    entry.fastestLap ? "MV +1" : null,
    sporting?.bestPit ? "Pit +10" : null,
    entry.penaltyMs ? `+${entry.penaltyMs / 1000}s` : null,
    sporting?.penaltyPoints ? `-${sporting.penaltyPoints} pts` : null,
    sporting?.timingAdjustmentLaps ? `+${sporting.timingAdjustmentLaps} volta` : null,
  ].filter((value): value is string => Boolean(value));
}

export default async function ResultsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const page = parsePositiveInt(params.page, 1, 500);
  const category = param(params.categoria, "geral");
  const results = await getResultsPage({ page, pageSize: 6, category });
  const selected = category !== "geral" ? (results.items[0] ?? null) : null;
  const selectedEntries = selected ? await getResultEntries(selected.id) : [];
  const selectedSporting = await getSportingBreakdowns(selectedEntries.map((entry) => entry.id));
  const resultCards =
    category === "geral"
      ? await Promise.all(
          results.items.map(async (result) => ({
            result,
            entries: (await getResultEntries(result.id)).slice(0, 3),
          })),
        )
      : [];
  const selectedPdf = selected ? officialResultPdfForCategory(selected.categorySlug) : null;

  return (
    <RaceShell showMobileCta={false}>
      <main id="conteudo" tabIndex={-1} className="udk-page tg-internal-page">
        <PageHero
          index="03"
          eyebrow="Bandeirada oficial"
          title="Resultados"
          description="A 1ª etapa foi homologada em duas classificações oficiais, uma por categoria."
          compact
        />

        <section className="tg-results-section">
          <div className="race-container">
            <EditorialHeading
              index="03"
              title="Resultado homologado."
              description="Posições e ajustes oficiais da 1ª etapa, separados por categoria."
            />

            <div className="udk-category-tabs tg-category-tabs">
              <Link className={category === "geral" ? "is-active" : ""} href="/resultados">
                Geral
              </Link>
              <Link
                className={category === "rapidos" ? "is-active" : ""}
                href="/resultados?categoria=rapidos"
              >
                Ultras Rápidos
              </Link>
              <Link
                className={category === "insanos" ? "is-active" : ""}
                href="/resultados?categoria=insanos"
              >
                Ultras Insanos
              </Link>
            </div>

            {category === "geral" ? (
              resultCards.length ? (
                <section
                  className="tg-results-collection"
                  aria-label="Resultados oficiais por categoria"
                >
                  {resultCards.map(({ result, entries }) => {
                    const pdfUrl = officialResultPdfForCategory(result.categorySlug);
                    return (
                      <article className="tg-results-card" key={result.id}>
                        <div className="tg-results-card-topline">
                          <span>1ª etapa • Endurance • 18/08/2026</span>
                          <StatusBadge status={result.status} />
                        </div>
                        <h2>{result.category}</h2>
                        <p>
                          {localizeRaceText(result.stageTitle)} — classificação oficial retificada e
                          separada por categoria.
                        </p>
                        <ol>
                          {entries.map((entry) => (
                            <li key={entry.id}>
                              <strong>{entry.position}º</strong>
                              <span>{entry.driverName}</span>
                              <b>{entry.points} pts</b>
                            </li>
                          ))}
                        </ol>
                        <div className="tg-results-card-actions">
                          <Link
                            className="race-button race-button-primary"
                            href={`/resultados?categoria=${result.categorySlug}`}
                          >
                            Abrir resultado <ArrowRight aria-hidden="true" />
                          </Link>
                          {pdfUrl ? (
                            <a
                              className="race-button race-button-outline is-light"
                              href={pdfUrl}
                              download
                            >
                              Baixar PDF <Download aria-hidden="true" />
                            </a>
                          ) : null}
                        </div>
                      </article>
                    );
                  })}
                </section>
              ) : (
                <EditorialEmpty
                  index="03"
                  title="Resultados oficiais ainda não publicados."
                  description="O pódio e os PDFs aparecerão após homologação. Nenhum vencedor, tempo ou posição foi criado apenas para preencher a tela."
                  action={{ href: "/calendario", label: "Ver próximas etapas" }}
                />
              )
            ) : (
              <>
                <div className="tg-result-selector">
                  <div>
                    <span>Resultado da etapa</span>
                    <h2>{selected?.category ?? "Aguardando publicação"}</h2>
                    {selected ? (
                      <p className="tg-result-meta">
                        1ª etapa · {selected.stageTitle} · {formatShortDateLabel(selected.startsAt)}
                      </p>
                    ) : null}
                  </div>
                  <div className="tg-result-selector-actions">
                    {selected ? (
                      <StatusBadge status={selected.status} />
                    ) : (
                      <span className="udk-pending-pill">Pendente</span>
                    )}
                    {selectedPdf ? (
                      <a className="race-button race-button-primary" href={selectedPdf} download>
                        Baixar PDF <Download aria-hidden="true" />
                      </a>
                    ) : null}
                  </div>
                </div>

                {selected && selectedEntries.length >= 3 ? (
                  <div className="tg-results-content">
                    <section
                      className="tg-results-podium"
                      aria-label={`Pódio ${selected.category}`}
                    >
                      {selectedEntries.slice(0, 3).map((entry, index) => (
                        <article className={`place-${index + 1}`} key={entry.id}>
                          <span>{String(index + 1).padStart(2, "0")}</span>
                          <h2>{entry.driverName}</h2>
                          <p>{localizeRaceText(entry.stageTitle)}</p>
                          <strong>{formatLapTime(entry.bestLapMs)}</strong>
                          <small>
                            {isNotClassified(entry.status, entry.position) && entry.points === 0
                              ? "NC"
                              : `${entry.points} pts`}
                          </small>
                        </article>
                      ))}
                    </section>

                    <div className="tg-standing-table-wrap tg-desktop-standing-table-wrap">
                      <table className="udk-data-table tg-standing-table">
                        <caption className="sr-only">Resultado oficial por categoria</caption>
                        <thead>
                          <tr>
                            <th scope="col">Pos.</th>
                            <th scope="col">Piloto</th>
                            <th scope="col">Voltas</th>
                            <th scope="col">Melhor volta</th>
                            <th scope="col">Ajustes</th>
                            <th scope="col">Pontos finais</th>
                            <th scope="col">Detalhes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedEntries.map((entry) => {
                            const notClassified = isNotClassified(entry.status, entry.position);
                            const sporting = selectedSporting.get(entry.id);
                            const adjustments = resultAdjustments(entry, sporting);

                            return (
                              <tr key={entry.id}>
                                <td data-label="Posição">
                                  <span className="udk-rank">
                                    {notClassified ? "NC" : entry.position}
                                  </span>
                                </td>
                                <td data-label="Piloto">
                                  <strong>{entry.driverName}</strong>
                                  {sporting?.sportingNote ? (
                                    <small>{sporting.sportingNote}</small>
                                  ) : null}
                                </td>
                                <td data-label="Voltas">{entry.laps}</td>
                                <td data-label="Melhor volta">{formatLapTime(entry.bestLapMs)}</td>
                                <td data-label="Ajustes">
                                  {adjustments.length ? adjustments.join(" • ") : "—"}
                                </td>
                                <td data-label="Pontos finais">
                                  <strong className="udk-points">
                                    {notClassified && entry.points === 0 ? "—" : entry.points}
                                  </strong>
                                </td>
                                <td data-label="Detalhes">
                                  <Link
                                    className="tg-table-link"
                                    href={`/pilotos/${entry.driverSlug}#volta-a-volta`}
                                    aria-label={`Ver volta a volta de ${entry.driverName}`}
                                  >
                                    Ver volta a volta <ArrowRight aria-hidden="true" />
                                  </Link>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <ol
                      className="tg-mobile-result-list"
                      aria-label={`Resultado resumido ${selected.category}`}
                    >
                      {selectedEntries.map((entry) => {
                        const notClassified = isNotClassified(entry.status, entry.position);
                        const sporting = selectedSporting.get(entry.id);
                        const adjustments = resultAdjustments(entry, sporting);
                        return (
                          <li className="tg-mobile-result-item" key={entry.id}>
                            <div className="tg-mobile-result-summary">
                              <span className="udk-rank">
                                {notClassified ? "NC" : entry.position}
                              </span>
                              <div className="tg-mobile-result-driver">
                                <strong>{entry.driverName}</strong>
                                <span>
                                  {entry.laps} voltas · {formatLapTime(entry.bestLapMs)}
                                </span>
                              </div>
                              <strong className="udk-points">
                                {notClassified && entry.points === 0 ? "—" : entry.points}
                                <small>pts</small>
                              </strong>
                            </div>
                            <details>
                              <summary>Ver detalhes</summary>
                              <dl className="tg-mobile-detail-grid">
                                <div>
                                  <dt>Ajustes</dt>
                                  <dd>
                                    {adjustments.length ? adjustments.join(" · ") : "Sem ajustes"}
                                  </dd>
                                </div>
                                {sporting?.sportingNote ? (
                                  <div className="tg-mobile-detail-wide">
                                    <dt>Nota oficial</dt>
                                    <dd>{sporting.sportingNote}</dd>
                                  </div>
                                ) : null}
                              </dl>
                              <Link
                                className="tg-table-link"
                                href={`/pilotos/${entry.driverSlug}#volta-a-volta`}
                                aria-label={`Ver volta a volta de ${entry.driverName}`}
                              >
                                Ver volta a volta <ArrowRight aria-hidden="true" />
                              </Link>
                            </details>
                          </li>
                        );
                      })}
                    </ol>
                  </div>
                ) : (
                  <EditorialEmpty
                    index="03"
                    title="Resultado oficial ainda não publicado."
                    description="A tabela completa será exibida após homologação."
                    action={{ href: "/resultados", label: "Ver resultados" }}
                  />
                )}
              </>
            )}

            <RacePagination
              meta={results.meta}
              basePath="/resultados"
              params={{ categoria: category, page: String(page) }}
            />
          </div>
        </section>

        <section className="tg-inline-cta">
          <div className="race-container">
            <Flag aria-hidden="true" />
            <div>
              <span>Próxima bandeirada</span>
              <h2>A temporada ainda tem capítulos pela frente.</h2>
            </div>
            <Link href="/calendario" className="race-button race-button-primary">
              Ver calendário <ChevronRight aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>
    </RaceShell>
  );
}
