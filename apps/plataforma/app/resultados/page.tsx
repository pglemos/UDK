import type { Metadata } from "next";
import Link from "next/link";
import { EditorialEmpty } from "../../components/race/editorial-primitives";
import { RaceShell } from "../../components/race/race-shell";
import {
  ResultsReportLeaderStrip,
  ResultsReportMasthead,
  ResultsReportRace,
  ResultsReportRegister,
  ResultsReportTitleBand,
  formatReportDateTime,
  type ReportRaceDetail,
  type ReportRegisterRow,
} from "../../components/race/results-report";
import {
  ResultsClassificationTable,
  type ReportCell,
  type ReportRace,
  type ReportRow,
} from "../../components/race/results-report-table";
import {
  formatLapTime,
  getResultEntries,
  getResultsPage,
  getStandingsPage,
} from "../../lib/public-data";
import type { PublicResult, PublicResultEntry } from "../../lib/public-data";
import { formatShortDateLabel } from "../../lib/datetime";
import { officialResultPdfForResult } from "../../lib/official-result-links";
import { resultHeadingLabel, resultSessionLabel, resultStageLabel } from "../../lib/public-result-labels";
import { getSportingBreakdowns, type SportingBreakdown } from "../../lib/sporting-breakdown";

export const metadata: Metadata = {
  title: "Resultados",
  description: "Resultados oficiais, classificação e documentos da temporada UDK 2026.",
  alternates: { canonical: "/resultados" },
};

// Mesmo layout da página de campeonatos da P1 Academy (relatório oficial em uma folha), pedido do
// organizador em 14/10/2026. A lista de cada prova no celular mantém a classe tg-mobile-result-list.
const RACE_MOBILE_LIST_CLASS = "tg-mobile-result-list udkr-race-mobile";

type RaceBundle = {
  result: PublicResult;
  entries: PublicResultEntry[];
  sporting: Map<string, SportingBreakdown>;
};

function isNotClassified(entry: PublicResultEntry): boolean {
  return entry.status.toLowerCase() === "nc" || entry.position <= 0 || entry.position >= 999;
}

function categoryName(slug: string, fallback: string): string {
  if (slug === "insanos") return "Ultras Insanos";
  if (slug === "rapidos") return "Ultras Rápidos";
  return fallback;
}

function raceTime(result: PublicResult): number {
  const value = Date.parse(result.startsAt ?? result.publishedAt ?? "");
  return Number.isNaN(value) ? 0 : value;
}

function publicationLabel(result: PublicResult): string {
  const when = formatReportDateTime(result.publishedAt);
  const prefix = result.status.toLowerCase() === "rectified" ? "Retificado" : "Publicado";
  return when ? `${prefix} em ${when} · versão ${result.version}` : `Versão ${result.version}`;
}

function adjustmentsFor(entry: PublicResultEntry, sporting: SportingBreakdown | undefined): string[] {
  return [
    entry.pole ? "Pole +1" : null,
    entry.fastestLap ? "Melhor volta +1" : null,
    sporting?.bestPit ? "Melhor pit stop +10" : null,
    entry.penaltyMs ? `Penalidade +${entry.penaltyMs / 1000}s` : null,
    sporting?.penaltyPoints ? `Penalidade -${sporting.penaltyPoints} pts` : null,
    sporting?.timingAdjustmentLaps
      ? `Ajuste +${sporting.timingAdjustmentLaps} volta${sporting.timingAdjustmentLaps === 1 ? "" : "s"}`
      : null,
  ].filter((value): value is string => Boolean(value));
}

