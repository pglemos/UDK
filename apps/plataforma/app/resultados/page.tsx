import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ChevronRight, Download, Flag, Search } from "lucide-react";
import { EditorialEmpty } from "../../components/race/editorial-primitives";
import { PublicResultsBehavior } from "../../components/race/public-results-behavior";
import { RaceShell } from "../../components/race/race-shell";
import { RacePagination, StatusBadge } from "../../components/race/ui";
import {
  filterResultEntriesByCategory,
  formatLapTime,
  getResultEntries,
  getResultsPage,
  parsePositiveInt,
} from "../../lib/public-data";
import type { PublicResult, PublicResultEntry } from "../../lib/public-data";
import { formatShortDateLabel } from "../../lib/datetime";
import { officialResultPdfForResult } from "../../lib/official-result-links";
import {
  resultHeadingLabel,
  resultSessionLabel,
  resultStageLabel,
} from "../../lib/public-result-labels";
import { getSportingBreakdowns, type SportingBreakdown } from "../../lib/sporting-breakdown";

export const metadata: Metadata = {
  title: "Resultados",
  description: "Resultados oficiais da temporada UDK 2026.",
  alternates: { canonical: "/resultados" },
};

type ResultBundle = {
  result: PublicResult;
  entries: PublicResultEntry[];
  sporting: Map<string, SportingBreakdown>;
};

function param(value: string | string[] | undefined, fallback = ""): string {
  return Array.isArray(value) ? (value[0] ?? fallback) : (value ?? fallback);
}

function isNotClassified(status: string, position: number): boolean {
  return status.toLowerCase() === "nc" || position >= 999;
}

function visiblePosition(entry: PublicResultEntry): string | number {
  return entry.position > 0 && entry.position < 999 ? entry.position : "NC";
}

function categoryLabel(category: string): string {
  if (category === "insanos") return "Ultras Insanos";
  if (category === "rapidos") return "Ultras Rápidos";
  return "todas as categorias";
}

function categoryHref(category: string, query: string): string {
  const params = new URLSearchParams();
  if (category !== "geral") params.set("categoria", category);
  if (query) params.set("piloto", query);
  const search = params.toString();
  return search ? `/resultados?${search}` : "/resultados";
}

function matchesDriver(entry: PublicResultEntry, query: string): boolean {
  if (!query) return true;
  const normalizedQuery = query.toLocaleLowerCase("pt-BR");
  return `${entry.driverName} ${entry.driverSlug}`
    .toLocaleLowerCase("pt-BR")
    .includes(normalizedQuery);
}

function resultPublishedLabel(result: PublicResult): string {
  if (!result.publishedAt) return `Versão ${result.version}`;

  const publishedAt = new Date(result.publishedAt);
  if (Number.isNaN(publishedAt.getTime())) return `Versão ${result.version}`;

  const date = publishedAt
    .toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "America/Sao_Paulo",
    })
    .replaceAll(".", "");

  const prefix =
    result.status.toLowerCase() === "rectified" ? "Retificação publicada em" : "Publicada em";
  return `${prefix} ${date} · versão ${result.version}`;
}

function resultStatusNote(result: PublicResult): string | null {
  if (result.status.toLowerCase() === "rectified") {
    return "Esta é uma versão retificada do resultado oficial. Consulte o PDF para o registro completo.";
  }
  return null;
}

function resultAdjustments(
  entry: PublicResultEntry,
  sporting: SportingBreakdown | undefined,
): string[] {
  return [
    entry.pole ? "Pole +1" : null,
    entry.fastestLap ? "Melhor volta +1" : null,
    sporting?.bestPit ? "Melhor pit stop +10" : null,
    entry.penaltyMs ? `Penalidade +${entry.penaltyMs / 1000}s` : null,
    sporting?.penaltyPoints ? `Penalidade -${sporting.penaltyPoints} pts` : null,
    sporting?.timingAdjustmentLaps
      ? `Ajuste +${sporting.timingAdjustmentLaps} volta${sporting.timingAdjustmentLaps === 1 ? "" : "s"}`
      : null,
  ].filter((value): value is string => Boolean(value));
}

