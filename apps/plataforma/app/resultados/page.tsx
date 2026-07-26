import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Flag } from "lucide-react";
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
      <main id="conteudo" className="udk-page">
        <PageHero title="Resultados" description="Temporada 2026" />
        <div className="race-container udk-page-body">
          <div className="udk-category-tabs">
            <Link className="is-active" href="/resultados">Etapas</Link>
            <Link href="/resultados?categoria=rapidos">Rápidos</Link>
            <Link href="/resultados?categoria=insanos">Insanos</Link>
          </div>

          <div className="udk-results-select">
            <span>Resultado oficial</span>
            <strong>{selected?.stageTitle ?? "Aguardando publicação"}</strong>
            {selected ? <StatusBadge status={selected.status} /> : <span className="udk-pending-pill">Pendente</span>}
          </div>

          {selected && entries.length ? (
            <>
              <section className="udk-results-podium" aria-label="Pódio">
                {entries.slice(0, 3).map((entry, index) => (
                  <article className={`place-${index + 1}`} key={entry.id}>
                    <span>{index + 1}</span>
                    <div className="udk-podium-driver">#{entry.driverNumber}</div>
                    <h2>{entry.driverName}</h2>
                    <strong>{formatLapTime(entry.bestLapMs)}</strong>
                  </article>
                ))}
              </section>
              <div className="udk-data-table-wrap">
                <table className="udk-data-table">
                  <thead><tr><th>Pos.</th><th>Piloto</th><th>Voltas</th><th>Melhor volta</th><th>Pen.</th><th>Pontos</th></tr></thead>
                  <tbody>
                    {entries.map((entry) => (
                      <tr key={entry.id}>
                        <td><span className="udk-rank">{entry.position}</span></td>
                        <td><strong>{entry.driverName}</strong></td>
                        <td>{entry.laps}</td>
                        <td>{formatLapTime(entry.bestLapMs)}</td>
                        <td>{entry.penaltyMs ? `+${entry.penaltyMs / 1000}s` : "—"}</td>
                        <td><strong className="udk-points">{entry.points}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <section className="udk-results-empty">
              <Flag aria-hidden="true" />
              <div>
                <span>Publicação oficial pendente</span>
                <h2>O pódio aparecerá após a homologação.</h2>
                <p>A estrutura de resultado está pronta; nenhum vencedor foi inventado enquanto a organização não publicar a etapa.</p>
              </div>
              <Link href="/calendario" className="udk-btn udk-btn-outline">Ver calendário <ChevronRight aria-hidden="true" /></Link>
            </section>
          )}

          <RacePagination meta={results.meta} basePath="/resultados" params={{ categoria: category, page: String(page) }} />
        </div>
      </main>
    </RaceShell>
  );
}
