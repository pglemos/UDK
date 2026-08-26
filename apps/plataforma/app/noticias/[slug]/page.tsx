import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { RaceShell } from "../../../components/race/race-shell";
import { getNewsBySlug, getNewsPage } from "../../../lib/public-content";
import { premiumVisuals } from "../../../lib/visual-assets";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const item = await getNewsBySlug(slug);
  // Ver comentário equivalente em pilotos/[slug]: sem isto a resposta sai 200.
  if (!item) notFound();
  return {
    title: item.title,
    description: item.summary,
    alternates: { canonical: `/noticias/${item.slug}` },
    openGraph: {
      type: "article",
      title: item.title,
      description: item.summary,
      publishedTime: item.publishedAt || undefined,
      images: [item.coverImageUrl ?? premiumVisuals.news.src],
    },
  };
}

function paragraphs(content: string, summary: string): string[] {
  const source = content.trim() || summary.trim();
  return source.split(/\n{2,}/).map((item) => item.trim()).filter(Boolean);
}

export default async function NewsArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [item, relatedPage] = await Promise.all([getNewsBySlug(slug), getNewsPage({ pageSize: 4 })]);
  if (!item) notFound();

  const body = paragraphs(item.content, item.summary);
  const related = relatedPage.items.filter((news) => news.slug !== item.slug).slice(0, 3);
  const coverSource = item.coverImageUrl ?? premiumVisuals.news.src;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: item.title,
    description: item.summary,
    datePublished: item.publishedAt || undefined,
    image: coverSource,
    publisher: { "@type": "SportsOrganization", name: "Ultras do Kart" },
  };

  return (
    <RaceShell>
      <main id="conteudo" tabIndex={-1} className="tg-article-page">
        <article className="tg-article">
          <header className="tg-article-header">
            <div className="race-container">
              <Link className="tg-arrow-link" href="/noticias"><ArrowLeft aria-hidden="true" /> Voltar às notícias</Link>
              <div className="tg-article-meta">
                <span>{item.category}</span>
                <time>{item.publishedAt ? new Date(item.publishedAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }) : "Publicação oficial"}</time>
                <span>{item.readingMinutes} min de leitura</span>
              </div>
              <h1>{item.title}</h1>
              <p>{item.summary}</p>
            </div>
          </header>

          <div className="tg-article-cover">
            <Image
              src={coverSource}
              alt={`Capa da notícia: ${item.title}`}
              fill
              priority
              quality={90}
              sizes="100vw"
              style={{ objectPosition: premiumVisuals.news.position }}
            />
          </div>

          <div className="race-container tg-article-body">
            <aside><span>UDK / 2026</span><b>Conteúdo oficial do campeonato.</b></aside>
            <div>{body.map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>
          </div>
        </article>

        {related.length ? (
          <section className="tg-related-news">
            <div className="race-container">
              <span>Continue no paddock</span>
              <h2>Outras histórias da temporada.</h2>
              <div>
                {related.map((news) => (
                  <Link href={`/noticias/${news.slug}`} key={news.slug}>
                    <span>{news.category}</span>
                    <h3>{news.title}</h3>
                    <p>{news.summary}</p>
                    <b className="tg-arrow-link">Ler notícia <ArrowRight aria-hidden="true" /></b>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      </main>
    </RaceShell>
  );
}
