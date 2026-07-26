import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { RaceShell } from "../../components/race/race-shell";
import { PageHero, RacePagination, SearchField } from "../../components/race/ui";
import { getCategories, getDriversPage, parsePositiveInt } from "../../lib/public-data";

export const metadata: Metadata = {
  title: "Pilotos",
  description: "Pilotos da temporada UDK 2026.",
  alternates: { canonical: "/pilotos" },
};

function param(value: string | string[] | undefined, fallback = ""): string {
  return Array.isArray(value) ? value[0] ?? fallback : value ?? fallback;
}

export default async function DriversPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const page = parsePositiveInt(params.page, 1, 500);
  const category = param(params.categoria, "geral");
  const query = param(params.q);
  const order = param(params.ordem, "points");
  const sort = order === "name" ? "name" : order === "position" ? "position" : "points";
  const [drivers, categories] = await Promise.all([
    getDriversPage({ page, pageSize: 8, category, query, sort }),
    getCategories(),
  ]);

  return (
    <RaceShell>
      <main id="conteudo" className="udk-page">
        <PageHero title="Pilotos" description="Temporada 2026" />
        <div className="race-container udk-page-body">
          <form className="udk-toolbar" action="/pilotos">
            <SearchField defaultValue={query} placeholder="Buscar piloto" />
            <select name="categoria" defaultValue={category} aria-label="Categoria">
              <option value="geral">Todas as categorias</option>
              {categories.map((item) => <option value={item.slug} key={item.slug}>{item.name}</option>)}
            </select>
            <select name="ordem" defaultValue={order} aria-label="Ordenação">
              <option value="points">Mais pontos</option>
              <option value="position">Classificação</option>
              <option value="name">Nome</option>
            </select>
            <button className="udk-btn udk-btn-primary" type="submit">Aplicar</button>
          </form>

          <section className="udk-driver-grid" aria-label="Pilotos">
            {drivers.items.map((driver) => (
              <Link href={`/pilotos/${driver.slug}`} className="udk-driver-card" key={driver.slug}>
                <div className="udk-driver-photo">
                  {driver.avatarUrl ? <img src={driver.avatarUrl} alt="" loading="lazy" /> : <img src="/media/udk-race-hero.webp" alt="" loading="lazy" />}
                  <strong>#{driver.number}</strong>
                </div>
                <div className="udk-driver-card-copy">
                  <h2>{driver.name}</h2>
                  <span>{driver.category}</span>
                  <div><b>{driver.points} pts</b><em>{driver.wins} vitórias</em></div>
                </div>
                <ChevronRight aria-hidden="true" />
              </Link>
            ))}
          </section>

          <RacePagination meta={drivers.meta} basePath="/pilotos" params={{ categoria: category, ordem: order, q: query || undefined, page: String(page) }} />
        </div>
      </main>
    </RaceShell>
  );
}
