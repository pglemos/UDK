import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { Reveal } from "../../components/race/motion";
import { RaceShell } from "../../components/race/race-shell";
import {
  DriverVisual,
  EmptyState,
  PageHero,
  RacePagination,
  SearchField,
} from "../../components/race/ui";
import {
  getCategories,
  getStandingsPage,
  parsePositiveInt,
  positionDelta,
} from "../../lib/public-data";

export const metadata: Metadata = {
  title: "Classificação",
  description: "Classificação oficial, pontos, vitórias, pódios e evolução dos pilotos UDK.",
  alternates: { canonical: "/classificacao" },
};

function param(value: string | string[] | undefined, fallback = ""): string {
  return Array.isArray(value) ? value[0] ?? fallback : value ?? fallback;
}

function Delta({ value }: { value: number | null }) {
  if (value == null || value === 0) {
    return <span className="race-delta"><Minus aria-hidden="true" size={13} /> estável</span>;
  }

  if (value > 0) {
    return <span className="race-delta is-up"><ArrowUp aria-hidden="true" size={13} /> +{value}</span>;
  }

  return <span className="race-delta is-down"><ArrowDown aria-hidden="true" size={13} /> {value}</span>;
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
  const sortParam = param(params.ordem, "position");
  const sort = sortParam === "points" || sortParam === "name" ? sortParam : "position";

  const [standings, podium, categories] = await Promise.all([
    getStandingsPage({ page, pageSize: 20, category, query, sort }),
    getStandingsPage({ page: 1, pageSize: 3, category, sort: "position" }),
    getCategories(),
  ]);

  const totalWins = standings.items.reduce((sum, driver) => sum + driver.wins, 0);
  const totalPodiums = standings.items.reduce((sum, driver) => sum + driver.podiums, 0);
  const biggestRise = standings.items.reduce((best, driver) => {
    const delta = positionDelta(driver) ?? 0;
    return delta > best ? delta : best;
  }, 0);

  return (
    <RaceShell>
      <main id="conteudo">
        <PageHero
          eyebrow="Campeonato UDK 2026"
          title="Classificação"
          description="Pontos, vitórias, pódios e mudança de posição apresentados com a hierarquia de uma classificação oficial."
        />

        <section className="race-section is-tight">
          <div className="race-container">
            <form className="race-filter-bar" action="/classificacao">
              <SearchField defaultValue={query} placeholder="Buscar piloto" />
              <select name="categoria" defaultValue={category} aria-label="Categoria">
                <option value="geral">Classificação geral</option>
                {categories.map((item) => (
                  <option value={item.slug} key={item.slug}>{item.name}</option>
                ))}
              </select>
              <select name="ordem" defaultValue={sort} aria-label="Ordenação">
                <option value="position">Posição</option>
                <option value="points">Mais pontos</option>
                <option value="name">Nome</option>
              </select>
              <select name="temporada" defaultValue="2026" aria-label="Temporada">
                <option value="2026">Temporada 2026</option>
              </select>
              <button className="race-button race-button-primary" type="submit">Aplicar</button>
            </form>
          </div>
        </section>

        {podium.items.length ? (
          <section className="race-section is-tight">
            <div className="race-container">
              <div className="race-stats">
                <div className="race-stat">
                  <strong>{standings.meta.totalItems}</strong>
                  <span>Pilotos classificados</span>
                </div>
                <div className="race-stat">
                  <strong>{totalWins}</strong>
                  <span>Vitórias na página</span>
                </div>
                <div className="race-stat">
                  <strong>{totalPodiums}</strong>
                  <span>Pódios na página</span>
                </div>
                <div className="race-stat">
                  <strong>+{biggestRise}</strong>
                  <span>Maior escalada</span>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        <section className="race-section">
          <div className="race-container">
            {podium.items.length ? (
              <>
                <div className="race-section-heading">
                  <div>
                    <span className="race-kicker">Top 3</span>
                    <h2>Os líderes do grid</h2>
                  </div>
                </div>
                <div className="race-podium">
                  {podium.items.map((driver, index) => {
                    const place = index + 1;
                    return (
                      <Reveal key={driver.slug} delay={index * 80}>
                        <Link
                          className={`race-podium-card is-${place === 1 ? "first" : place === 2 ? "second" : "third"}`}
                          href={`/pilotos/${driver.slug}`}
                        >
                          <div className="race-podium-place">
                            <strong>0{place}</strong>
                            <DriverVisual driver={driver} />
                          </div>
                          <h3>{driver.name}</h3>
                          <p>#{driver.number} • {driver.category}</p>
                          <div className="race-podium-points">
                            <div>
                              <strong>{driver.points} pts</strong>
                              <span>{driver.wins} vitórias</span>
                            </div>
                            <Delta value={positionDelta(driver)} />
                          </div>
                        </Link>
                      </Reveal>
                    );
                  })}
                </div>
              </>
            ) : (
              <EmptyState
                title="Classificação aguardando publicação"
                description="Os pontos aparecerão após a organização publicar a primeira versão oficial."
              />
            )}
          </div>
        </section>

        {standings.items.length ? (
          <section className="race-section is-panel">
            <div className="race-container">
              <div className="race-section-heading">
                <div>
                  <span className="race-kicker">Tabela oficial</span>
                  <h2>Posição por posição</h2>
                </div>
              </div>

              <div className="race-table-wrap">
                <table className="race-table">
                  <caption>
                    Classificação UDK 2026, página {standings.meta.page} de {standings.meta.totalPages}.
                  </caption>
                  <thead>
                    <tr>
                      <th>Pos.</th>
                      <th>Delta</th>
                      <th>Piloto</th>
                      <th>Categoria</th>
                      <th>Vitórias</th>
                      <th>Pódios</th>
                      <th>Poles</th>
                      <th>Pontos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.items.map((driver) => {
                      const position = driver.position ?? 0;
                      return (
                        <tr key={driver.slug}>
                          <td className={`race-position${position <= 3 ? ` is-p${position}` : ""}`}>
                            {String(position || "—").padStart(2, "0")}
                          </td>
                          <td><Delta value={positionDelta(driver)} /></td>
                          <td>
                            <Link className="race-driver-cell" href={`/pilotos/${driver.slug}`}>
                              <DriverVisual driver={driver} />
                              <span>
                                <b>{driver.name}</b>
                                <small>#{driver.number}{driver.teamName ? ` • ${driver.teamName}` : ""}</small>
                              </span>
                            </Link>
                          </td>
                          <td>{driver.category}</td>
                          <td>{driver.wins}</td>
                          <td>{driver.podiums}</td>
                          <td>{driver.poles}</td>
                          <td className="race-points">{driver.points}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="race-standings-mobile">
                {standings.items.map((driver) => {
                  const position = driver.position ?? 0;
                  return (
                    <Link className="race-standing-card" href={`/pilotos/${driver.slug}`} key={driver.slug}>
                      <span className={`race-position${position <= 3 ? ` is-p${position}` : ""}`}>
                        {String(position || "—").padStart(2, "0")}
                      </span>
                      <div>
                        <h3>#{driver.number} {driver.name}</h3>
                        <p>{driver.category} • {driver.wins} vitórias • {driver.podiums} pódios</p>
                        <Delta value={positionDelta(driver)} />
                      </div>
                      <strong className="race-points">{driver.points}<small> pts</small></strong>
                    </Link>
                  );
                })}
              </div>

              <RacePagination
                meta={standings.meta}
                basePath="/classificacao"
                params={{
                  categoria: category,
                  q: query || undefined,
                  ordem: sort,
                  page: String(page),
                }}
              />
            </div>
          </section>
        ) : null}

        <section className="race-section">
          <div className="race-container">
            <div className="race-cta">
              <span className="race-kicker">Pontuação</span>
              <h2>Entenda cada ponto.</h2>
              <p>Consulte descartes, critérios de desempate, penalidades e regras da temporada.</p>
              <Link className="race-button race-button-primary" href="/regulamento#pontuacao">
                Ver regulamento
              </Link>
            </div>
          </div>
        </section>
      </main>
    </RaceShell>
  );
}
