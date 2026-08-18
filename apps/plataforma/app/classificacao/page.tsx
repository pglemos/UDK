import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronRight, Trophy } from "lucide-react";
import { EditorialEmpty, EditorialHeading } from "../../components/race/editorial-primitives";
import { RaceShell } from "../../components/race/race-shell";
import { PageHero, RacePagination, SearchField } from "../../components/race/ui";
import { getCategories, getStandingsPage, parsePositiveInt } from "../../lib/public-data";
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
  const query = param(params.q);
  const [standings, leaders, categories] = await Promise.all([
    getStandingsPage({ page, pageSize: 10, category, query, sort: "points" }),
    getStandingsPage({ page: 1, pageSize: 3, category, sort: "points" }),
    getCategories(),
  ]);
  const leaderPoints = leaders.items[0]?.points ?? 0;

  return (
    <RaceShell>
      <main id="conteudo" className="udk-page tg-internal-page">
        <PageHero
          index="02"
          eyebrow="Pontos oficiais"
          title="Classificação"
          description="A pista decide. O ranking apenas torna visível quem entregou volta após volta."
        />

        <section className="tg-standings-section">
          <div className="race-container">
            <EditorialHeading
              index="02"
              title="O topo é consequência, não promessa."
              description="Classificação oficial da temporada, organizada por categoria e atualizada a partir da base do campeonato."
            />

            <aside className="udk-scoring-rule" aria-label="Regra de descartes da temporada">
              <span>Regra 2026</span>
              <strong>Melhores 6 de 8 resultados</strong>
              <p>
                São 06 corridas regulares e 02 Endurances. Ao final, os 02 piores resultados são
                descartados automaticamente.
              </p>
            </aside>

            <div
              className="udk-category-tabs tg-category-tabs"
              role="navigation"
              aria-label="Categorias"
            >
              <Link
                className={category === "geral" ? "is-active" : ""}
                href="/classificacao?categoria=geral"
              >
                Geral
              </Link>
              {categories.map((item) => (
                <Link
                  className={category === item.slug ? "is-active" : ""}
                  href={`/classificacao?categoria=${item.slug}`}
                  key={item.slug}
                >
                  {item.name}
                </Link>
              ))}
            </div>

            <form className="udk-toolbar tg-toolbar is-compact" action="/classificacao">
              <SearchField defaultValue={query} placeholder="Buscar piloto" />
              <input type="hidden" name="categoria" value={category} />
              <button type="submit" className="race-button race-button-primary">
                Buscar
              </button>
            </form>

            {standings.items.length ? (
              <>
                {leaders.items.length ? (
                  <section className="tg-standing-podium" aria-label="Pódio da classificação">
                    {leaders.items.slice(0, 3).map((driver, index) => {
                      const fallback = driverVisual(index);
                      const source = resolveVisualSource(driver.avatarUrl, fallback);
                      const hasPublishedPortrait =
                        Boolean(driver.avatarUrl) && source !== fallback.src;
                      const podiumPosition = driver.position ?? index + 1;
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
                              <>
                                <Image
                                  className="driver-fallback-photo"
                                  src={fallback.src}
                                  alt=""
                                  fill
                                  quality={84}
                                  sizes="(max-width: 760px) 100vw, 33vw"
                                  style={{ objectPosition: fallback.position }}
                                />
                                <span className="driver-fallback-shade" aria-hidden="true" />
                                {driver.number !== null ? <strong>#{driver.number}</strong> : null}
                              </>
                            )}
                          </div>
                          <div>
                            <h2>{driver.name}</h2>
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
                ) : null}

                <div className="tg-standing-table-wrap">
                  <table className="udk-data-table tg-standing-table">
                    <caption className="sr-only">
                      Classificação UDK 2026 com pontuação bruta, descartes e pontos válidos
                    </caption>
                    <thead>
                      <tr>
                        <th>Pos.</th>
                        <th>Piloto</th>
                        <th>Categoria</th>
                        <th>Vitórias</th>
                        <th>Pódios</th>
                        <th>Dif.</th>
                        <th>Brutos</th>
                        <th>Descartes</th>
                        <th>Pontos válidos</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {standings.items.map((driver, index) => {
                        const absolutePosition =
                          (standings.meta.page - 1) * standings.meta.pageSize + index + 1;
                        const officialPosition = driver.position ?? absolutePosition;
                        const gap =
                          Math.round(Math.max(0, leaderPoints - driver.points) * 100) / 100;
                        return (
                          <tr key={driver.slug}>
                            <td data-label="Posição">
                              <span className={`udk-rank rank-${officialPosition}`}>
                                {officialPosition}
                              </span>
                            </td>
                            <td data-label="Piloto">
                              <Link className="udk-driver-cell" href={`/pilotos/${driver.slug}`}>
                                {driver.number !== null ? (
                                  <span className="udk-driver-avatar">#{driver.number}</span>
                                ) : null}
                                <strong>{driver.name}</strong>
                              </Link>
                            </td>
                            <td data-label="Categoria">{driver.category}</td>
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
              </>
            ) : (
              <EditorialEmpty
                index="02"
                title="Nenhum piloto encontrado nesta leitura."
                description="Ajuste a categoria ou a busca para voltar ao ranking oficial."
                action={{ href: "/classificacao", label: "Ver classificação geral" }}
              />
            )}

            <RacePagination
              meta={standings.meta}
              basePath="/classificacao"
              params={{ categoria: category, q: query || undefined, page: String(page) }}
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
