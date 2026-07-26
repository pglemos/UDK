import type { Metadata } from "next";
import { PublicLayout } from "../../components/public-layout";
import { PublicPageHero } from "../../components/public-page-hero";
import { getPublicContentBundle } from "../../lib/public-content";

export const metadata: Metadata = {
  title: "Notícias",
  description: "Comunicados e notícias oficiais do UDK.",
  alternates: { canonical: "/noticias" },
};

export default async function NewsPage() {
  const { news } = await getPublicContentBundle();
  return (
    <PublicLayout>
      <main>
        <PublicPageHero title="Notícias" description="Comunicados, inscrições e atualizações oficiais do campeonato." />
        <section className="public-section">
          {news.length ? (
            <div className="public-content-list">
              {news.map((item) => (
                <article key={item.slug}>
                  {item.publishedAt ? <span className="public-number">{new Date(item.publishedAt).toLocaleDateString("pt-BR")}</span> : null}
                  <h2>{item.title}</h2>
                  <p>{item.summary}</p>
                </article>
              ))}
            </div>
          ) : (
            <div className="public-empty">
              <h2>Nenhuma notícia publicada</h2>
              <p>Os comunicados oficiais aparecerão aqui após a publicação no CMS.</p>
            </div>
          )}
        </section>
      </main>
    </PublicLayout>
  );
}
