import type { Metadata } from "next";
import { PublicLayout } from "../../components/public-layout";
import { PublicPageHero } from "../../components/public-page-hero";
import { getPublicContentBundle } from "../../lib/public-content";

export const metadata: Metadata = {
  title: "Patrocinadores",
  description: "Marcas parceiras do campeonato Ultras do Kart.",
  alternates: { canonical: "/patrocinadores" },
};

export default async function SponsorsPage() {
  const { sponsors } = await getPublicContentBundle();
  return (
    <PublicLayout>
      <main>
        <PublicPageHero title="Patrocinadores" description="Marcas que aceleram com o UDK." />
        <section className="public-section">
          {sponsors.length ? (
            <div className="public-cards">
              {sponsors.map((sponsor) => {
                const card = (
                  <article className="public-card">
                    {sponsor.logoUrl ? <img src={sponsor.logoUrl} alt={`Logo ${sponsor.name}`} style={{ maxWidth: 180, maxHeight: 90, objectFit: "contain" }} /> : null}
                    <span className="public-number">{sponsor.tier}</span>
                    <h3>{sponsor.name}</h3>
                  </article>
                );
                return sponsor.websiteUrl ? (
                  <a key={sponsor.slug} href={sponsor.websiteUrl} target="_blank" rel="noreferrer">{card}</a>
                ) : <div key={sponsor.slug}>{card}</div>;
              })}
            </div>
          ) : (
            <div className="public-empty">
              <h2>Espaço para parceiros</h2>
              <p>Patrocinadores ativos serão exibidos aqui após aprovação e publicação.</p>
            </div>
          )}
        </section>
      </main>
    </PublicLayout>
  );
}