function AdjustmentList({ adjustments }: { adjustments: string[] }) {
  if (!adjustments.length) return <span className="tg-adjustments-empty">Sem ajustes</span>;

  return (
    <ul className="tg-adjustment-list" aria-label="Ajustes do resultado">
      {adjustments.map((adjustment) => (
        <li key={adjustment}>{adjustment}</li>
      ))}
    </ul>
  );
}

function ResultAdjustmentsDisclosure({ adjustments }: { adjustments: string[] }) {
  if (!adjustments.length) return <span className="tg-adjustments-empty">Sem ajustes</span>;

  return (
    <details className="tg-result-adjustments">
      <summary>
        {adjustments.length} {adjustments.length === 1 ? "ajuste" : "ajustes"}
      </summary>
      <AdjustmentList adjustments={adjustments} />
    </details>
  );
}

function ResultPanel({ bundle, category }: { bundle: ResultBundle; category: string }) {
  const { result, entries, sporting } = bundle;
  const pdfUrl = officialResultPdfForResult(result.sessionName, result.title);
  const isGeneral = category === "geral";
  const stageLabel = resultStageLabel(result);
  const headingLabel = resultHeadingLabel(result);
  const statusNote = resultStatusNote(result);

  return (
    <section className="tg-result-panel" aria-labelledby={`resultado-title-${result.id}`}>
      <div className="tg-result-selector">
        <div className="tg-result-selector-copy">
          <h2 id={`resultado-title-${result.id}`}>{headingLabel}</h2>
          <span className="tg-result-date">
            {stageLabel} · {formatShortDateLabel(result.startsAt)}
            {result.track ? ` · ${result.track}` : ""}
          </span>
          <p className="tg-result-meta">Classificação da prova · {categoryLabel(category)}</p>
          <div className="tg-result-proof" aria-label="Informações da publicação">
            <span>{resultPublishedLabel(result)}</span>
            <span>
              {entries.length} {entries.length === 1 ? "piloto" : "pilotos"} nesta prova
            </span>
          </div>
          {statusNote ? <p className="tg-result-status-note">{statusNote}</p> : null}
          <p className="tg-result-inline-legend">
            Melhor volta = menor tempo de uma volta · ajustes = bônus, penalizações ou voltas
            acrescentadas · NC = não classificado.
          </p>
        </div>
        <div className="tg-result-selector-actions">
          <StatusBadge status={result.status} />
          {pdfUrl ? (
            <a
              className="race-button race-button-primary"
              href={pdfUrl}
              download
              aria-label={`Baixar resultado oficial · ${headingLabel} (PDF)`}
            >
              Baixar resultado oficial <Download aria-hidden="true" />
            </a>
          ) : null}
        </div>
      </div>

      {entries.length ? (
        <div className="tg-results-content">
          <div className="tg-standing-table-wrap tg-desktop-standing-table-wrap">
            <table className="udk-data-table tg-standing-table" aria-describedby="results-legend">
              <caption className="sr-only">
                Resultado geral de {headingLabel}
                {isGeneral ? " com todas as categorias" : ` em ${categoryLabel(category)}`}
              </caption>
              <thead>
                <tr>
                  <th scope="col">Posição</th>
                  <th scope="col">Piloto</th>
                  {isGeneral ? <th scope="col">Categoria</th> : null}
                  <th className="tg-result-secondary-column" scope="col">
                    Voltas
                  </th>
                  <th className="tg-result-secondary-column" scope="col">
                    Melhor volta
                  </th>
                  <th className="tg-result-secondary-column" scope="col">
                    Ajustes
                  </th>
                  <th scope="col">Pontos na prova</th>
                  <th scope="col">Detalhes</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => {
                  const notClassified = isNotClassified(entry.status, entry.position);
                  const entrySporting = sporting.get(entry.id);
                  const adjustments = resultAdjustments(entry, entrySporting);

                  return (
                    <tr key={entry.id}>
                      <td data-label="Posição">
                        <span className="tg-result-position">
                          <span className="udk-rank">{visiblePosition(entry)}</span>
                          {notClassified && visiblePosition(entry) !== "NC" ? (
                            <small className="tg-result-status">NC</small>
                          ) : null}
                        </span>
                      </td>
                      <td data-label="Piloto">
                        <strong>{entry.driverName}</strong>
                        {entrySporting?.sportingNote ? (
                          <details className="tg-result-note">
                            <summary>Ver nota oficial</summary>
                            <p>{entrySporting.sportingNote}</p>
                          </details>
                        ) : null}
                      </td>
                      {isGeneral ? <td data-label="Categoria">{entry.category}</td> : null}
                      <td className="tg-result-secondary-column" data-label="Voltas">
                        {entry.laps}
                      </td>
                      <td className="tg-result-secondary-column" data-label="Melhor volta">
                        {formatLapTime(entry.bestLapMs)}
                      </td>
                      <td className="tg-result-secondary-column" data-label="Ajustes">
                        <ResultAdjustmentsDisclosure adjustments={adjustments} />
                      </td>
                      <td data-label="Pontos na prova">
                        <strong className="udk-points">
                          {notClassified && entry.points === 0 ? "—" : entry.points}
                        </strong>
                      </td>
                      <td data-label="Detalhes">
                        <Link
                          className="tg-table-link"
                          href={`/pilotos/${entry.driverSlug}?resultado=${encodeURIComponent(result.id)}#volta-a-volta`}
                          aria-label={`Ver volta a volta de ${entry.driverName} em ${headingLabel}`}
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

          <ol className="tg-mobile-result-list" aria-label={`Resultado resumido ${headingLabel}`}>
            {entries.map((entry) => {
              const notClassified = isNotClassified(entry.status, entry.position);
              const entrySporting = sporting.get(entry.id);
              const adjustments = resultAdjustments(entry, entrySporting);

              return (
                <li className="tg-mobile-result-item" key={entry.id}>
                  <div className="tg-mobile-result-summary">
                    <span className="tg-result-position">
                      <span className="udk-rank">{visiblePosition(entry)}</span>
                      {notClassified && visiblePosition(entry) !== "NC" ? (
                        <small className="tg-result-status">NC</small>
                      ) : null}
                    </span>
                    <div className="tg-mobile-result-driver">
                      <strong>{entry.driverName}</strong>
                      <span>
                        {entry.category} · {entry.laps} voltas
                      </span>
                      <span>Melhor volta: {formatLapTime(entry.bestLapMs)}</span>
                      {adjustments.length ? (
                        <span className="tg-mobile-result-adjustment">
                          <span>Ajustes</span>
                          <strong>{adjustments.join(" · ")}</strong>
                        </span>
                      ) : null}
                    </div>
                    <strong
                      className="udk-points"
                      aria-label={`${notClassified && entry.points === 0 ? "Sem" : entry.points} pontos`}
                    >
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
                          <AdjustmentList adjustments={adjustments} />
                        </dd>
                      </div>
                      {entrySporting?.sportingNote ? (
                        <div className="tg-mobile-detail-wide">
                          <dt>Nota oficial</dt>
                          <dd>{entrySporting.sportingNote}</dd>
                        </div>
                      ) : null}
                    </dl>
                    <Link
                      className="tg-table-link"
                      href={`/pilotos/${entry.driverSlug}?resultado=${encodeURIComponent(result.id)}#volta-a-volta`}
                      aria-label={`Ver volta a volta de ${entry.driverName} em ${headingLabel}`}
                    >
                      Ver volta a volta <ChevronRight aria-hidden="true" />
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
          title="Nenhum piloto nesta categoria."
          description="O resultado geral existe, mas esta leitura não tem entradas publicadas."
          action={{ href: "/resultados", label: "Ver resultado geral" }}
        />
      )}

      <div className="tg-result-secondary-actions" aria-label="Ações secundárias da prova">
        <a className="tg-result-back-to-index" href="#resultados-index">
          Voltar ao índice de provas
        </a>
      </div>
    </section>
  );
}

export default async function ResultsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const page = parsePositiveInt(params.page, 1, 500);
  const requestedCategory = param(params.categoria, "geral");
  const category = ["geral", "rapidos", "insanos"].includes(requestedCategory)
    ? requestedCategory
    : "geral";
  const query = param(params.piloto).trim().slice(0, 80);
  const results = await getResultsPage({ page, pageSize: 6 });
  const bundles = await Promise.all(
    results.items.map(async (result) => {
      const allEntries = await getResultEntries(result.id);
      const entries = filterResultEntriesByCategory(allEntries, category).filter((entry) =>
        matchesDriver(entry, query),
      );
      return {
        result,
        entries,
        sporting: await getSportingBreakdowns(allEntries.map((entry) => entry.id)),
      } satisfies ResultBundle;
    }),
  );
  const visibleBundles = query ? bundles.filter((bundle) => bundle.entries.length > 0) : bundles;
  const visibleDriverCount = new Set(
    visibleBundles.flatMap((bundle) => bundle.entries.map((entry) => entry.driverSlug)),
  ).size;
  const latestBundle = visibleBundles[0];
  const latestFeaturedEntry = latestBundle
    ? (latestBundle.entries.find(
        (entry) => entry.position === 1 && !isNotClassified(entry.status, entry.position),
      ) ??
      latestBundle.entries.find((entry) => !isNotClassified(entry.status, entry.position)) ??
      latestBundle.entries[0])
    : undefined;
  const clearHref = categoryHref(category, "");

  return (
    <RaceShell showMobileCta={false} showFooterCallout={false}>
      <main
        id="conteudo"
        tabIndex={-1}
        className="udk-page tg-internal-page tg-data-page tg-results-page"
      >
        <header className="tg-data-heading">
          <div className="race-container">
            <div>
              <h1>Resultados</h1>
              <p>Temporada 2026 · Classificação e tempos de cada corrida.</p>
            </div>
            <Link href="/classificacao" className="tg-data-heading-link">
              Ver classificação da temporada <ArrowRight aria-hidden="true" />
            </Link>
          </div>
        </header>

        <section className="tg-results-section">
          <div className="race-container">
            {!query && latestBundle && latestFeaturedEntry ? (
              <div className="tg-results-quick-summary" aria-label="Resultado mais recente">
                <div>
                  <span>Resultado mais recente</span>
                  <strong>{resultHeadingLabel(latestBundle.result)}</strong>
                  <small>{formatShortDateLabel(latestBundle.result.startsAt)}</small>
                </div>
                <div className="tg-results-quick-driver">
                  <span>
                    {visiblePosition(latestFeaturedEntry) === "NC"
                      ? "Classificação"
                      : `${visiblePosition(latestFeaturedEntry)}º lugar`}
                  </span>
                  <strong>{latestFeaturedEntry.driverName}</strong>
                  <small>{latestFeaturedEntry.points} pts na prova</small>
                </div>
                <a href={`#resultado-${latestBundle.result.id}`}>
                  Abrir resultado completo <ArrowRight aria-hidden="true" />
                </a>
              </div>
            ) : null}

            <section className="tg-results-tools" aria-label="Encontrar um resultado">
              <form className="tg-result-search" method="get" role="search">
                <label htmlFor="result-driver-search">Buscar por piloto</label>
                <div className="tg-result-search-row">
                  <div className="tg-result-search-input">
                    <Search aria-hidden="true" />
                    <input
                      id="result-driver-search"
                      name="piloto"
                      type="search"
                      placeholder="Ex.: André Felisberto"
                      maxLength={80}
                      defaultValue={query}
                      autoComplete="off"
                    />
                  </div>
                  {category !== "geral" ? (
                    <input type="hidden" name="categoria" value={category} />
                  ) : null}
                  <button className="race-button race-button-primary" type="submit">
                    Buscar
                  </button>
                  {query ? (
                    <Link className="race-button race-button-ghost" href={clearHref}>
                      Limpar
                    </Link>
                  ) : null}
                </div>
              </form>

              <div className="tg-result-filter-block">
                <div className="tg-result-filter-heading">
                  <span>Categoria</span>
                  <small>“Todas” reúne todas as categorias.</small>
                </div>
                <nav
                  className="udk-category-tabs tg-category-tabs"
                  aria-label="Filtrar por categoria"
                >
                  {(
                    [
                      ["geral", "Todas"],
                      ["rapidos", "Ultras Rápidos"],
                      ["insanos", "Ultras Insanos"],
                    ] as const
                  ).map(([value, label]) => (
                    <Link
                      className={category === value ? "is-active" : ""}
                      href={categoryHref(value, query)}
                      aria-current={category === value ? "page" : undefined}
                      key={value}
                    >
                      {label}
                    </Link>
                  ))}
                </nav>
              </div>
            </section>

            <p className="tg-data-legend" id="results-legend">
              NC = não classificado · melhor volta = menor tempo de uma volta · ajustes = bônus,
              penalizações ou voltas acrescentadas.
            </p>

            {visibleBundles.length ? (
              <nav
                className="tg-results-index"
                id="resultados-index"
                aria-label="Índice de resultados"
              >
                <div className="tg-results-index-heading">
                  <span>Escolher prova</span>
                  <strong aria-live="polite">
                    {query
                      ? `${visibleDriverCount} ${visibleDriverCount === 1 ? "piloto" : "pilotos"} em ${visibleBundles.length} ${visibleBundles.length === 1 ? "prova" : "provas"}`
                      : `${visibleBundles.length} provas`}
                  </strong>
                </div>
                <p className="tg-results-index-hint" id="resultados-index-hint">
                  Deslize para ver todas as provas ou use Tab para selecionar uma.
                </p>
                <ol tabIndex={0} aria-describedby="resultados-index-hint">
                  {visibleBundles.map(({ result }) => (
                    <li key={result.id}>
                      <a
                        href={`#resultado-${result.id}`}
                        aria-label={`${resultHeadingLabel(result)} · ${formatShortDateLabel(result.startsAt)}`}
                      >
                        <span>{resultSessionLabel(result)}</span>
                        <small>
                          {resultStageLabel(result)} · {formatShortDateLabel(result.startsAt)}
                        </small>
                        <ChevronRight aria-hidden="true" />
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>
            ) : null}

            {visibleBundles.length ? (
              <div className="tg-results-list" aria-label="Resultados oficiais por corrida">
                <PublicResultsBehavior />
                {visibleBundles.map((bundle, index) => {
                  const featuredEntry =
                    bundle.entries.find(
                      (entry) =>
                        entry.position === 1 && !isNotClassified(entry.status, entry.position),
                    ) ??
                    bundle.entries.find(
                      (entry) => !isNotClassified(entry.status, entry.position),
                    ) ??
                    bundle.entries[0];

                  return (
                    <details
                      className="tg-result-disclosure"
                      data-result-disclosure="true"
                      id={`resultado-${bundle.result.id}`}
                      key={bundle.result.id}
                      open={index === 0}
                    >
                      <summary className="tg-result-disclosure-summary">
                        <span className="tg-result-disclosure-closed">
                          <strong>{resultHeadingLabel(bundle.result)}</strong>
                          <small>{resultPublishedLabel(bundle.result)}</small>
                          {featuredEntry ? (
                            <small className="tg-result-disclosure-winner">
                              {visiblePosition(featuredEntry) === "NC"
                                ? `${featuredEntry.driverName} · NC`
                                : `${visiblePosition(featuredEntry)}º ${featuredEntry.driverName} · ${featuredEntry.points} pts`}
                            </small>
                          ) : null}
                        </span>
                        <span className="tg-result-disclosure-open">
                          Recolher {resultHeadingLabel(bundle.result)}
                        </span>
                      </summary>
                      <ResultPanel bundle={bundle} category={category} />
                    </details>
                  );
                })}
              </div>
            ) : query ? (
              <EditorialEmpty
                index="03"
                title="Nenhum piloto encontrado."
                description={`Não há resultado publicado para “${query}” nesta prova. Tente outro nome ou limpe a busca para ver todas as provas.`}
                action={{ href: clearHref, label: "Limpar busca" }}
              />
            ) : (
              <EditorialEmpty
                index="03"
                title="Resultados oficiais ainda não publicados."
                description="Os resultados e os PDFs estarão disponíveis após a homologação de cada prova."
                action={{ href: "/calendario", label: "Ver próximas etapas" }}
              />
            )}

            <RacePagination
              meta={results.meta}
              basePath="/resultados"
              params={{ categoria: category, piloto: query, page: String(page) }}
            />

            <details className="tg-data-help">
              <summary>Como ler os resultados</summary>
              <p>
                Os filtros preservam a posição geral e os pontos da prova. Melhor volta é o menor
                tempo de uma volta, não o tempo total da corrida. NC significa não classificado.
              </p>
              <p>
                Ajustes mostram os bônus e penalizações publicados. As notas oficiais e o PDF de
                cada prova trazem os detalhes.
              </p>
            </details>
          </div>
        </section>

        <section className="tg-inline-cta">
          <div className="race-container">
            <Flag aria-hidden="true" />
            <div>
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
