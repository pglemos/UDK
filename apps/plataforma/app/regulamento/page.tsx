import type { Metadata } from "next";
import { Download, FileText } from "lucide-react";
import { EditorialHeading } from "../../components/race/editorial-primitives";
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
    const [rawHeading, ...body] = block.split("\n");
    const heading = rawHeading ?? `Seção ${index + 1}`;
    return { id: `secao-${index + 1}`, heading, body: body.join(" ") };
  });
}

export default async function RegulationPage() {
  const regulations = await getRegulations();
  const current = regulations[0];
  const sections = parseSections(current?.content ?? "01. PUBLICAÇÃO PENDENTE\nA versão oficial será disponibilizada pela organização.");

  return (
    <RaceShell>
      <main id="conteudo" className="udk-page tg-internal-page">
        <PageHero
          index="06"
          eyebrow="Regras do campeonato"
          title="Regulamento"
          description="Clareza antes da largada. Consulte a versão pública e os capítulos publicados pela organização."
        />

        <section className="tg-regulation-section">
          <div className="race-container">
            <EditorialHeading
              index="06"
              title="Toda disputa forte precisa de regras claras."
              description="A navegação abaixo organiza o conteúdo público sem substituir o documento integral homologado."
            />

            <div className="tg-regulation-version">
              <FileText aria-hidden="true" />
              <div><span>Versão {current?.version ?? "—"}</span><h2>{current?.title ?? "Regulamento oficial"}</h2></div>
              {current ? <StatusBadge status={current.status} /> : <span className="udk-pending-pill">Pendente</span>}
              {current?.downloadUrl ? <a className="race-button race-button-primary" href={current.downloadUrl}>Baixar PDF <Download aria-hidden="true" /></a> : null}
            </div>

            <section className="tg-regulation-layout">
              <nav aria-label="Sumário do regulamento">
                <span>Índice</span>
                {sections.map((section, index) => (
                  <a href={`#${section.id}`} className={index === 0 ? "is-active" : ""} key={section.id}>
                    <b>{String(index + 1).padStart(2, "0")}</b>
                    {section.heading.replace(/^\d+\.\s*/, "")}
                  </a>
                ))}
              </nav>
              <article>
                {sections.map((section, index) => (
                  <section id={section.id} key={section.id}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <h2>{section.heading}</h2>
                    <p>{section.body}</p>
                  </section>
                ))}
                <aside><strong>Importante</strong><p>Este resumo público não substitui o arquivo integral publicado pela organização.</p></aside>
              </article>
            </section>
          </div>
        </section>
      </main>
    </RaceShell>
  );
}
