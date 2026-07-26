import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "../../components/race/motion";
import { RaceShell } from "../../components/race/race-shell";
import {
  EmptyState,
  PageHero,
  SearchField,
  StageMeta,
  StatusBadge,
  TrackGlyph,
} from "../../components/race/ui";
import { getStages } from "../../lib/public-data";

export const metadata: Metadata = {
  title: "Calendário",
  description: "Datas, formatos, traçados e horários oficiais da temporada UDK 2026.",
  alternates: { canonical: "/calendario" },
};

function param(
  value: string | string[] | undefined,
  fallback = "",
): string {
  return Array.isArray(value) ? value[0] ?? fallback : value ?? fallback;
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const status = param(params.status, "todos");
  const format = param(params.formato, "todos");
  const query = param(params.q).trim().toLocaleLowerCase("pt-BR");
  const stages = await getStages({ status, format });
  const filtered = query
    ? stages.filter((stage) =>
        [stage.title, stage.track, stage.location, stage.city]
          .join(" ")
          .toLocaleLowerCase("pt-BR")
          .includes(query),
      )
    : stages;

  const now = Date.now();
  const nextStage =
    filtered.find((stage) => stage.startsAt && new Date(stage.startsAt).getTime() >= now) ??
    filtered[0] ??
    null;

  return (
    <RaceShell>
      <main id="conteudo">
        <PageHero
          eyebrow="Temporada 2026"
          title="Calendário oficial"
          description="Cada etapa, traçado, horário e status em uma linha do tempo feita para consulta rápida."
        />

        <section className="race-section is-tight">
          <div className="race-container">
            <form className="race-filter-bar" action="/calendario">
              <SearchField defaultValue={param(params.q)} placeholder="Buscar etapa ou pista" />
              <select name="status" defaultValue={status} aria-label="Filtrar por status">
                <option value="todos">Todos os status</option>
                <option value="scheduled">Programadas</option>
                <option value="registration_open">Inscrições abertas</option>
                <option value="completed">Concluídas</option>
              </select>
              <select name="formato" defaultValue={format} aria-label="Filtrar por formato">
                <option value="todos">Todos os formatos</option>
                <option value="regular">Etapa regular</option>
                <option value="endurance">Endurance</option>
              </select>
              <select name="temporada" defaultValue="2026" aria-label="Temporada">
                <option value="2026">Temporada 2026</option>
              </select>
              <button className="race-button race-button-primary" type="submit">Aplicar</button>
            </form>
          </div>
        </section>

        <section className="race-section is-tight">
          <div className="race-container">
            {nextStage ? (
              <Reveal>
                <article className="race-highlight-panel">
                  <div>
                    <div className="race-next-race-head">
                      <span className="race-kicker">Próxima etapa</span>
                      <StatusBadge status={nextStage.status} />
                    </div>
                    <h2>{nextStage.date} • {nextStage.title}</h2>
                    <p>
                      {nextStage.shortDescription ??
                        `${nextStage.location}, ${nextStage.city}. Confira horário, traçado e abertura das inscrições.`}
                    </p>
                    <StageMeta stage={nextStage} />
                    <div className="race-hero-actions">
                      <Link className="race-button race-button-primary" href="/inscricao">
                        Inscrever-se <ArrowRight aria-hidden="true" />
                      </Link>
                      <Link className="race-button race-button-ghost" href="/regulamento">
                        Ver regulamento
                      </Link>
                    </div>
                  </div>
                  {nextStage.trackMapUrl ? (
                    <img src={nextStage.trackMapUrl} alt={`Mapa do ${nextStage.track}`} />
                  ) : (
                    <TrackGlyph label={`Representação do ${nextStage.track}`} />
                  )}
                </article>
              </Reveal>
            ) : (
              <EmptyState
                title="Nenhuma etapa encontrada"
                description="Ajuste os filtros ou aguarde a publicação oficial de novas datas."
                action={{ href: "/calendario", label: "Limpar filtros" }}
              />
            )}
          </div>
        </section>

        {filtered.length ? (
          <section className="race-section is-panel">
            <div className="race-container">
              <div className="race-section-heading">
                <div>
                  <span className="race-kicker">Linha do tempo</span>
                  <h2>A temporada curva por curva</h2>
                </div>
              </div>
              <div className="race-timeline">
                {filtered.map((stage, index) => (
                  <Reveal key={stage.id || `${stage.title}-${stage.date}`} delay={index * 45}>
                    <article className="race-timeline-item">
                      <strong className="race-timeline-date">{stage.date}</strong>
                      <div className="race-timeline-copy">
                        <h3>{stage.title}</h3>
                        <p>{stage.track} • {stage.location} • {stage.time}</p>
                      </div>
                      <StatusBadge status={stage.status} />
                    </article>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        <section className="race-section">
          <div className="race-container">
            <div className="race-cta">
              <span className="race-kicker">Pronto para alinhar?</span>
              <h2>Escolha sua categoria e entre no grid.</h2>
              <p>O processo de inscrição começa com uma conta única na plataforma oficial.</p>
              <Link className="race-button race-button-primary" href="/inscricao">
                Iniciar inscrição <ArrowRight aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
      </main>
    </RaceShell>
  );
}
