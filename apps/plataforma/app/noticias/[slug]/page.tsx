import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { RaceShell } from "../../../components/race/race-shell";
import { getNewsBySlug, getNewsPage } from "../../../lib/public-content";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const item = await getNewsBySlug(slug);

  if (!item) return { title: "Notícia não encontrada" };

  return {
    title: item.title,
    description: item.summary,
    alternates: { canonical: `/noticias/${item.slug}` },
    openGraph: {
      type: "article",
      title: item.title,
      description: item.summary,
      publishedTime: item.publishedAt || undefined,
      images: item.coverImageUrl ? [item.coverImageUrl] : [],
    },
  };
}

function paragraphs(content: string, summary: string): string[] {
  const source = content.trim() || summary.trim();
  return source.split(/\n{2,}/).map((item) => item.trim()).filter(Boolean);
}

export default async function NewsArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [item, relatedPage] = await Promise.all([
    getNewsBySlug(slug),
    getNewsPage({ pageSize: 4 }),
  ]);

  if (!item) notFound();

  const body = paragraphs(item.content, item.summary);
  const related = relatedPage.items.filter((news) => news.slug !== item.slug).slice(0, 3);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: item.title,
    description: item.summary,
    datePublished: item.publishedAt || undefined,
    image: item.coverImageUrl || undefined,
    publisher: {
      "@type": "SportsOrganization",
      name: "Ultras do Kart",
    },
  };

  return (
    <RaceShell>
      <main id="conteudo">
        <section className="race-section" style={{ paddingTop: 140 }}>
          <article className="race-container race-article">
            <Link className="race-text-link" href="/noticias">
              <ArrowLeft aria-hidden="true" /> Voltar às notícias
            </Link>
            <header className="race-article-head">
              <div className="race-news-meta" style={{ marginTop: 30 }}>
                <span>{item.category}</span>
                <span>
                  {item.publishedAt
                    ? new Date(item.publishedAt).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })
                    : "Publicação oficial"}
                </span>
                <span>{item.readingMinutes} min de leitura</span>
              </div>
              <h1>{item.title}</h1>
              <p>{item.summary}</p>
            </header>

            <div className="race-article-cover">
              <img
                src={item.coverImageUrl ?? "/media/udk-race-hero.webp"}
                alt=""
                fetchPriority="high"
              />
            </div>

            <div className="race-article-body">
              {body.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </article>
        </section>

        {related.length ? (
          <section className="race-section is-panel">
            <div className="race-container">
              <div className="race-section-heading">
                <div>
                  <span className="race-kicker">Continue no paddock</span>
                  <h2>Notícias relacionadas</h2>
                </div>
              </div>
              <div className="race-grid">
                {related.map((news) => (
                  <Link className="race-news-card" href={`/noticias/${news.slug}`} key={news.slug}>
                    <div className="race-news-meta">
                      <span>{news.category}</span>
                      <span>{news.readingMinutes} min</span>
                    </div>
                    <h3>{news.title}</h3>
                    <p>{news.summary}</p>
                    <span className="race-text-link">
                      Ler notícia <ArrowRight aria-hidden="true" />
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </main>
    </RaceShell>
  );
}
