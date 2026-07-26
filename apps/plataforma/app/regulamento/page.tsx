import type { Metadata } from "next";
import { PublicLayout } from "../../components/public-layout";
import { PublicPageHero } from "../../components/public-page-hero";
import { getPublicContentBundle } from "../../lib/public-content";

export const metadata: Metadata = {
  title: "Regulamento",
  description: "Regulamento e versões oficiais da temporada UDK.",
  alternates: { canonical: "/regulamento" },
};

export default async function RegulationsPage() {
  const { regulations } = await getPublicContentBundle();
  return (
    <PublicLayout>
      <main>
        <PublicPageHero title="Regulamento" description="Regras, documentos, vigência e versões oficiais." />
        <section className="public-section">
          {regulations.length ? (
            <div className="public-content-list">
              {regulations.map((term) => (
                <article key={term.id}>
                  <span className="public-status">Versão {term.version}</span>
                  <h2>{term.title}</h2>
                  <p>{term.content}</p>
                  {term.effectiveAt ? <small>Vigência: {new Date(term.effectiveAt).toLocaleDateString("pt-BR")}</small> : null}
                </article>
              ))}
            </div>
          ) : (
            <div className="public-empty">
              <h2>Regulamento aguardando publicação</h2>
              <p>A versão oficial será exibida aqui assim que for publicada pela organização.</p>
            </div>
          )}
        </section>
      </main>
    </PublicLayout>
  );
}
