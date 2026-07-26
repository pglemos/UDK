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
import { getNewsPage } from "../../lib/public-content";
import { parsePositiveInt } from "../../lib/public-data";

export const metadata: Metadata = {
  title: "Notícias",
  description: "Notícias, comunicados, bastidores e atualizações oficiais do UDK.",
  alternates: { canonical: "/noticias" },
};

function param(value: string | string[] | undefined, fallback = ""): string {
  return Array.isArray(value) ? value[0] ?? fallback : value ?? fallback;
}

export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const page = parsePositiveInt(params.page, 1, 500);
  const category = param(params.categoria, "todas");
  const query = param(params.q);
  const news = await getNewsPage({ page, pageSize: 9, category, query });
  const featured = news.items[0] ?? null;
  const grid = featured ? news.items.slice(1) : [];

  return (
    <RaceShell>
      <main id="conteudo">
        <PageHero
          eyebrow="Direto do paddock"
          title="Notícias"
          description="Comunicados oficiais, bastidores, alterações e histórias que movimentam a temporada."
        />

        <section className="race-section is-tight">
          <div className="race-container">
            <form className="race-filter-bar" action="/noticias">
              <SearchField defaultValue={query} placeholder="Buscar notícia" />
              <select name="categoria" defaultValue={category} aria-label="Categoria">
                <option value="todas">Todas as categorias</option>
                <option value="Comunicado">Comunicados</option>
                <option value="Resultados">Resultados</option>
                <option value="Bastidores">Bastidores</option>
                <option value="Regulamento">Regulamento</option>
              </select>
              <select name="temporada" defaultValue="2026" aria-label="Temporada">
                <option value="2026">Temporada 2026</option>
              </select>
              <select name="ordem" defaultValue="recentes" aria-label="Ordenação">
                <option value="recentes">Mais recentes</option>
              </select>
              <button className="race-button race-button-primary" type="submit">Aplicar</button>
            </form>
          </div>
        </section>

        <section className="race-section is-tight">
          <div className="race-container">
            {featured ? (
              <>
                <Reveal>
                  <Link className="race-news-feature" href={`/noticias/${featured.slug}`}>
                    <div
                      className="race-news-feature-media"
                      style={featured.coverImageUrl ? { backgroundImage: `linear-gradient(0deg, rgba(8,9,11,.58), transparent 60%), url("${featured.coverImageUrl}")` } : undefined}
                      aria-hidden="true"
                    />
                    <div className="race-news-feature-copy">
                      <div className="race-news-meta">
                        <span>{featured.category}</span>
                        <span>
                          {featured.publishedAt
                            ? new Date(featured.publishedAt).toLocaleDateString("pt-BR")
                            : "Publicação oficial"}
                        </span>
                        <span>{featured.readingMinutes} min</span>
                      </div>
                      <span className="race-kicker">Destaque</span>
                      <h2>{featured.title}</h2>
                      <p>{featured.summary}</p>
                      <span className="race-text-link">
                        Ler notícia <ArrowRight aria-hidden="true" />
                      </span>
                    </div>
                  </Link>
                </Reveal>

                {grid.length ? (
                  <div className="race-grid" style={{ marginTop: 18 }}>
                    {grid.map((item, index) => (
                      <Reveal key={item.slug} delay={(index % 3) * 70}>
                        <Link className="race-news-card" href={`/noticias/${item.slug}`}>
                          <div
                            className="race-news-card-media"
                            style={item.coverImageUrl ? { backgroundImage: `linear-gradient(0deg, var(--race-panel), transparent 65%), url("${item.coverImageUrl}")` } : undefined}
                            aria-hidden="true"
                          />
                          <div className="race-news-meta">
                            <span>{item.category}</span>
                            <span>{item.readingMinutes} min</span>
                          </div>
                          <h3>{item.title}</h3>
                          <p>{item.summary}</p>
                        </Link>
                      </Reveal>
                    ))}
                  </div>
                ) : null}

                <RacePagination
                  meta={news.meta}
                  basePath="/noticias"
                  params={{
                    categoria: category,
                    q: query || undefined,
                    page: String(page),
                  }}
                />
              </>
            ) : (
              <EmptyState
                title="Nenhuma notícia publicada"
                description="Os comunicados aparecerão aqui quando forem publicados no CMS oficial."
                action={{ href: "https://www.instagram.com/ultrasdokart", label: "Acompanhar Instagram" }}
              />
            )}
          </div>
        </section>
      </main>
    </RaceShell>
  );
}