export default async function ResultsPage() {
  const [resultsPage, standingsPage] = await Promise.all([
    getResultsPage({ page: 1, pageSize: 100 }),
    getStandingsPage({ page: 1, pageSize: 200, sort: "points" }),
  ]);
  // registro e matriz na ordem do calendário (a mais antiga primeiro), como na folha oficial
  const results = [...resultsPage.items].sort((a, b) => raceTime(a) - raceTime(b));
  const bundles: RaceBundle[] = await Promise.all(
    results.map(async (result) => {
      const entries = await getResultEntries(result.id);
      return { result, entries, sporting: await getSportingBreakdowns(entries.map((entry) => entry.id)) };
    }),
  );

  const races: ReportRace[] = bundles.map(({ result }) => ({
    id: result.id,
    label: resultHeadingLabel(result),
    shortLabel:
      resultSessionLabel(result) === "Endurance"
        ? "Endurance"
        : `${resultStageLabel(result).replace("ª etapa", "ª")} · ${resultSessionLabel(result).replace("Corrida ", "C")}`,
    date: formatShortDateLabel(result.startsAt),
    pdfHref: officialResultPdfForResult(result.sessionName, result.title),
  }));

  const cellsByDriver = new Map<string, Record<string, ReportCell>>();
  for (const { result, entries, sporting } of bundles) {
    for (const entry of entries) {
      const cells = cellsByDriver.get(entry.driverSlug) ?? {};
      cells[result.id] = {
        points: entry.points,
        position: entry.position,
        laps: entry.laps,
        bestLap: formatLapTime(entry.bestLapMs),
        pole: entry.pole,
        fastestLap: entry.fastestLap,
        penaltyPoints: sporting.get(entry.id)?.penaltyPoints ?? 0,
        notClassified: isNotClassified(entry),
      };
      cellsByDriver.set(entry.driverSlug, cells);
    }
  }

  const rows: ReportRow[] = standingsPage.items
    .map((driver, index) => {
      const cells = cellsByDriver.get(driver.slug) ?? {};
      return {
        position: driver.rankingPosition ?? index + 1,
        slug: driver.slug,
        driver: driver.name,
        category: categoryName(driver.categorySlug, driver.category),
        categorySlug: driver.categorySlug,
        points: driver.points,
        grossPoints: driver.grossPoints,
        discardedPoints: driver.discardedPoints,
        wins: driver.wins,
        podiums: driver.podiums,
        races: Object.keys(cells).length,
        cells,
      };
    })
    // quem não correu nenhuma prova publicada não entra na folha de resultados
    .filter((row) => row.races > 0);

  const register: ReportRegisterRow[] = [...bundles].reverse().map(({ result, entries }) => {
    const winner = entries.find((entry) => entry.position === 1 && !isNotClassified(entry));
    const best = [...entries]
      .filter((entry) => entry.bestLapMs)
      .sort((a, b) => (a.bestLapMs ?? Infinity) - (b.bestLapMs ?? Infinity))[0];
    return {
      id: result.id,
      label: resultHeadingLabel(result),
      date: formatShortDateLabel(result.startsAt),
      winner: winner?.driverName ?? "Resultado incompleto",
      winnerCategory: winner ? categoryName(winner.categorySlug, winner.category) : "",
      bestLap: formatLapTime(result.fastestLapMs ?? best?.bestLapMs ?? null),
      bestLapDriver: best?.driverName ?? "",
      drivers: entries.length,
      status: result.status,
      pdfHref: officialResultPdfForResult(result.sessionName, result.title),
    };
  });

  const raceDetails: ReportRaceDetail[] = [...bundles].reverse().map(({ result, entries, sporting }) => ({
    id: result.id,
    label: resultHeadingLabel(result),
    date: formatShortDateLabel(result.startsAt),
    track: result.track,
    publication: publicationLabel(result),
    statusNote:
      result.status.toLowerCase() === "rectified"
        ? "Versão retificada do resultado oficial; o PDF traz o registro completo."
        : null,
    pdfHref: officialResultPdfForResult(result.sessionName, result.title),
    entries: entries.map((entry) => {
      const notClassified = isNotClassified(entry);
      return {
        id: entry.id,
        position: notClassified ? "NC" : String(entry.position).padStart(2, "0"),
        notClassified,
        driver: entry.driverName,
        slug: entry.driverSlug,
        category: categoryName(entry.categorySlug, entry.category),
        laps: entry.laps,
        bestLap: formatLapTime(entry.bestLapMs),
        adjustments: adjustmentsFor(entry, sporting.get(entry.id)),
        points: notClassified && entry.points === 0 ? "—" : String(entry.points),
        note: sporting.get(entry.id)?.sportingNote ?? null,
      };
    }),
  }));

  const lastPublishedAt =
    results
      .map((result) => result.publishedAt)
      .filter((value): value is string => Boolean(value))
      .sort()
      .at(-1) ?? null;
  const updatedAt = formatReportDateTime(lastPublishedAt);
  const stageCount = new Set(results.map((result) => result.stageId || resultStageLabel(result))).size;
  const latest = register[0];

  return (
    <RaceShell showMobileCta={false} showFooterCallout={false}>
      <main id="conteudo" tabIndex={-1} className="udk-page udkr-page udkr-hub">
        <div className="udkr-document">
          <ResultsReportMasthead updatedAt={updatedAt} />
          <ResultsReportTitleBand raceCount={results.length} stageCount={stageCount} pilotCount={rows.length} />
          <ResultsReportLeaderStrip rows={rows} />

          <div className="udkr-action-row udkr-action-row-top" aria-label="Ações oficiais">
            <a className="udkr-button udkr-button-primary" href="#classificacao" aria-label="Abrir classificação completa">
              <span className="udkr-button-label-wide">Abrir classificação completa</span>
              <span className="udkr-button-label-compact">Classificação</span>
            </a>
            {latest?.pdfHref ? (
              <a className="udkr-button" href={latest.pdfHref} target="_blank" rel="noreferrer" aria-label={`Abrir PDF de ${latest.label}`}>
                <span className="udkr-button-label-wide">Último resultado PDF</span>
                <span className="udkr-button-label-compact">Último PDF</span>
              </a>
            ) : null}
            <Link className="udkr-button" href="/regulamento" aria-label="Abrir regulamento">
              <span className="udkr-button-label-wide">Regulamento</span>
              <span className="udkr-button-label-compact">Regulamento</span>
            </Link>
          </div>

          <nav className="udkr-subnav" aria-label="Atalhos dos resultados">
            <a href="#classificacao">Classificação</a>
            <a href="#documentos">Documentos</a>
            <a href="#resultados">Resultados publicados</a>
            <a href="#provas">Classificação por prova</a>
            <Link href="/calendario">Calendário</Link>
            <Link className="udkr-subnav-accent" href="/inscricao">
              Inscrição
            </Link>
          </nav>

          {results.length ? (
            <>
              <section className="udkr-section udkr-classification-section" id="classificacao">
                <div className="udkr-section-bar">
                  <div>
                    <h2 id="hub-classification-title">Classificação atual</h2>
                    <p>
                      Os 10 primeiros pilotos aparecem abaixo. A matriz mostra os pontos de cada prova publicada pela
                      posição geral, com pole, melhor volta e punições; o total é o da classificação oficial da
                      temporada.
                    </p>
                  </div>
                  <div className="udkr-section-count">
                    <strong>{updatedAt ?? "Sem publicação"}</strong>
                    <span>
                      {results.length} provas · {rows.length} pilotos · {stageCount} etapas
                    </span>
                  </div>
                </div>
                <ResultsClassificationTable races={races} rows={rows} limit={10} labelledBy="hub-classification-title" />
              </section>

              <section className="udkr-section udkr-documents-section" id="documentos">
                <div className="udkr-section-bar">
                  <div>
                    <h2>Documentos oficiais</h2>
                    <p>Fontes públicas para conferir regras, classificação e resultados sem perder o contexto da temporada.</p>
                  </div>
                </div>
                <div className="udkr-document-links">
                  <Link className="udkr-document-link" href="/classificacao">
                    <span>01</span>
                    <strong>Classificação da temporada</strong>
                    <small>
                      {rows.length} pilotos · {results.length} provas publicadas
                    </small>
                  </Link>
                  <Link className="udkr-document-link" href="/regulamento">
                    <span>02</span>
                    <strong>Regulamento</strong>
                    <small>Documento oficial da temporada 2026</small>
                  </Link>
                  <a className="udkr-document-link" href="#resultados">
                    <span>03</span>
                    <strong>Resultados em PDF</strong>
                    <small>{register.filter((row) => row.pdfHref).length} documentos homologados</small>
                  </a>
                </div>
              </section>

              <section className="udkr-section udkr-results-section" id="resultados">
                <div className="udkr-section-bar">
                  <div>
                    <h2>Resultados publicados</h2>
                    <p>Abra o documento de cada prova para conferir o vencedor, a melhor volta e o lançamento original.</p>
                  </div>
                  <div className="udkr-section-count">
                    <strong>{register.length}</strong>
                    <span>documentos disponíveis</span>
                  </div>
                </div>
                <ResultsReportRegister rows={register} />
              </section>

              <section className="udkr-section udkr-races-section" id="provas">
                <div className="udkr-section-bar">
                  <div>
                    <h2>Classificação por prova</h2>
                    <p>Classificação geral completa de cada prova, com ajustes, notas oficiais e o volta a volta de cada piloto.</p>
                  </div>
                  <div className="udkr-section-count">
                    <strong>{raceDetails[0]?.label ?? "-"}</strong>
                    <span>prova mais recente aberta</span>
                  </div>
                </div>
                <div className="udkr-races">
                  {raceDetails.map((race, index) => (
                    <ResultsReportRace race={race} open={index === 0} key={race.id} mobileListClassName={RACE_MOBILE_LIST_CLASS} />
                  ))}
                </div>
                <div className="udkr-help">
                  <details>
                    <summary>Como ler os resultados</summary>
                    <p>
                      A posição e os pontos de cada prova são os da classificação geral (Art. 18): 1º 50, 2º 45, 3º 42,
                      4º 40, 5º 38 e daí um ponto a menos por posição. Pole e melhor volta valem +1 (Art. 19); bandeira
                      preta e branca soma 5 s ao tempo e tira 10 pontos (Art. 22).
                    </p>
                    <p>
                      Melhor volta é o menor tempo de uma volta, não o tempo total da corrida. NC significa não
                      classificado. O resultado oficial é publicado em até 3 dias após a etapa (Art. 23).
                    </p>
                  </details>
                </div>
              </section>
            </>
          ) : (
            <section className="udkr-section" id="classificacao">
              <EditorialEmpty
                index="03"
                title="Resultados oficiais ainda não publicados."
                description="Os resultados e os PDFs estarão disponíveis após a homologação de cada prova."
                action={{ href: "/calendario", label: "Ver próximas etapas" }}
              />
            </section>
          )}

          <footer className="udkr-footer-note">
            <span>Fonte: Ultras do Kart · temporada 2026 · Kartódromo Internacional de Betim</span>
            <strong>{results.length ? "Dados publicados" : "Aguardando homologação"}</strong>
          </footer>
        </div>
      </main>
    </RaceShell>
  );
}
