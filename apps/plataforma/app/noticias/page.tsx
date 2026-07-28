import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { EditorialEmpty, EditorialHeading } from "../../components/race/editorial-primitives";
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
  const news = await getNewsPage({ page, pageSize: 7, query });
  const featured = news.items[0];
  const list = news.items.slice(1);

  return (
    <RaceShell>
      <main id="conteudo" className="udk-page tg-internal-page">
        <PageHero
          index="05"
          eyebrow="Do paddock para o público"
          title="Notícias"
          description="Comunicados, bastidores e histórias oficiais de quem vive a temporada."
        />

        <section className="tg-news-directory">
          <div className="race-container">
            <EditorialHeading
              index="05"
              title="A temporada também acontece fora da pista."
              description="Busque comunicados e conteúdos publicados pela organização."
            />

            <form className="udk-toolbar tg-toolbar is-compact" action="/noticias">
              <SearchField defaultValue={query} placeholder="Buscar notícia" />
              <button className="race-button race-button-primary" type="submit">Buscar</button>
            </form>

            {featured ? (
              <>
                <section className="tg-news-directory-feature">
                  <Link href={`/noticias/${featured.slug}`}>
                    <div className="tg-news-directory-media"><img src={featured.coverImageUrl ?? "/media/udk-race-hero.webp"} alt="" fetchPriority="high" /></div>
                    <div>
                      <span>{featured.category}</span>
                      <h2>{featured.title}</h2>
                      <p>{featured.summary}</p>
                      <time>{new Date(featured.publishedAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</time>
                      <b className="tg-arrow-link">Ler matéria <ArrowRight aria-hidden="true" /></b>
                    </div>
                  </Link>
                </section>

                <section className="tg-news-directory-grid">
                  {list.map((item, index) => (
                    <Link href={`/noticias/${item.slug}`} key={item.slug} className={index === 0 ? "is-wide" : ""}>
                      <div><img src={item.coverImageUrl ?? "/media/udk-race-hero.webp"} alt="" loading="lazy" /></div>
                      <span>{item.category}</span>
                      <h3>{item.title}</h3>
                      <p>{item.summary}</p>
                      <time>{new Date(item.publishedAt).toLocaleDateString("pt-BR")}</time>
                    </Link>
                  ))}
                </section>
              </>
            ) : (
              <EditorialEmpty
                index="05"
                title="Nenhuma notícia oficial publicada."
                description="O espaço editorial está pronto. Comunicados e bastidores aparecerão quando forem publicados pela organização, sem matérias fictícias para decorar a página."
                action={{ href: "/calendario", label: "Acompanhar a temporada" }}
              />
            )}

            <RacePagination meta={news.meta} basePath="/noticias" params={{ q: query || undefined, page: String(page) }} />
          </div>
        </section>
      </main>
    </RaceShell>
  );
}
