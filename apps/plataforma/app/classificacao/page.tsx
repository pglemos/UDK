import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronRight, Trophy } from "lucide-react";
import { EditorialEmpty, EditorialHeading } from "../../components/race/editorial-primitives";
import { RaceShell } from "../../components/race/race-shell";
import { PageHero, RacePagination, SearchField } from "../../components/race/ui";
import { getCategories, getStandingsPage, parsePositiveInt } from "../../lib/public-data";
import { driverVisual } from "../../lib/visual-assets";

export const metadata: Metadata = {
  title: "Classificação",
  description: "Classificação oficial da temporada UDK 2026.",
  alternates: { canonical: "/classificacao" },
};

function param(value: string | string[] | undefined, fallback = ""): string {
  return Array.isArray(value) ? value[0] ?? fallback : value ?? fallback;
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
  const [standings, categories] = await Promise.all([
    getStandingsPage({ page, pageSize: 10, category, query, sort: "points" }),
    getCategories(),
  ]);
  const leaderPoints = standings.items[0]?.points ?? 0;

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

            <div className="udk-category-tabs tg-category-tabs" role="navigation" aria-label="Categorias">
              <Link className={category === "geral" ? "is-active" : ""} href="/classificacao?categoria=geral">Geral</Link>
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
              <button type="submit" className="race-button race-button-primary">Buscar</button>
            </form>

            {standings.items.length ? (
              <>
                <section className="tg-standing-podium" aria-label="Pódio da classificação">
                  {standings.items.slice(0, 3).map((driver, index) => {
                    const fallback = driverVisual(index);
                    return (
                      <Link href={`/pilotos/${driver.slug}`} className={`tg-standing-podium-card place-${index + 1}`} key={driver.slug}>
                        <span>{String(index + 1).padStart(2, "0")}</span>
                        <div className={`tg-standing-podium-visual${driver.avatarUrl ? "" : " tg-standing-podium-fallback"}`}>
                          {driver.avatarUrl ? (
                            <Image
                              src={driver.avatarUrl}
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
                              <strong>#{driver.number}</strong>
                            </>
                          )}
                        </div>
                        <div><h2>{driver.name}</h2><p>{driver.category}</p></div>
                        <b>{driver.points}<small>pts</small></b>
                      </Link>
                    );
                  })}
                </section>

                <div className="tg-standing-table-wrap">
                  <table className="udk-data-table tg-standing-table">
                    <caption className="sr-only">Classificação UDK 2026</caption>
                    <thead>
                      <tr><th>Pos.</th><th>Piloto</th><th>Categoria</th><th>Vitórias</th><th>Pódios</th><th>Dif.</th><th>Pontos</th><th /></tr>
                    </thead>
                    <tbody>
                      {standings.items.map((driver, index) => (
                        <tr key={driver.slug}>
                          <td data-label="Posição"><span className={`udk-rank rank-${index + 1}`}>{(standings.meta.page - 1) * standings.meta.pageSize + index + 1}</span></td>
                          <td data-label="Piloto"><Link className="udk-driver-cell" href={`/pilotos/${driver.slug}`}><span className="udk-driver-avatar">#{driver.number}</span><strong>{driver.name}</strong></Link></td>
                          <td data-label="Categoria">{driver.category}</td>
                          <td data-label="Vitórias">{driver.wins}</td>
                          <td data-label="Pódios">{driver.podiums}</td>
                          <td data-label="Diferença">{index === 0 ? "Líder" : `-${leaderPoints - driver.points}`}</td>
                          <td data-label="Pontos"><strong className="udk-points">{driver.points}</strong></td>
                          <td><Link href={`/pilotos/${driver.slug}`} aria-label={`Abrir ${driver.name}`}><ChevronRight aria-hidden="true" /></Link></td>
                        </tr>
                      ))}
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

            <RacePagination meta={standings.meta} basePath="/classificacao" params={{ categoria: category, q: query || undefined, page: String(page) }} />
          </div>
        </section>

        <section className="tg-inline-cta is-dark">
          <div className="race-container">
            <Trophy aria-hidden="true" />
            <div><span>Seu nome no ranking</span><h2>Entre no grid e construa a próxima posição.</h2></div>
            <Link href="/inscricao" className="race-button race-button-primary">Iniciar inscrição <ArrowRight aria-hidden="true" /></Link>
          </div>
        </section>
      </main>
    </RaceShell>
  );
}
