import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { RaceShell } from "../../components/race/race-shell";
import { PageHero, RacePagination, SearchField } from "../../components/race/ui";
import { getCategories, getStandingsPage, parsePositiveInt } from "../../lib/public-data";

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

  return (
    <RaceShell>
      <main id="conteudo" className="udk-page">
        <PageHero title="Classificação" description="Campeonato 2026" />
        <div className="race-container udk-page-body">
          <div className="udk-category-tabs" role="navigation" aria-label="Categorias">
            <Link className={category === "geral" ? "is-active" : ""} href="/classificacao?categoria=geral">Geral</Link>
            {categories.map((item) => (
              <Link
                className={category === item.slug ? "is-active" : ""}
                href={`/classificacao?categoria=${item.slug}`}
                key={item.slug}
              >
                {item.name.replace("Ultras ", "")}
              </Link>
            ))}
          </div>

          <form className="udk-toolbar is-compact" action="/classificacao">
            <SearchField defaultValue={query} placeholder="Buscar piloto" />
            <input type="hidden" name="categoria" value={category} />
            <button type="submit" className="udk-btn udk-btn-primary">Buscar</button>
          </form>

          <div className="udk-data-table-wrap">
            <table className="udk-data-table">
              <caption className="sr-only">Classificação UDK 2026</caption>
              <thead>
                <tr>
                  <th>Pos.</th>
                  <th>Piloto</th>
                  <th>Categoria</th>
                  <th>Vitórias</th>
                  <th>Pódios</th>
                  <th>Pontos</th>
                  <th aria-label="Abrir piloto" />
                </tr>
              </thead>
              <tbody>
                {standings.items.map((driver, index) => (
                  <tr key={driver.slug}>
                    <td><span className={`udk-rank rank-${index + 1}`}>{(standings.meta.page - 1) * standings.meta.pageSize + index + 1}</span></td>
                    <td>
                      <Link className="udk-driver-cell" href={`/pilotos/${driver.slug}`}>
                        <span className="udk-driver-avatar">#{driver.number}</span>
                        <strong>{driver.name}</strong>
                      </Link>
                    </td>
                    <td>{driver.category}</td>
                    <td>{driver.wins}</td>
                    <td>{driver.podiums}</td>
                    <td><strong className="udk-points">{driver.points}</strong></td>
                    <td><Link href={`/pilotos/${driver.slug}`} aria-label={`Abrir ${driver.name}`}><ChevronRight aria-hidden="true" /></Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <RacePagination
            meta={standings.meta}
            basePath="/classificacao"
            params={{ categoria: category, q: query || undefined, page: String(page) }}
          />
        </div>
      </main>
    </RaceShell>
  );
}
