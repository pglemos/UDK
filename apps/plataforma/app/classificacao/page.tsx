import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Download } from "lucide-react";
import { EditorialEmpty } from "../../components/race/editorial-primitives";
import { RaceShell } from "../../components/race/race-shell";
import { RacePagination, SearchField } from "../../components/race/ui";
import {
  getCategories,
  getLatestResultPublication,
  getStandingsPage,
  parsePositiveInt,
} from "../../lib/public-data";
import { officialResultPdf, officialResultPdfForResult } from "../../lib/official-result-links";
import { resultHeadingLabel } from "../../lib/public-result-labels";

export const metadata: Metadata = {
  title: "Classificação",
  description: "Classificação oficial da temporada UDK 2026.",
  alternates: { canonical: "/classificacao" },
};

function param(value: string | string[] | undefined, fallback = ""): string {
  return Array.isArray(value) ? (value[0] ?? fallback) : (value ?? fallback);
}

function formatPoints(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  return rounded.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
}

function publicationStatusLabel(status: string): string {
  const normalized = status.trim().toLowerCase();
  if (normalized === "rectified") return "Retificado";
  if (normalized === "published") return "Publicado";
  if (normalized === "homologated") return "Homologado";
  if (normalized === "official") return "Oficial";
  return status.trim() || "Status não informado";
}

