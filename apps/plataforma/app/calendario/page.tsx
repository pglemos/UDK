import type { Metadata } from "next";
import { RaceShell } from "../../components/race/race-shell";
import { PageHero, SearchField, StatusBadge } from "../../components/race/ui";
import { getStages } from "../../lib/public-data";

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
      <main id="conteudo" className="udk-page">
        <PageHero title="Calendário" description="Temporada 2026" />
        <div className="race-container udk-page-body">
          <form className="udk-toolbar" action="/calendario">
            <SearchField defaultValue={param(params.q)} placeholder="Buscar etapa" />
            <select name="formato" defaultValue={format} aria-label="Formato">
              <option value="todos">Todos os formatos</option>
              <option value="regular">Etapa regular</option>
              <option value="endurance">Endurance</option>
            </select>
            <button type="submit" className="udk-btn udk-btn-primary">Filtrar</button>
          </form>

          <section className="udk-stage-list" aria-label="Etapas da temporada">
            {filtered.map((stage, index) => (
              <article className={`udk-stage-row${index === 0 ? " is-current" : ""}`} key={stage.id}>
                <strong className="udk-stage-number">{String(index + 1).padStart(2, "0")}</strong>
                <time>{stage.date}</time>
                <div>
                  <h2>{stage.title}</h2>
                  <p>{stage.track}</p>
                  <span>{stage.location} • {stage.city}</span>
                </div>
                <StatusBadge status={stage.status} />
              </article>
            ))}
          </section>
        </div>
      </main>
    </RaceShell>
  );
}
