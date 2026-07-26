import type { Metadata } from "next";
import { PublicLayout } from "../../components/public-layout";
import { PublicPageHero } from "../../components/public-page-hero";
import { formatLapTime, getPublicData } from "../../lib/public-data";

export const metadata: Metadata = {
  title: "Resultados",
  description: "Resultados provisórios, homologados e publicados do UDK.",
  alternates: { canonical: "/resultados" },
};

const statusLabels: Record<string, string> = {
  provisional: "Provisório",
  homologated: "Homologado",
  published: "Publicado",
  rectified: "Retificado",
};

export default async function ResultsPage() {
  const { results } = await getPublicData();
  return (
    <PublicLayout>
      <main>
        <PublicPageHero title="Resultados" description="Versões públicas e homologadas das sessões oficiais." />
        <section className="public-section">
          {results.length ? (
            <div className="public-cards">
              {results.map((result) => (
                <article className="public-card" key={result.id}>
                  <span className="public-number">{result.category}</span>
                  <h3>{result.stageTitle}</h3>
                  <p>Melhor volta: <b>{formatLapTime(result.fastestLapMs)}</b></p>
                  <div className="public-result-meta">
                    <span className="public-status">{statusLabels[result.status] ?? result.status}</span>
                    <span className="public-status">Versão {result.version}</span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="public-empty">
              <h2>Nenhum resultado publicado</h2>
              <p>Os resultados aparecerão aqui após a publicação oficial pela organização.</p>
            </div>
          )}
        </section>
      </main>
    </PublicLayout>
  );
}