export default async function StandingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const page = parsePositiveInt(params.page, 1, 500);
  const category = param(params.categoria, "geral");
  const query = param(params.q).trim();
  const [standings, leader, categories, latestPublication] = await Promise.all([
    getStandingsPage({ page, pageSize: 10, category, query, sort: "points" }),
    getStandingsPage({ page: 1, pageSize: 1, category, sort: "points" }),
    getCategories(),
    getLatestResultPublication(),
  ]);
  const categoryName =
    category === "geral"
      ? "Geral"
      : (categories.find((item) => item.slug === category)?.name ?? category);
  const hasQuery = Boolean(query);
  const leaderDriver = leader.items[0] ?? (!hasQuery ? standings.items[0] : null);
  const leaderPoints = leader.items[0]?.points ?? standings.items[0]?.points ?? 0;
  const resultCountLabel = `${standings.meta.totalItems} ${
    standings.meta.totalItems === 1 ? "piloto encontrado" : "pilotos encontrados"
  }`;
  const resultsContext = hasQuery
    ? `${categoryName} · ${resultCountLabel} para “${query}”`
    : `${categoryName} · ${resultCountLabel} no ranking oficial`;
  const clearSearchHref =
    category === "geral"
      ? "/classificacao"
      : `/classificacao?categoria=${encodeURIComponent(category)}`;
  const publicationDate = latestPublication?.publishedAt
    ? new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeZone: "America/Sao_Paulo",
      }).format(new Date(latestPublication.publishedAt))
    : null;
  const latestPublicationPdf = latestPublication
    ? officialResultPdfForResult(latestPublication.sessionName, latestPublication.title)
    : null;
  const emptyAction = hasQuery
    ? {
        href:
          category === "geral"
            ? "/classificacao"
            : `/classificacao?categoria=${encodeURIComponent(category)}`,
        label: "Limpar busca",
      }
    : { href: "/classificacao", label: "Ver classificação geral" };

  return (
    <RaceShell showMobileCta={false} showFooterCallout={false}>
      <main
        id="conteudo"
        tabIndex={-1}
        className="udk-page tg-internal-page tg-data-page tg-standings-page"
      >
        <header className="tg-data-heading">
          <div className="race-container">
            <div>
              <h1>Classificação</h1>
              <p>Temporada 2026 · Posição e pontos por categoria.</p>
            </div>
            {latestPublication && publicationDate ? (
              <p className="tg-publication-context">
                Ranking atualizado pelo resultado mais recente:{" "}
                <Link href={`/resultados#resultado-${latestPublication.id}`}>
                  {resultHeadingLabel(latestPublication)}
                </Link>
                <span>
                  {publicationStatusLabel(latestPublication.status)} · versão{" "}
                  {latestPublication.version} ·{" "}
                  <time dateTime={latestPublication.publishedAt ?? undefined}>
                    {publicationDate}
                  </time>
                  {latestPublicationPdf ? (
                    <>
                      {" · "}
                      <a
                        className="tg-publication-pdf"
                        href={latestPublicationPdf}
                        download
                        aria-label={`Baixar PDF oficial de ${resultHeadingLabel(latestPublication)}`}
                      >
                        PDF oficial
                      </a>
                    </>
                  ) : null}
                </span>
              </p>
            ) : null}
          </div>
        </header>

        <section className="tg-standings-section" id="ranking" aria-label="Ranking da temporada">
          <div className="race-container">
            <div className="tg-public-data-controls">
              <nav
                className="udk-category-tabs tg-category-tabs"
                aria-label="Filtrar classificação por categoria"
              >
                <Link
                  className={category === "geral" ? "is-active" : ""}
                  href="/classificacao?categoria=geral"
                  aria-current={category === "geral" ? "page" : undefined}
                >
                  Geral
                </Link>
                {categories.map((item) => (
                  <Link
                    className={category === item.slug ? "is-active" : ""}
                    href={`/classificacao?categoria=${item.slug}`}
                    aria-current={category === item.slug ? "page" : undefined}
                    key={item.slug}
                  >
                    {item.name}
                  </Link>
                ))}
              </nav>

              <form
                className="udk-toolbar tg-toolbar is-compact"
                action="/classificacao"
                aria-label="Busca na classificação"
              >
                <SearchField defaultValue={query} placeholder="Buscar piloto" />
                <input type="hidden" name="categoria" value={category} />
                <button type="submit" className="race-button race-button-primary">
                  Buscar piloto
                </button>
                {hasQuery ? (
                  <Link href={clearSearchHref} className="tg-table-link">
                    Limpar busca
                  </Link>
                ) : null}
              </form>
            </div>

            <p className="tg-data-legend" id="standing-legend">
              {category === "geral"
                ? "Classificação geral · todas as categorias."
                : `Classificação da categoria ${categoryName}.`}{" "}
              Pontos válidos são os usados no ranking; brutos e descartes mostram como o total foi
              calculado.
              <span className="tg-standing-order-note">
                {category === "geral"
                  ? "Ordem geral compara todas as categorias; a posição na categoria aparece sob o nome."
                  : `Posição mostra o lugar dentro de ${categoryName}; o total segue os pontos válidos da temporada.`}
              </span>
            </p>

            {leaderDriver ? (
              <p className="tg-standing-leader-summary">
                Líder{category === "geral" ? " geral" : ` · ${categoryName}`}:{" "}
                <Link href={`/pilotos/${leaderDriver.slug}`}>{leaderDriver.name}</Link> ·{" "}
                <strong>{formatPoints(leaderDriver.points)} pts válidos</strong>
              </p>
            ) : null}

            <p className="tg-standings-context" aria-live="polite">
              {resultsContext}
            </p>

            {standings.items.length ? (
              <div className="tg-standings-content">
                <div className="tg-standing-table-wrap tg-desktop-standing-table-wrap">
                  <table
                    className="udk-data-table tg-standing-table"
                    aria-describedby="standing-legend"
                  >
                    <caption className="sr-only">
                      {category === "geral"
                        ? "Classificação geral"
                        : `Classificação de ${categoryName}`}{" "}
                      UDK 2026 com pontuação bruta, descartes e pontos válidos
                    </caption>
                    <thead>
                      <tr>
                        <th scope="col">{category === "geral" ? "Ordem geral" : "Posição"}</th>
                        <th scope="col">Piloto</th>
                        <th scope="col">Categoria</th>
                        <th scope="col">Métricas</th>
                        <th scope="col">Pontos válidos</th>
                        <th scope="col">
                          <span className="sr-only">Abrir perfil</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {standings.items.map((driver) => {
                        const absolutePosition = driver.rankingPosition;
                        const gap =
                          Math.round(Math.max(0, leaderPoints - driver.points) * 100) / 100;
                        return (
                          <tr key={driver.slug}>
                            <td data-label={category === "geral" ? "Ordem geral" : "Posição"}>
                              <span className={`udk-rank rank-${absolutePosition ?? "—"}`}>
                                {absolutePosition ?? "—"}
                              </span>
                            </td>
                            <td data-label="Piloto">
                              <Link className="udk-driver-cell" href={`/pilotos/${driver.slug}`}>
                                <strong>{driver.name}</strong>
                              </Link>
                            </td>
                            <td data-label="Categoria">
                              <span>{driver.category}</span>
                              {category === "geral" && driver.position ? (
                                <small className="tg-category-position">
                                  {driver.position}º na categoria
                                </small>
                              ) : null}
                            </td>
                            <td data-label="Métricas">
                              <details className="tg-standing-metrics">
                                <summary>Ver métricas</summary>
                                <dl>
                                  <div>
                                    <dt>Diferença para o líder</dt>
                                    <dd>{gap === 0 ? "Líder" : `-${formatPoints(gap)}`}</dd>
                                  </div>
                                  <div>
                                    <dt>Vitórias</dt>
                                    <dd>{driver.wins}</dd>
                                  </div>
                                  <div>
                                    <dt>Pódios</dt>
                                    <dd>{driver.podiums}</dd>
                                  </div>
                                  <div>
                                    <dt>Brutos</dt>
                                    <dd>{formatPoints(driver.grossPoints)}</dd>
                                  </div>
                                  <div>
                                    <dt>Descartes</dt>
                                    <dd>
                                      <span className="udk-discarded-points">
                                        {driver.discardedPoints > 0
                                          ? `-${formatPoints(driver.discardedPoints)}`
                                          : "—"}
                                      </span>
                                    </dd>
                                  </div>
                                </dl>
                              </details>
                            </td>
                            <td data-label="Pontos válidos">
                              <strong className="udk-points">{formatPoints(driver.points)}</strong>
                            </td>
                            <td>
                              <Link
                                href={`/pilotos/${driver.slug}`}
                                aria-label={`Abrir ${driver.name}`}
                              >
                                <ChevronRight aria-hidden="true" />
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <ol className="tg-mobile-standing-list" aria-label="Classificação resumida">
                  {standings.items.map((driver) => {
                    const absolutePosition = driver.rankingPosition;
                    const gap = Math.round(Math.max(0, leaderPoints - driver.points) * 100) / 100;
                    return (
                      <li
                        className="tg-mobile-standing-item"
                        key={driver.slug}
                        value={absolutePosition ?? undefined}
                      >
                        <div className="tg-mobile-standing-summary">
                          <span className={`udk-rank rank-${absolutePosition ?? "—"}`}>
                            {absolutePosition ?? "—"}
                          </span>
                          <div className="tg-mobile-standing-driver">
                            <Link href={`/pilotos/${driver.slug}`}>
                              <strong>{driver.name}</strong>
                            </Link>
                            <span>{driver.category}</span>
                            {category === "geral" && driver.position ? (
                              <small>{driver.position}º na categoria</small>
                            ) : null}
                          </div>
                          <strong className="udk-points">
                            {formatPoints(driver.points)}
                            <small>pts válidos</small>
                          </strong>
                        </div>
                        <details>
                          <summary>Ver detalhes</summary>
                          <dl className="tg-mobile-detail-grid">
                            <div>
                              <dt>Diferença para o líder</dt>
                              <dd>{gap === 0 ? "Líder" : `-${formatPoints(gap)} pts`}</dd>
                            </div>
                            <div>
                              <dt>Vitórias</dt>
                              <dd>{driver.wins}</dd>
                            </div>
                            <div>
                              <dt>Pódios</dt>
                              <dd>{driver.podiums}</dd>
                            </div>
                            <div>
                              <dt>Brutos</dt>
                              <dd>{formatPoints(driver.grossPoints)}</dd>
                            </div>
                            <div>
                              <dt>Descartes</dt>
                              <dd>
                                {driver.discardedPoints > 0
                                  ? `-${formatPoints(driver.discardedPoints)}`
                                  : "—"}
                              </dd>
                            </div>
                          </dl>
                          <Link
                            className="tg-table-link"
                            href={`/pilotos/${driver.slug}`}
                            aria-label={`Abrir perfil de ${driver.name}`}
                          >
                            Abrir perfil <ChevronRight aria-hidden="true" />
                          </Link>
                        </details>
                      </li>
                    );
                  })}
                </ol>
              </div>
            ) : (
              <EditorialEmpty
                index="02"
                title={
                  hasQuery
                    ? `Nenhum piloto encontrado para “${query}”.`
                    : `Nenhum piloto encontrado em ${categoryName}.`
                }
                description={
                  hasQuery
                    ? "Tente outro nome ou limpe a busca para ver os pilotos desta categoria."
                    : "Escolha outra categoria para voltar ao ranking oficial."
                }
                action={emptyAction}
              />
            )}

            <RacePagination
              meta={standings.meta}
              basePath="/classificacao"
              params={{ categoria: category, q: query || undefined, page: String(page) }}
              showStatus
            />

            <section className="tg-standings-documents" aria-labelledby="standings-documents-title">
              <h2 id="standings-documents-title">Documentos oficiais</h2>
              <div
                className="tg-official-pdf-links"
                role="group"
                aria-label="PDFs oficiais por corrida"
              >
                <a
                  className="race-button race-button-outline is-light tg-pdf-link"
                  aria-label="Endurance · PDF oficial (baixar)"
                  href={officialResultPdf.endurance}
                  download
                >
                  <span>
                    <strong>Endurance</strong>
                    <small>PDF oficial</small>
                  </span>
                  <Download aria-hidden="true" />
                </a>
                <a
                  className="race-button race-button-outline is-light tg-pdf-link"
                  aria-label="Corrida 1 · PDF oficial (baixar)"
                  href={officialResultPdf.corrida1}
                  download
                >
                  <span>
                    <strong>Corrida 1</strong>
                    <small>PDF oficial</small>
                  </span>
                  <Download aria-hidden="true" />
                </a>
                <a
                  className="race-button race-button-outline is-light tg-pdf-link"
                  aria-label="Corrida 2 · PDF oficial (baixar)"
                  href={officialResultPdf.corrida2}
                  download
                >
                  <span>
                    <strong>Corrida 2</strong>
                    <small>PDF oficial</small>
                  </span>
                  <Download aria-hidden="true" />
                </a>
              </div>
            </section>

            <details className="tg-data-help tg-scoring-explainer">
              <summary>Ver regras de pontuação e descartes</summary>
              <dl>
                <div>
                  <dt>Pontos brutos</dt>
                  <dd>Soma dos pontos antes dos descartes.</dd>
                </div>
                <div>
                  <dt>Descartes</dt>
                  <dd>Pontos retirados conforme a regra da temporada.</dd>
                </div>
                <div>
                  <dt>Pontos válidos</dt>
                  <dd>Pontos brutos menos descartes; usados na classificação.</dd>
                </div>
                <div>
                  <dt>Diferença para o líder</dt>
                  <dd>
                    Pontos válidos que faltam para alcançar o líder da visão geral ou da categoria
                    selecionada, independentemente da busca.
                  </dd>
                </div>
              </dl>
              <p>
                <strong>Regra 2026: melhores 6 de 8 resultados.</strong> A temporada tem 6 corridas
                regulares e 2 provas de resistência. Até o 6º evento não há descarte; após o 7º, o
                pior resultado é descartado; após o 8º, os dois piores.
              </p>
              {category === "geral" ? (
                <p>
                  A visão geral reúne os pilotos por pontos válidos. A posição oficial de cada
                  categoria aparece junto ao nome da categoria.
                </p>
              ) : null}
            </details>
          </div>
        </section>
      </main>
    </RaceShell>
  );
}
