import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ChevronRight, Download, Flag, Search } from "lucide-react";
import { EditorialEmpty, EditorialHeading } from "../../components/race/editorial-primitives";
import { RaceShell } from "../../components/race/race-shell";
import { localizeRaceText, PageHero, RacePagination, StatusBadge } from "../../components/race/ui";
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
    .replaceAll(".", "")
    .toLocaleUpperCase("pt-BR");

  return `Publicada em ${date} · versão ${result.version}`;
}

function raceLabel(result: PublicResult): string {
  const source = `${result.sessionName} ${result.title}`.toLocaleLowerCase("pt-BR");
  if (source.includes("endurance")) return "Endurance";
  if (source.includes("corrida 1")) return "Corrida 1";
  if (source.includes("corrida 2")) return "Corrida 2";
  return result.sessionName || result.title || "Resultado oficial";
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

function ResultPanel({ bundle, category }: { bundle: ResultBundle; category: string }) {
  const { result, entries, sporting } = bundle;
  const pdfUrl = officialResultPdfForResult(result.sessionName, result.title);
  const isGeneral = category === "geral";

  return (
    <section className="tg-result-panel" id={`resultado-${result.id}`}>
      <div className="tg-result-selector">
        <div className="tg-result-selector-copy">
          <span className="tg-result-date">
            {localizeRaceText(result.stageTitle)} · {formatShortDateLabel(result.startsAt)}
          </span>
          <h2>{raceLabel(result)}</h2>
          <p className="tg-result-meta">
            Posição geral preservada · leitura por {categoryLabel(category)}
          </p>
          <div className="tg-result-proof" aria-label="Informações da publicação">
            <span>{resultPublishedLabel(result)}</span>
            <span>
              {entries.length} {entries.length === 1 ? "piloto" : "pilotos"} nesta leitura
            </span>
          </div>
        </div>
        <div className="tg-result-selector-actions">
          <StatusBadge status={result.status} />
          {pdfUrl ? (
            <a
              className="race-button race-button-primary"
              href={pdfUrl}
              download
              aria-label={`Baixar resultado oficial em PDF de ${raceLabel(result)}`}
            >
              Baixar resultado oficial <Download aria-hidden="true" />
            </a>
          ) : null}
        </div>
      </div>

      {entries.length ? (
        <div className="tg-results-content">
          <section
            className="tg-results-podium"
            aria-label={`Destaques ${raceLabel(result)}${isGeneral ? "" : ` - ${categoryLabel(category)}`}`}
          >
            {entries.slice(0, 3).map((entry, index) => (
              <article className={`place-${index + 1}`} key={entry.id}>
                <span>{String(entry.position).padStart(2, "0")}</span>
                <h2>{entry.driverName}</h2>
                <p>{entry.category}</p>
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
              <caption className="sr-only">
                Resultado geral de {raceLabel(result)}
                {isGeneral ? " com todas as categorias" : ` em ${categoryLabel(category)}`}
              </caption>
              <thead>
                <tr>
                  <th scope="col">Pos.</th>
                  <th scope="col">Piloto</th>
                  {isGeneral ? <th scope="col">Categoria</th> : null}
                  <th scope="col">Voltas</th>
                  <th scope="col">Melhor volta</th>
                  <th scope="col">Ajustes</th>
                  <th scope="col">Pontos finais</th>
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
                      <td data-label="Voltas">{entry.laps}</td>
                      <td data-label="Melhor volta">{formatLapTime(entry.bestLapMs)}</td>
                      <td data-label="Ajustes">
                        <AdjustmentList adjustments={adjustments} />
                      </td>
                      <td data-label="Pontos na prova">
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
            aria-label={`Resultado resumido ${raceLabel(result)}`}
          >
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
                        {entry.category} · {entry.laps} voltas · {formatLapTime(entry.bestLapMs)}
                      </span>
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
                      href={`/pilotos/${entry.driverSlug}#volta-a-volta`}
                      aria-label={`Ver volta a volta de ${entry.driverName}`}
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
  const visibleEntryCount = visibleBundles.reduce(
    (total, bundle) => total + bundle.entries.length,
    0,
  );
  const clearHref = categoryHref(category, "");

  return (
    <RaceShell showMobileCta={false}>
      <main id="conteudo" tabIndex={-1} className="udk-page tg-internal-page">
        <PageHero
          index="03"
          eyebrow="Bandeirada oficial"
          title="Resultados"
          description="Um resultado por corrida. A categoria apenas separa a leitura; a posição e a pontuação seguem a classificação geral conjunta."
          compact
        />

        <section className="tg-results-section">
          <div className="race-container">
            <EditorialHeading
              index="03"
              title="Cada corrida, uma classificação geral."
              description="Os resultados históricos foram recalculados. Pilotos de categorias diferentes permanecem na mesma ordem de chegada e na mesma tabela de pontos."
            />

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
                  <span>Exibir linhas</span>
                  <p>O filtro muda a leitura, não a posição geral nem os pontos publicados.</p>
                </div>
                <nav
                  className="udk-category-tabs tg-category-tabs"
                  aria-label="Filtrar por categoria"
                >
                  {(
                    [
                      ["geral", "Todas as categorias"],
                      ["rapidos", "Ultras Rápidos"],
                      ["insanos", "Ultras Insanos"],
                    ] as const
                  ).map(([value, label]) => (
                    <Link
                      className={category === value ? "is-active" : ""}
                      href={categoryHref(value, query)}
                      aria-current={category === value ? "true" : undefined}
                      aria-label={`${label}${category === value ? " (selecionado)" : ""}`}
                      key={value}
                    >
                      {label}
                    </Link>
                  ))}
                </nav>
              </div>
            </section>

            {visibleBundles.length ? (
              <nav className="tg-results-index" aria-label="Índice de resultados">
                <div className="tg-results-index-heading">
                  <span>Arquivo de provas</span>
                  <strong>
                    {visibleBundles.length}{" "}
                    {visibleBundles.length === 1 ? "resultado" : "resultados"}
                    {query
                      ? ` · ${visibleEntryCount} ${visibleEntryCount === 1 ? "piloto" : "pilotos"}`
                      : ""}
                  </strong>
                </div>
                <ol>
                  {visibleBundles.map(({ result, entries }) => (
                    <li key={result.id}>
                      <a
                        href={`#resultado-${result.id}`}
                        aria-label={`Ir para ${raceLabel(result)}, ${formatShortDateLabel(result.startsAt)}`}
                      >
                        <span>{raceLabel(result)}</span>
                        <small>
                          {formatShortDateLabel(result.startsAt)} · {entries.length}{" "}
                          {entries.length === 1 ? "piloto" : "pilotos"}
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
                {visibleBundles.map((bundle) => (
                  <ResultPanel bundle={bundle} category={category} key={bundle.result.id} />
                ))}
              </div>
            ) : query ? (
              <EditorialEmpty
                index="03"
                title="Nenhum piloto encontrado."
                description={`Não há resultado publicado para “${query}” nesta leitura. Tente outro nome ou limpe a busca para ver todas as provas.`}
                action={{ href: clearHref, label: "Limpar busca" }}
              />
            ) : (
              <EditorialEmpty
                index="03"
                title="Resultados oficiais ainda não publicados."
                description="O pódio e os PDFs aparecerão após homologação. Nenhum vencedor, tempo ou posição foi criado apenas para preencher a tela."
                action={{ href: "/calendario", label: "Ver próximas etapas" }}
              />
            )}

            <RacePagination
              meta={results.meta}
              basePath="/resultados"
              params={{ categoria: category, piloto: query, page: String(page) }}
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
