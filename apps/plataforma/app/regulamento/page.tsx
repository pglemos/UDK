import type { Metadata } from "next";
import Link from "next/link";
import { Download, History, Link2 } from "lucide-react";
import { Reveal } from "../../components/race/motion";
import { RaceShell } from "../../components/race/race-shell";
import { EmptyState, PageHero, StatusBadge } from "../../components/race/ui";
import { getRegulations, type PublicTerm } from "../../lib/public-content";

export const metadata: Metadata = {
  title: "Regulamento",
  description: "Regulamento oficial, vigência e versões publicadas do campeonato UDK.",
  alternates: { canonical: "/regulamento" },
};

type RegulationSection = {
  id: string;
  title: string;
  paragraphs: string[];
};

function slugify(value: string, index: number): string {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return normalized || `secao-${index + 1}`;
}

function splitRegulation(term: PublicTerm): RegulationSection[] {
  const blocks = term.content
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  if (!blocks.length) {
    return [{
      id: "conteudo",
      title: term.title,
      paragraphs: ["O conteúdo desta versão ainda não foi disponibilizado para leitura pública."],
    }];
  }

  const sections: RegulationSection[] = [];
  let current: RegulationSection | null = null;

  blocks.forEach((block, index) => {
    const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
    const first = lines[0] ?? "";
    const heading =
      /^(cap[ií]tulo|se[cç][aã]o|art\.?|artigo|\d+[.)-])/i.test(first) ||
      (first.length < 90 && first === first.toLocaleUpperCase("pt-BR"));

    if (heading) {
      current = {
        id: slugify(first, index),
        title: first,
        paragraphs: lines.slice(1),
      };
      sections.push(current);
      return;
    }

    if (!current) {
      current = {
        id: `secao-${index + 1}`,
        title: index === 0 ? term.title : `Seção ${index + 1}`,
        paragraphs: [],
      };
      sections.push(current);
    }

    current.paragraphs.push(...lines);
  });

  return sections;
}

export default async function RegulationsPage() {
  const regulations = await getRegulations();
  const current = regulations[0] ?? null;
  const sections = current ? splitRegulation(current) : [];

  return (
    <RaceShell>
      <main id="conteudo">
        <PageHero
          eyebrow={current ? `Versão ${current.version}` : "Documento oficial"}
          title="Regulamento"
          description="Regras, pontuação, conduta, penalidades e vigência com navegação direta para cada seção."
        />

        <section className="race-section is-tight">
          <div className="race-container">
            {current ? (
              <>
                <Reveal>
                  <article className="race-highlight-panel">
                    <div>
                      <div className="race-next-race-head">
                        <span className="race-kicker">Versão vigente</span>
                        <StatusBadge status={current.status} />
                      </div>
                      <h2>{current.title}</h2>
                      <p>
                        Versão {current.version}
                        {current.effectiveAt
                          ? ` • Vigente desde ${new Date(current.effectiveAt).toLocaleDateString("pt-BR")}`
                          : " • Data de vigência não informada"}
                      </p>
                      <div className="race-hero-actions">
                        {current.downloadUrl ? (
                          <a
                            className="race-button race-button-primary"
                            href={current.downloadUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <Download aria-hidden="true" /> Baixar PDF
                          </a>
                        ) : (
                          <span className="race-button race-button-secondary" aria-disabled="true">
                            <Download aria-hidden="true" /> PDF não publicado
                          </span>
                        )}
                        <a className="race-button race-button-ghost" href="#historico">
                          <History aria-hidden="true" /> Histórico
                        </a>
                      </div>
                    </div>
                    <div className="race-summary-list">
                      <div><span>Versão</span><b>{current.version}</b></div>
                      <div><span>Seções</span><b>{sections.length}</b></div>
                      <div><span>Status</span><b>{current.status}</b></div>
                      <div>
                        <span>Vigência</span>
                        <b>{current.effectiveAt ? new Date(current.effectiveAt).toLocaleDateString("pt-BR") : "Não informada"}</b>
                      </div>
                    </div>
                  </article>
                </Reveal>

                <section className="race-section is-tight">
                  <div className="race-reading-layout">
                    <nav className="race-reading-nav" aria-label="Sumário do regulamento">
                      <span>Nesta versão</span>
                      {sections.map((section, index) => (
                        <a href={`#${section.id}`} key={section.id}>
                          {String(index + 1).padStart(2, "0")} {section.title}
                        </a>
                      ))}
                    </nav>

                    <article className="race-prose">
                      {sections.map((section) => (
                        <section id={section.id} key={section.id}>
                          <h2>{section.title}</h2>
                          {section.paragraphs.length ? (
                            section.paragraphs.map((paragraph, index) => (
                              <p key={`${section.id}-${index}`}>{paragraph}</p>
                            ))
                          ) : (
                            <p>Consulte o conteúdo integral desta seção na versão oficial.</p>
                          )}
                          <a className="race-text-link" href={`#${section.id}`}>
                            <Link2 aria-hidden="true" /> Copiar referência desta seção
                          </a>
                        </section>
                      ))}
                    </article>
                  </div>
                </section>

                <section id="historico" className="race-section is-panel">
                  <div className="race-container">
                    <div className="race-section-heading">
                      <div>
                        <span className="race-kicker">Rastreabilidade</span>
                        <h2>Histórico de versões</h2>
                      </div>
                    </div>
                    <div className="race-grid">
                      {regulations.map((term) => (
                        <article className="race-result-card" key={term.id}>
                          <div className="race-result-card-meta">
                            <StatusBadge status={term.status} />
                            <span>Versão {term.version}</span>
                          </div>
                          <h3>{term.title}</h3>
                          <p>
                            {term.effectiveAt
                              ? `Vigência em ${new Date(term.effectiveAt).toLocaleDateString("pt-BR")}`
                              : "Data de vigência não informada"}
                          </p>
                        </article>
                      ))}
                    </div>
                  </div>
                </section>
              </>
            ) : (
              <EmptyState
                title="Regulamento aguardando publicação"
                description="A organização ainda não publicou uma versão oficial para leitura pública."
                action={{ href: "/noticias", label: "Ver comunicados" }}
              />
            )}
          </div>
        </section>

        <section className="race-section">
          <div className="race-container">
            <div className="race-cta">
              <span className="race-kicker">Antes da largada</span>
              <h2>Regra conhecida é disputa mais limpa.</h2>
              <p>Leia a versão vigente antes de confirmar sua inscrição na temporada.</p>
              <Link className="race-button race-button-primary" href="/inscricao">
                Iniciar inscrição
              </Link>
            </div>
          </div>
        </section>
      </main>
    </RaceShell>
  );
}
