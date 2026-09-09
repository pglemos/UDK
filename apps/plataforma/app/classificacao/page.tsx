import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronRight, Download, Trophy } from "lucide-react";
import { DriverPlaceholder } from "../../components/race/driver-placeholder";
import { EditorialEmpty, EditorialHeading } from "../../components/race/editorial-primitives";
import { RaceShell } from "../../components/race/race-shell";
import { PageHero, RacePagination, SearchField } from "../../components/race/ui";
import { getCategories, getStandingsPage, parsePositiveInt } from "../../lib/public-data";
import { officialResultPdf } from "../../lib/official-result-links";
import { driverVisual, resolveVisualSource } from "../../lib/visual-assets";

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

export default async function StandingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const page = parsePositiveInt(params.page, 1, 500);
  const category = param(params.categoria, "geral");
  const query = param(params.q).trim();
  const [standings, leaders, categories] = await Promise.all([
    getStandingsPage({ page, pageSize: 10, category, query, sort: "points" }),
    getStandingsPage({ page: 1, pageSize: 3, category, sort: "points" }),
    getCategories(),
  ]);
  const categoryName =
    category === "geral"
      ? "Geral"
      : categories.find((item) => item.slug === category)?.name ?? category;
  const leaderPoints = leaders.items[0]?.points ?? standings.items[0]?.points ?? 0;
  const hasQuery = Boolean(query);
  const resultCountLabel = `${standings.meta.totalItems} ${
    standings.meta.totalItems === 1 ? "piloto encontrado" : "pilotos encontrados"
  }`;
  const resultsContext = hasQuery
    ? `${categoryName} · ${resultCountLabel} para “${query}”`
    : `${categoryName} · ${resultCountLabel} no ranking oficial`;
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
        className="udk-page tg-internal-page tg-standings-page"
      >
        <PageHero
          index="02"
          eyebrow="Pontos oficiais"
          title="Classificação"
          description="A pista decide. O ranking apenas torna visível quem entregou volta após volta."
          compact
          action={{ href: "#ranking", label: "Ir direto ao ranking" }}
        />

        <section className="tg-standings-section" id="ranking">
          <div className="race-container">
            <EditorialHeading
              index="02"
              title="Ranking da temporada."
              description="Pontuação oficial por categoria, atualizada após cada etapa."
            />

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

              <div
                className="tg-official-pdf-links"
                role="group"
                aria-label="PDFs oficiais por corrida"
              >
                <a
                  className="race-button race-button-outline is-light tg-pdf-link"
                  aria-label="Baixar PDF oficial da etapa Endurance"
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
                  aria-label="Baixar PDF oficial da Corrida 1"
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
                  aria-label="Baixar PDF oficial da Corrida 2"
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
              </form>
            </div>

            <aside className="udk-scoring-rule" aria-label="Regra de descartes da temporada">
              <span>Regra 2026</span>
              <strong>Melhores 6 de 8 resultados</strong>
              <p>
                A temporada tem 06 corridas regulares e 02 provas de resistência. Até o 6º evento
                não há descarte; após o 7º, o pior resultado é descartado; após o 8º, os dois
                piores.
              </p>
            </aside>

            <p className="tg-standings-context" aria-live="polite">
              {resultsContext}
            </p>

            {standings.items.length ? (
              <div className="tg-standings-content">
                {!hasQuery && leaders.items.length ? (
                  <>
                    <header className="tg-standing-podium-heading">
                      <span>Em destaque</span>
                      <h3 id="podium-title">Pódio atual</h3>
                      <p>Os três primeiros da classificação {categoryName.toLowerCase()}.</p>
                    </header>
                    <section
                      className="tg-standing-podium"
                      aria-labelledby="podium-title"
                    >
                      {leaders.items.slice(0, 3).map((driver, index) => {
                        const fallback = driverVisual(index);
                        const source = resolveVisualSource(driver.avatarUrl, fallback);
                        const hasPublishedPortrait =
                          Boolean(driver.avatarUrl) && source !== fallback.src;
                        const podiumPosition = index + 1;
                        return (
                          <Link
                            href={`/pilotos/${driver.slug}`}
                            className={`tg-standing-podium-card place-${podiumPosition}`}
                            key={driver.slug}
                          >
                            <span>{String(podiumPosition).padStart(2, "0")}</span>
                            <div
                              className={`tg-standing-podium-visual${hasPublishedPortrait ? "" : " tg-standing-podium-fallback"}`}
                            >
                              {hasPublishedPortrait ? (
                                <Image
                                  src={source}
                                  alt=""
                                  fill
                                  quality={86}
                                  sizes="(max-width: 760px) 100vw, 33vw"
                                />
                              ) : (
                                <DriverPlaceholder name={driver.name} />
                              )}
                            </div>
                            <div>
                              <h4>{driver.name}</h4>
                              <p>{driver.category}</p>
                            </div>
                            <b>
                              {formatPoints(driver.points)}
                              <small>pts válidos</small>
                            </b>
                          </Link>
                        );
                      })}
                    </section>
                  </>
                ) : null}

                <div className="tg-standing-table-wrap tg-desktop-standing-table-wrap">
                  <table className="udk-data-table tg-standing-table">
                    <caption className="sr-only">
                      Classificação UDK 2026 com pontuação bruta, descartes e pontos válidos
                    </caption>
                    <thead>
                      <tr>
                        <th scope="col">Ordem</th>
                        <th scope="col">Piloto</th>
                        <th scope="col">Categoria</th>
                        <th scope="col">Vitórias</th>
                        <th scope="col">Pódios</th>
                        <th scope="col">Dif.</th>
                        <th scope="col">Brutos</th>
                        <th scope="col">Descartes</th>
                        <th scope="col">Pontos válidos</th>
                        <th scope="col">
                          <span className="sr-only">Abrir perfil</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {standings.items.map((driver, index) => {
                        const absolutePosition =
                          (standings.meta.page - 1) * standings.meta.pageSize + index + 1;
                        const gap =
                          Math.round(Math.max(0, leaderPoints - driver.points) * 100) / 100;
                        return (
                          <tr key={driver.slug}>
                            <td data-label="Ordem">
                              <span className={`udk-rank rank-${absolutePosition}`}>
                                {absolutePosition}
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
                            <td data-label="Vitórias">{driver.wins}</td>
                            <td data-label="Pódios">{driver.podiums}</td>
                            <td data-label="Diferença">
                              {gap === 0 ? "Líder" : `-${formatPoints(gap)}`}
                            </td>
                            <td data-label="Pontos brutos">{formatPoints(driver.grossPoints)}</td>
                            <td data-label="Pontos descartados">
                              <span className="udk-discarded-points">
                                {driver.discardedPoints > 0
                                  ? `-${formatPoints(driver.discardedPoints)}`
                                  : "—"}
                              </span>
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
                  {standings.items.map((driver, index) => {
                    const absolutePosition =
                      (standings.meta.page - 1) * standings.meta.pageSize + index + 1;
                    const gap = Math.round(Math.max(0, leaderPoints - driver.points) * 100) / 100;
                    return (
                      <li className="tg-mobile-standing-item" key={driver.slug}>
                        <div className="tg-mobile-standing-summary">
                          <span className={`udk-rank rank-${absolutePosition}`}>
                            {absolutePosition}
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
                            <small>válidos</small>
                          </strong>
                        </div>
                        <details>
                          <summary>Ver detalhes</summary>
                          <dl className="tg-mobile-detail-grid">
                            <div>
                              <dt>Diferença</dt>
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
          </div>
        </section>

        <section className="tg-inline-cta is-dark">
          <div className="race-container">
            <Trophy aria-hidden="true" />
            <div>
              <span>Seu nome no ranking</span>
              <h2>Entre no grid e construa a próxima posição.</h2>
            </div>
            <Link href="/inscricao" className="race-button race-button-primary">
              Iniciar inscrição <ArrowRight aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>
    </RaceShell>
  );
}
