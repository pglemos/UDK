import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Download, Users } from "lucide-react";
import {
  DriverPoster,
  EditorialEmpty,
  EditorialHeading,
} from "../../components/race/editorial-primitives";
import { RaceShell } from "../../components/race/race-shell";
import { PageHero, RacePagination, SearchField } from "../../components/race/ui";
import { getCategories, getDriversPage, parsePositiveInt } from "../../lib/public-data";
import { officialResultPdf } from "../../lib/official-result-links";

export const metadata: Metadata = {
  title: "Pilotos",
  description: "Pilotos da temporada UDK 2026.",
  alternates: { canonical: "/pilotos" },
};

function param(value: string | string[] | undefined, fallback = ""): string {
  return Array.isArray(value) ? (value[0] ?? fallback) : (value ?? fallback);
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
    getDriversPage({ page, pageSize: 12, category, query, sort }),
    getCategories(),
  ]);

  return (
    <RaceShell>
      <main id="conteudo" className="udk-page tg-internal-page">
        <PageHero
          index="04"
          eyebrow="Quem constrói o grid"
          title="Pilotos"
          description="Antes da pista, pessoas. Quando a luz apaga, competidores."
        />

        <section className="tg-drivers-directory">
          <div className="race-container">
            <EditorialHeading
              index="04"
              title="Cada piloto carrega uma história diferente."
              description="Busque pilotos, filtre categorias e acompanhe a evolução de quem está na temporada."
            />

            <div className="tg-official-pdf-links" aria-label="PDFs oficiais da primeira etapa">
              <a
                className="race-button race-button-outline is-light"
                href={officialResultPdf.insanos}
                download
              >
                Resultado Insanos <Download aria-hidden="true" />
              </a>
              <a
                className="race-button race-button-outline is-light"
                href={officialResultPdf.rapidos}
                download
              >
                Resultado Rápidos <Download aria-hidden="true" />
              </a>
            </div>

            <form className="udk-toolbar tg-toolbar" action="/pilotos">
              <SearchField defaultValue={query} placeholder="Buscar piloto" />
              <select name="categoria" defaultValue={category} aria-label="Categoria">
                <option value="geral">Todas as categorias</option>
                {categories.map((item) => (
                  <option value={item.slug} key={item.slug}>
                    {item.name}
                  </option>
                ))}
              </select>
              <select name="ordem" defaultValue={order} aria-label="Ordenação">
                <option value="points">Mais pontos</option>
                <option value="position">Classificação</option>
                <option value="name">Nome</option>
              </select>
              <button className="race-button race-button-primary" type="submit">
                Aplicar
              </button>
            </form>

            {drivers.items.length ? (
              <section className="tg-driver-directory-grid" aria-label="Pilotos">
                {drivers.items.map((driver, index) => (
                  <DriverPoster driver={driver} index={index} key={driver.slug} />
                ))}
              </section>
            ) : (
              <EditorialEmpty
                index="04"
                title="Nenhum piloto corresponde à busca."
                description="Ajuste o nome, categoria ou ordenação para voltar ao grid publicado."
                action={{ href: "/pilotos", label: "Ver todos os pilotos" }}
              />
            )}

            <RacePagination
              meta={drivers.meta}
              basePath="/pilotos"
              params={{
                categoria: category,
                ordem: order,
                q: query || undefined,
                page: String(page),
              }}
            />
          </div>
        </section>

        <section className="tg-inline-cta is-dark">
          <div className="race-container">
            <Users aria-hidden="true" />
            <div>
              <span>O próximo perfil</span>
              <h2>Seu nome também pode ocupar este grid.</h2>
            </div>
            <Link href="/inscricao" className="race-button race-button-primary">
              Entrar no campeonato <ArrowRight aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>
    </RaceShell>
  );
}
