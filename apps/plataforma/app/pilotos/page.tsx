import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "../../components/race/motion";
import { RaceShell } from "../../components/race/race-shell";
import {
  EmptyState,
  PageHero,
  RacePagination,
  SearchField,
} from "../../components/race/ui";
import {
  getCategories,
  getDriversPage,
  parsePositiveInt,
} from "../../lib/public-data";

export const metadata: Metadata = {
  title: "Pilotos",
  description: "Conheça os pilotos, números, categorias e desempenho na temporada UDK.",
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
  const orderParam = param(params.ordem, "position");
  const sort = orderParam === "name" || orderParam === "points" ? orderParam : "position";

  const [drivers, categories] = await Promise.all([
    getDriversPage({ page, pageSize: 12, category, query, sort }),
    getCategories(),
  ]);

  return (
    <RaceShell>
      <main id="conteudo">
        <PageHero
          eyebrow="Grid UDK 2026"
          title="Pilotos"
          description="Cada número carrega uma história. Conheça quem disputa posição, tempo e respeito em cada etapa."
        />

        <section className="race-section is-tight">
          <div className="race-container">
            <form className="race-filter-bar" action="/pilotos">
              <SearchField defaultValue={query} placeholder="Buscar piloto ou número" />
              <select name="categoria" defaultValue={category} aria-label="Categoria">
                <option value="geral">Todas as categorias</option>
                {categories.map((item) => (
                  <option value={item.slug} key={item.slug}>{item.name}</option>
                ))}
              </select>
              <select name="ordem" defaultValue={sort} aria-label="Ordenação">
                <option value="position">Classificação</option>
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

        <section className="race-section is-tight">
          <div className="race-container">
            <div className="race-section-heading">
              <div>
                <span className="race-kicker">Grid oficial</span>
                <h2>{drivers.meta.totalItems} pilotos publicados</h2>
              </div>
            </div>

            {drivers.items.length ? (
              <>
                <div className="race-grid is-four">
                  {drivers.items.map((driver, index) => (
                    <Reveal key={driver.slug} delay={(index % 4) * 55}>
                      <Link className="race-driver-card" href={`/pilotos/${driver.slug}`}>
                        <div className="race-driver-card-media">
                          {driver.avatarUrl ? (
                            <img src={driver.avatarUrl} alt="" loading="lazy" />
                          ) : null}
                          <strong>#{driver.number}</strong>
                        </div>
                        <div className="race-driver-card-body">
                          <span className="race-kicker">
                            {driver.position ? `P${driver.position}` : "Piloto UDK"}
                          </span>
                          <h2>{driver.name}</h2>
                          <p>{driver.category}{driver.teamName ? ` • ${driver.teamName}` : ""}</p>
                          <div className="race-driver-card-stats">
                            <div><span>Pontos</span><b>{driver.points}</b></div>
                            <div><span>Vitórias</span><b>{driver.wins}</b></div>
                            <div><span>Pódios</span><b>{driver.podiums}</b></div>
                          </div>
                        </div>
                      </Link>
                    </Reveal>
                  ))}
                </div>

                <RacePagination
                  meta={drivers.meta}
                  basePath="/pilotos"
                  params={{
                    categoria: category,
                    q: query || undefined,
                    ordem: sort,
                    page: String(page),
                  }}
                />
              </>
            ) : (
              <EmptyState
                title="Nenhum piloto encontrado"
                description="Ajuste os filtros ou aguarde a publicação de novos perfis pela organização."
                action={{ href: "/pilotos", label: "Limpar filtros" }}
              />
            )}
          </div>
        </section>

        <section className="race-section is-panel">
          <div className="race-container">
            <div className="race-cta">
              <span className="race-kicker">Quer correr com eles?</span>
              <h2>Seu número pode ser o próximo.</h2>
              <p>Conheça as categorias, leia o regulamento e inicie sua entrada no campeonato.</p>
              <div className="race-hero-actions">
                <Link className="race-button race-button-primary" href="/inscricao">
                  Entrar no grid <ArrowRight aria-hidden="true" />
                </Link>
                <Link className="race-button race-button-ghost" href="/regulamento">
                  Ver regulamento
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </RaceShell>
  );
}
