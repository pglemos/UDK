import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ChevronRight, Flag } from "lucide-react";
import { EditorialEmpty, EditorialHeading } from "../../components/race/editorial-primitives";
import { RaceShell } from "../../components/race/race-shell";
import { PageHero, RacePagination, StatusBadge } from "../../components/race/ui";
import { formatLapTime, getResultEntries, getResultsPage, parsePositiveInt } from "../../lib/public-data";

export const metadata: Metadata = {
  title: "Resultados",
  description: "Resultados oficiais da temporada UDK 2026.",
  alternates: { canonical: "/resultados" },
};

function param(value: string | string[] | undefined, fallback = ""): string {
  return Array.isArray(value) ? value[0] ?? fallback : value ?? fallback;
}

export default async function ResultsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const page = parsePositiveInt(params.page, 1, 500);
  const category = param(params.categoria, "geral");
  const results = await getResultsPage({ page, pageSize: 6, category });
  const selected = results.items[0] ?? null;
  const entries = selected ? await getResultEntries(selected.id) : [];

  return (
    <RaceShell>
      <main id="conteudo" className="udk-page tg-internal-page">
        <PageHero
          index="03"
          eyebrow="Bandeirada oficial"
          title="Resultados"
          description="Quando a organização homologa, o portal registra sem ruído e sem inventar quem venceu."
        />

        <section className="tg-results-section">
          <div className="race-container">
            <EditorialHeading
              index="03"
              title="O resultado termina a corrida. A leitura começa depois."
              description="Tempos, posições, penalidades e pontos aparecem apenas após publicação oficial."
            />

            <div className="udk-category-tabs tg-category-tabs">
              <Link className={category === "geral" ? "is-active" : ""} href="/resultados">Geral</Link>
              <Link className={category === "rapidos" ? "is-active" : ""} href="/resultados?categoria=rapidos">Ultras Rápidos</Link>
              <Link className={category === "insanos" ? "is-active" : ""} href="/resultados?categoria=insanos">Ultras Insanos</Link>
            </div>

            <div className="tg-result-selector">
              <div><span>Resultado selecionado</span><h2>{selected?.stageTitle ?? "Aguardando publicação"}</h2></div>
              {selected ? <StatusBadge status={selected.status} /> : <span className="udk-pending-pill">Pendente</span>}
            </div>

            {selected && entries.length >= 3 ? (
              <>
                <section className="tg-results-podium" aria-label="Pódio">
                  {entries.slice(0, 3).map((entry, index) => (
                    <article className={`place-${index + 1}`} key={entry.id}>
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <div className="tg-result-driver-number">#{entry.driverNumber}</div>
                      <h2>{entry.driverName}</h2>
                      <p>{entry.stageTitle}</p>
                      <strong>{formatLapTime(entry.bestLapMs)}</strong>
                      <small>{entry.points} pts</small>
                    </article>
                  ))}
                </section>

                <div className="tg-standing-table-wrap">
                  <table className="udk-data-table tg-standing-table">
                    <thead><tr><th>Pos.</th><th>Piloto</th><th>Voltas</th><th>Melhor volta</th><th>Penalidade</th><th>Pontos</th></tr></thead>
                    <tbody>
                      {entries.map((entry) => (
                        <tr key={entry.id}>
                          <td data-label="Posição"><span className="udk-rank">{entry.position}</span></td>
                          <td data-label="Piloto"><strong>{entry.driverName}</strong></td>
                          <td data-label="Voltas">{entry.laps}</td>
                          <td data-label="Melhor volta">{formatLapTime(entry.bestLapMs)}</td>
                          <td data-label="Penalidade">{entry.penaltyMs ? `+${entry.penaltyMs / 1000}s` : "—"}</td>
                          <td data-label="Pontos"><strong className="udk-points">{entry.points}</strong></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <EditorialEmpty
                index="03"
                title="Resultados oficiais ainda não publicados."
                description="O pódio e a tabela completa serão exibidos após homologação. Nenhum vencedor, tempo ou posição foi criado apenas para preencher a tela."
                action={{ href: "/calendario", label: "Ver próximas etapas" }}
              />
            )}

            <RacePagination meta={results.meta} basePath="/resultados" params={{ categoria: category, page: String(page) }} />
          </div>
        </section>

        <section className="tg-inline-cta">
          <div className="race-container">
            <Flag aria-hidden="true" />
            <div><span>Próxima bandeirada</span><h2>A temporada ainda tem capítulos pela frente.</h2></div>
            <Link href="/calendario" className="race-button race-button-primary">Ver calendário <ChevronRight aria-hidden="true" /></Link>
          </div>
        </section>
      </main>
    </RaceShell>
  );
}
