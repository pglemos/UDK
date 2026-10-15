import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ReportRow } from "./results-report-table";

/** Linha do registro de provas publicadas (tabela "Resultados publicados"). */
export type ReportRegisterRow = {
  id: string;
  label: string;
  date: string;
  winner: string;
  winnerCategory: string;
  bestLap: string;
  bestLapDriver: string;
  drivers: number;
  status: string;
  pdfHref: string | null;
};

/** Uma linha da classificação de uma prova (seção "Classificação por prova"). */
export type ReportRaceEntry = {
  id: string;
  position: string;
  notClassified: boolean;
  driver: string;
  slug: string;
  category: string;
  laps: number;
  bestLap: string;
  adjustments: string[];
  points: string;
  note: string | null;
};

export type ReportRaceDetail = {
  id: string;
  label: string;
  date: string;
  track: string;
  publication: string;
  statusNote: string | null;
  pdfHref: string | null;
  entries: ReportRaceEntry[];
};

export function formatReportDateTime(timestamp: string | null): string | null {
  if (!timestamp) return null;
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

export function ResultsReportMasthead({ updatedAt }: { updatedAt: string | null }) {
  return (
    <header className="udkr-masthead">
      <Link className="udkr-brand-lockup" href="/" aria-label="Ultras do Kart, página inicial">
        <span className="udkr-brand-mark">
          <Image src="/brand/udk-wordmark-white.svg" alt="" width={56} height={56} priority />
        </span>
        <span>
          <strong>Ultras do Kart</strong>
          <small>UDK · temporada 2026</small>
        </span>
      </Link>
      <div className="udkr-masthead-context">
        <span>Documento público</span>
        <strong>Resultados oficiais</strong>
      </div>
      <div className="udkr-masthead-meta">
        <span>{updatedAt ? "Atualizado em" : "Situação"}</span>
        <strong>{updatedAt ?? "Sem publicação"}</strong>
        <small>{updatedAt ? "Dados publicados" : "Aguardando homologação"}</small>
      </div>
    </header>
  );
}

export function ResultsReportTitleBand({
  raceCount,
  stageCount,
  pilotCount,
}: {
  raceCount: number;
  stageCount: number;
  pilotCount: number;
}) {
  return (
    <section className="udkr-title-band" aria-labelledby="report-title">
      <div className="udkr-title-copy">
        <h1 id="report-title">Ultras do Kart</h1>
        <p className="udkr-title-meta">
          Temporada 2026 · Ultras Insanos e Ultras Rápidos · Kartódromo Internacional de Betim
        </p>
        <p className="udkr-title-description">
          Resultados oficiais, classificação e documentos da temporada em uma só folha.
        </p>
      </div>
      <dl className="udkr-title-facts">
        <div>
          <dt>Provas publicadas</dt>
          <dd>{raceCount}</dd>
          <small>
            {stageCount} {stageCount === 1 ? "etapa" : "etapas"}
          </small>
        </div>
        <div>
          <dt>Pilotos classificados</dt>
          <dd>{pilotCount}</dd>
        </div>
      </dl>
    </section>
  );
}

export function ResultsReportLeaderStrip({ rows }: { rows: ReportRow[] }) {
  if (!rows.length) return null;
  return (
    <section className="udkr-leader-strip" aria-labelledby="report-leader-title">
      <div className="udkr-leader-intro">
        <h2 id="report-leader-title">Líderes atuais</h2>
        <p>Os primeiros colocados da temporada aparecem antes da matriz para uma consulta rápida.</p>
      </div>
      <ol className="udkr-leader-list">
        {rows.slice(0, 3).map((row) => (
          <li key={row.slug}>
            <span className="udkr-leader-position">{String(row.position).padStart(2, "0")}</span>
            <span className="udkr-leader-driver">
              <strong>{row.driver}</strong>
              <small>
                {row.category} · {row.wins} {row.wins === 1 ? "vitória" : "vitórias"} · {row.races}{" "}
                {row.races === 1 ? "prova" : "provas"}
              </small>
            </span>
            <strong className="udkr-leader-total">{row.points}</strong>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function ResultsReportRegister({ rows }: { rows: ReportRegisterRow[] }) {
  return (
    <div className="udkr-register-frame">
      <div className="udkr-table-heading">
        <span>Registro oficial</span>
        <strong>
          {rows.length} {rows.length === 1 ? "prova" : "provas"}
        </strong>
      </div>
      <div className="udkr-register-scroll" role="region" aria-label="Resultados publicados por prova" tabIndex={0}>
        <table className="udkr-register-table">
          <caption className="udkr-visually-hidden">Registro das provas publicadas do Ultras do Kart 2026.</caption>
          <thead>
            <tr>
              <th scope="col">Prova</th>
              <th scope="col">Data</th>
              <th scope="col">Vencedor</th>
              <th scope="col">Melhor volta</th>
              <th scope="col">Pilotos</th>
              <th scope="col">Classificação</th>
              <th scope="col">Documento</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <th scope="row">{row.label}</th>
                <td>{row.date}</td>
                <td>
                  {row.winner}
                  {row.winnerCategory ? <small className="udkr-register-sub">{row.winnerCategory}</small> : null}
                </td>
                <td className="udkr-time-cell">
                  {row.bestLap}
                  {row.bestLapDriver ? <small className="udkr-register-sub">{row.bestLapDriver}</small> : null}
                </td>
                <td className="udkr-time-cell">{row.drivers}</td>
                <td>
                  <a className="udkr-text-link" href={`#prova-${row.id}`}>
                    Ver prova
                  </a>
                </td>
                <td>
                  {row.pdfHref ? (
                    <a
                      className="udkr-text-link"
                      href={row.pdfHref}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Abrir PDF de ${row.label}, ${row.date}`}
                    >
                      Abrir PDF
                    </a>
                  ) : (
                    "-"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="udkr-register-hint">Em telas menores, deslize horizontalmente para consultar todas as colunas.</p>
    </div>
  );
}

function AdjustmentList({ adjustments }: { adjustments: string[] }) {
  if (!adjustments.length) return <span className="udkr-race-muted">Sem ajustes</span>;
  return (
    <ul className="udkr-race-adjustments" aria-label="Ajustes do resultado">
      {adjustments.map((adjustment) => (
        <li key={adjustment}>{adjustment}</li>
      ))}
    </ul>
  );
}

/** Classificação completa de uma prova, com notas oficiais e volta a volta de cada piloto. */
export function ResultsReportRace({
  race,
  open,
  mobileListClassName,
}: {
  race: ReportRaceDetail;
  open: boolean;
  mobileListClassName: string;
}) {
  return (
    <details className="udkr-race" id={`prova-${race.id}`} open={open}>
      <summary className="udkr-race-summary">
        <span className="udkr-race-title">
          <strong>{race.label}</strong>
          <small>
            {race.date}
            {race.track ? ` · ${race.track}` : ""} · {race.entries.length} pilotos
          </small>
        </span>
        <span className="udkr-race-publication">{race.publication}</span>
      </summary>
      <div className="udkr-race-body">
        <div className="udkr-race-tools">
          <p>
            Posição e pontos pela classificação geral da prova (Art. 18). Melhor volta = menor tempo de uma
            volta · ajustes = bônus e punições · NC = não classificado.
            {race.statusNote ? ` ${race.statusNote}` : ""}
          </p>
          {race.pdfHref ? (
            <a className="udkr-button udkr-button-primary" href={race.pdfHref} download>
              Baixar resultado oficial
            </a>
          ) : null}
        </div>
        <div className="udkr-register-scroll udkr-race-scroll" role="region" aria-label={`Classificação de ${race.label}`} tabIndex={0}>
          <table className="udkr-register-table udkr-race-table">
            <caption className="udkr-visually-hidden">Classificação geral de {race.label}.</caption>
            <thead>
              <tr>
                <th scope="col">Pos.</th>
                <th scope="col">Piloto</th>
                <th scope="col">Categoria</th>
                <th scope="col">Voltas</th>
                <th scope="col">Melhor volta</th>
                <th scope="col">Ajustes</th>
                <th scope="col">Pontos</th>
                <th scope="col">Detalhes</th>
              </tr>
            </thead>
            <tbody>
              {race.entries.map((entry) => (
                <tr key={entry.id}>
                  <th scope="row">{entry.position}</th>
                  <td>
                    <strong className="udkr-race-driver">{entry.driver}</strong>
                    {entry.note ? (
                      <details className="udkr-race-note">
                        <summary>Ver nota oficial</summary>
                        <p>{entry.note}</p>
                      </details>
                    ) : null}
                  </td>
                  <td>{entry.category}</td>
                  <td className="udkr-time-cell">{entry.laps}</td>
                  <td className="udkr-time-cell">{entry.bestLap}</td>
                  <td>
                    <AdjustmentList adjustments={entry.adjustments} />
                  </td>
                  <td className="udkr-race-points">{entry.points}</td>
                  <td>
                    <Link
                      className="udkr-text-link"
                      href={`/pilotos/${entry.slug}?resultado=${encodeURIComponent(race.id)}#volta-a-volta`}
                      aria-label={`Ver volta a volta de ${entry.driver} em ${race.label}`}
                    >
                      Volta a volta
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <ol className={mobileListClassName} aria-label={`Resultado resumido ${race.label}`}>
          {race.entries.map((entry) => (
            <li key={entry.id}>
              <span className="udkr-mobile-ranking-position">{entry.position}</span>
              <span className="udkr-race-mobile-driver">
                <strong>{entry.driver}</strong>
                <small>
                  {entry.category} · {entry.laps} voltas · melhor {entry.bestLap}
                </small>
                {entry.adjustments.length || entry.note ? (
                  <details>
                    <summary>Ver detalhes</summary>
                    {entry.adjustments.length ? <AdjustmentList adjustments={entry.adjustments} /> : null}
                    {entry.note ? <p>{entry.note}</p> : null}
                  </details>
                ) : null}
                <Link
                  className="udkr-text-link"
                  href={`/pilotos/${entry.slug}?resultado=${encodeURIComponent(race.id)}#volta-a-volta`}
                  aria-label={`Ver volta a volta de ${entry.driver} em ${race.label}`}
                >
                  Volta a volta <ArrowRight size={12} aria-hidden="true" />
                </Link>
              </span>
              <strong className="udkr-mobile-ranking-total">{entry.points}</strong>
            </li>
          ))}
        </ol>
      </div>
    </details>
  );
}
