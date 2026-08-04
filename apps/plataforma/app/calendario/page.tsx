import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, Flag, MapPin, Timer } from "lucide-react";
import { EditorialEmpty, EditorialHeading } from "../../components/race/editorial-primitives";
import { Reveal } from "../../components/race/motion";
import { RaceShell } from "../../components/race/race-shell";
import { PageHero, SearchField, StatusBadge } from "../../components/race/ui";
import { getStages } from "../../lib/public-data";
import { stageVisual } from "../../lib/visual-assets";

export const metadata: Metadata = {
  title: "Calendário",
  description: "Calendário oficial da temporada UDK 2026.",
  alternates: { canonical: "/calendario" },
};

function param(value: string | string[] | undefined, fallback = ""): string {
  return Array.isArray(value) ? value[0] ?? fallback : value ?? fallback;
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const format = param(params.formato, "todos");
  const query = param(params.q).trim().toLocaleLowerCase("pt-BR");
  const stages = await getStages({ format });
  const filtered = query
    ? stages.filter((stage) => [stage.title, stage.track, stage.city].join(" ").toLocaleLowerCase("pt-BR").includes(query))
    : stages;

  return (
    <RaceShell>
      <main id="conteudo" className="udk-page tg-internal-page">
        <PageHero
          index="01"
          eyebrow="Temporada 2026"
          title="Calendário"
          description="Cinco encontros, diferentes traçados e uma temporada construída volta após volta."
        />

        <section className="tg-internal-intro">
          <div className="race-container">
            <EditorialHeading
              index="01"
              title="Cada etapa muda o ritmo da história."
              description="Filtre o calendário, conheça os traçados e acompanhe quando o grid volta a acelerar."
            />
            <form className="udk-toolbar tg-toolbar" action="/calendario">
              <SearchField defaultValue={param(params.q)} placeholder="Buscar etapa, traçado ou cidade" />
              <select name="formato" defaultValue={format} aria-label="Formato">
                <option value="todos">Todos os formatos</option>
                <option value="regular">Etapa regular</option>
                <option value="endurance">Endurance</option>
              </select>
              <button type="submit" className="race-button race-button-primary">Aplicar filtros</button>
            </form>
          </div>
        </section>

        <section className="tg-calendar-section">
          <div className="race-container">
            {filtered.length ? (
              <div className="tg-calendar-timeline" aria-label="Etapas da temporada">
                {filtered.map((stage, index) => {
                  const visual = stageVisual(index);
                  return (
                    <Reveal key={stage.id} delay={index * 45}>
                      <article className={`tg-calendar-stage${index === 0 ? " is-current" : ""}`}>
                        <div className="tg-calendar-stage-index">
                          <span>{String(index + 1).padStart(2, "0")}</span>
                          <i />
                        </div>
                        <div className="tg-calendar-stage-date">
                          <time>{stage.date || "Data a definir"}</time>
                          <StatusBadge status={stage.status} />
                        </div>
                        <div className="tg-calendar-stage-copy">
                          <h2>{stage.title}</h2>
                          <p>{stage.shortDescription ?? stage.track}</p>
                          <div>
                            <span><Flag aria-hidden="true" /> {stage.track}</span>
                            <span><MapPin aria-hidden="true" /> {stage.location} • {stage.city}</span>
                            <span><Timer aria-hidden="true" /> {stage.time || "Horário a definir"}</span>
                          </div>
                        </div>
                        <div className="tg-calendar-stage-media">
                          <Image
                            src={stage.heroImageUrl ?? visual.src}
                            alt={stage.heroImageUrl ? `Imagem da etapa ${stage.title}` : visual.alt}
                            fill
                            quality={86}
                            sizes="(max-width: 760px) 100vw, 28vw"
                            style={{ objectPosition: stage.heroImageUrl ? "50% center" : visual.position }}
                          />
                        </div>
                        <Link href="/inscricao" className="tg-arrow-link">
                          Entrar no grid <ArrowRight aria-hidden="true" />
                        </Link>
                      </article>
                    </Reveal>
                  );
                })}
              </div>
            ) : (
              <EditorialEmpty
                index="01"
                title="Nenhuma etapa corresponde aos filtros."
                description="Ajuste a busca ou volte ao calendário completo para ver todos os encontros publicados."
                action={{ href: "/calendario", label: "Limpar filtros" }}
              />
            )}
          </div>
        </section>

        <section className="tg-inline-cta">
          <div className="race-container">
            <CalendarDays aria-hidden="true" />
            <div><span>Temporada 2026</span><h2>Escolha a etapa. Prepare a volta.</h2></div>
            <Link href="/inscricao" className="race-button race-button-primary">Começar inscrição <ArrowRight aria-hidden="true" /></Link>
          </div>
        </section>
      </main>
    </RaceShell>
  );
}
