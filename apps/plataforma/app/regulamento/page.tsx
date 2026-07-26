import type { Metadata } from "next";
import { Download } from "lucide-react";
import { RaceShell } from "../../components/race/race-shell";
import { PageHero, StatusBadge } from "../../components/race/ui";
import { getRegulations } from "../../lib/public-content";

export const metadata: Metadata = {
  title: "Regulamento",
  description: "Regulamento público da temporada UDK 2026.",
  alternates: { canonical: "/regulamento" },
};

function parseSections(content: string) {
  return content.split(/\n\n+/).map((block, index) => {
    const [heading, ...body] = block.split("\n");
    return { id: `secao-${index + 1}`, heading, body: body.join(" ") };
  });
}

export default async function RegulationPage() {
  const regulations = await getRegulations();
  const current = regulations[0];
  const sections = parseSections(current?.content ?? "01. PUBLICAÇÃO PENDENTE\nA versão oficial será disponibilizada pela organização.");

  return (
    <RaceShell>
      <main id="conteudo" className="udk-page">
        <PageHero title="Regulamento" description="Temporada 2026" />
        <div className="race-container udk-page-body">
          <div className="udk-regulation-head">
            <div>
              <span>Versão {current?.version ?? "—"}</span>
              <h2>{current?.title ?? "Regulamento oficial"}</h2>
            </div>
            {current ? <StatusBadge status={current.status} /> : null}
          </div>

          <section className="udk-regulation-layout">
            <nav aria-label="Sumário do regulamento">
              <span>Índice</span>
              {sections.map((section, index) => (
                <a href={`#${section.id}`} className={index === 0 ? "is-active" : ""} key={section.id}>
                  {String(index + 1).padStart(2, "0")} {section.heading.replace(/^\d+\.\s*/, "")}
                </a>
              ))}
            </nav>
            <article>
              {sections.map((section) => (
                <section id={section.id} key={section.id}>
                  <h2>{section.heading}</h2>
                  <p>{section.body}</p>
                </section>
              ))}
              <aside>
                <strong>Importante</strong>
                <p>Este resumo público não substitui o arquivo integral publicado pela organização.</p>
              </aside>
              {current?.downloadUrl ? (
                <a className="udk-btn udk-btn-outline" href={current.downloadUrl}>
                  Baixar regulamento <Download aria-hidden="true" />
                </a>
              ) : null}
            </article>
          </section>
        </div>
      </main>
    </RaceShell>
  );
}
