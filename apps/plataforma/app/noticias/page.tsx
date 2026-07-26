import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { RaceShell } from "../../components/race/race-shell";
import { PageHero, RacePagination, SearchField } from "../../components/race/ui";
import { getNewsPage } from "../../lib/public-content";
import { parsePositiveInt } from "../../lib/public-data";

export const metadata: Metadata = {
  title: "Notícias",
  description: "Notícias e comunicados do UDK.",
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
  const query = param(params.q);
  const news = await getNewsPage({ page, pageSize: 6, query });
  const featured = news.items[0];
  const list = news.items.slice(1);

  return (
    <RaceShell>
      <main id="conteudo" className="udk-page">
        <PageHero title="Notícias" description="Temporada 2026" />
        <div className="race-container udk-page-body">
          <form className="udk-toolbar is-compact" action="/noticias">
            <SearchField defaultValue={query} placeholder="Buscar notícia" />
            <button className="udk-btn udk-btn-primary" type="submit">Buscar</button>
          </form>

          {featured ? (
            <section className="udk-news-feature">
              <Link href={`/noticias/${featured.slug}`} className="udk-news-feature-main">
                <img src={featured.coverImageUrl ?? "/media/udk-race-hero.webp"} alt="" />
                <div>
                  <span>{featured.category}</span>
                  <h2>{featured.title}</h2>
                  <p>{featured.summary}</p>
                  <time>{new Date(featured.publishedAt).toLocaleDateString("pt-BR")}</time>
                </div>
              </Link>
              <div className="udk-news-list">
                {list.map((item) => (
                  <Link href={`/noticias/${item.slug}`} key={item.slug}>
                    <img src={item.coverImageUrl ?? "/media/udk-race-hero.webp"} alt="" loading="lazy" />
                    <div><h3>{item.title}</h3><span>{new Date(item.publishedAt).toLocaleDateString("pt-BR")}</span></div>
                    <ChevronRight aria-hidden="true" />
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          <RacePagination meta={news.meta} basePath="/noticias" params={{ q: query || undefined, page: String(page) }} />
        </div>
      </main>
    </RaceShell>
  );
}
