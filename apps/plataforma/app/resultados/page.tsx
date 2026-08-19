import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ChevronRight, Download, Flag } from "lucide-react";
import { EditorialEmpty, EditorialHeading } from "../../components/race/editorial-primitives";
import { RaceShell } from "../../components/race/race-shell";
import { PageHero, RacePagination, StatusBadge } from "../../components/race/ui";
import {
  formatLapTime,
  getResultEntries,
  getResultsPage,
  parsePositiveInt,
} from "../../lib/public-data";
import { officialResultPdfForCategory } from "../../lib/official-result-links";

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
    <RaceShell>
      <main id="conteudo" className="udk-page tg-internal-page">
        <PageHero
          index="03"
          eyebrow="Bandeirada oficial"
          title="Resultados"
          description="A 1ª etapa foi homologada em duas classificações oficiais, uma por categoria."
        />

        <section className="tg-results-section">
          <div className="race-container">
            <EditorialHeading
              index="03"
              title="O resultado termina a corrida. A leitura começa depois."
              description="Tempos, posições, penalizações e pontos aparecem apenas após publicação oficial. O portal soma os pontos-base aos bônus homologados; os PDFs preservam a pontuação-base e trazem a Super Pole em página separada."
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
                        <p>{result.stageTitle} — classificação oficial separada por categoria.</p>
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
                    <span>Resultado selecionado</span>
                    <h2>{selected?.category ?? "Aguardando publicação"}</h2>
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
                  <>
                    <section
                      className="tg-results-podium"
                      aria-label={`Pódio ${selected.category}`}
                    >
                      {selectedEntries.slice(0, 3).map((entry, index) => (
                        <article className={`place-${index + 1}`} key={entry.id}>
                          <span>{String(index + 1).padStart(2, "0")}</span>
                          <h2>{entry.driverName}</h2>
                          <p>{entry.stageTitle}</p>
                          <strong>{formatLapTime(entry.bestLapMs)}</strong>
                          <small>
                            {isNotClassified(entry.status, entry.position)
                              ? "NC"
                              : `${entry.points} pts`}
                          </small>
                        </article>
                      ))}
                    </section>

                    <div className="tg-standing-table-wrap">
                      <table className="udk-data-table tg-standing-table">
                        <caption className="sr-only">Resultado oficial por categoria</caption>
                        <thead>
                          <tr>
                            <th>Pos.</th>
                            <th>Piloto</th>
                            <th>Voltas</th>
                            <th>Melhor volta</th>
                            <th>Penalidade</th>
                            <th>Pontos</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedEntries.map((entry) => {
                            const notClassified = isNotClassified(entry.status, entry.position);
                            return (
                              <tr key={entry.id}>
                                <td data-label="Posição">
                                  <span className="udk-rank">
                                    {notClassified ? "NC" : entry.position}
                                  </span>
                                </td>
                                <td data-label="Piloto">
                                  <strong>{entry.driverName}</strong>
                                </td>
                                <td data-label="Voltas">{entry.laps}</td>
                                <td data-label="Melhor volta">{formatLapTime(entry.bestLapMs)}</td>
                                <td data-label="Penalidade">
                                  {entry.penaltyMs ? `+${entry.penaltyMs / 1000}s` : "—"}
                                </td>
                                <td data-label="Pontos">
                                  <strong className="udk-points">
                                    {notClassified ? "—" : entry.points}
                                  </strong>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </>
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
