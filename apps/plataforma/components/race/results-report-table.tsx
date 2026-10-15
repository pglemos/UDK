"use client";

import { ArrowLeftRight, X } from "lucide-react";
import { useState } from "react";

/** Uma prova publicada (coluna da matriz). */
export type ReportRace = {
  id: string;
  label: string;
  shortLabel: string;
  date: string;
  pdfHref: string | null;
};

/** O que o piloto fez em uma prova (célula da matriz). */
export type ReportCell = {
  points: number;
  position: number;
  laps: number;
  bestLap: string;
  pole: boolean;
  fastestLap: boolean;
  penaltyPoints: number;
  notClassified: boolean;
};

export type ReportRow = {
  position: number;
  slug: string;
  driver: string;
  category: string;
  categorySlug: string;
  points: number;
  grossPoints: number;
  discardedPoints: number;
  wins: number;
  podiums: number;
  races: number;
  cells: Record<string, ReportCell>;
};

// busca sem acento: "braulio" acha "Bráulio"
function normalizeName(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR").trim();
}

type FilterMode = "all" | "top10" | "insanos" | "rapidos" | "winners";

type SelectedScore = { row: ReportRow; race: ReportRace; cell: ReportCell | undefined };

export function ResultsReportMatrixKey() {
  return (
    <div className="udkr-matrix-key" aria-label="Legenda da matriz">
      {[
        ["V", "vitória (1º geral)"],
        ["P", "pole +1"],
        ["MV", "melhor volta +1"],
        ["-10", "preta e branca"],
        ["NC", "não classificado"],
        ["-", "não correu"],
      ].map(([mark, label]) => (
        <span key={mark}>
          <strong>{mark}</strong>
          <small>{label}</small>
        </span>
      ))}
    </div>
  );
}

export function ResultsClassificationTable({
  races,
  rows,
  limit = 10,
  labelledBy,
}: {
  races: ReportRace[];
  rows: ReportRow[];
  limit?: number;
  labelledBy?: string;
}) {
  const [query, setQuery] = useState("");
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [showAll, setShowAll] = useState(false);
  const [selected, setSelected] = useState<SelectedScore | null>(null);
  const normalizedQuery = normalizeName(query);

  if (!races.length || !rows.length) {
    return <p className="udkr-empty-state">Nenhuma classificação publicada no momento.</p>;
  }

  let filteredRows = rows;
  if (filterMode === "top10") filteredRows = rows.slice(0, 10);
  else if (filterMode === "insanos" || filterMode === "rapidos")
    filteredRows = rows.filter((row) => row.categorySlug === filterMode);
  else if (filterMode === "winners") filteredRows = rows.filter((row) => row.wins > 0);

  const matchingRows = normalizedQuery
    ? filteredRows.filter((row) => normalizeName(row.driver).includes(normalizedQuery))
    : filteredRows;
  const limited = !normalizedQuery && filterMode === "all" && !showAll;
  const visibleRows = limited ? matchingRows.slice(0, limit) : matchingRows;
  const mobileRows = visibleRows;
  const insanosCount = rows.filter((row) => row.categorySlug === "insanos").length;
  const rapidosCount = rows.filter((row) => row.categorySlug === "rapidos").length;
  const winnersCount = rows.filter((row) => row.wins > 0).length;
  const searchId = `classification-search-${labelledBy ?? "default"}`;
  const hintId = `${labelledBy ?? "classification"}-scroll-hint`;
  const summary = normalizedQuery
    ? `${matchingRows.length} ${matchingRows.length === 1 ? "piloto encontrado" : "pilotos encontrados"}`
    : filterMode !== "all"
      ? `${visibleRows.length} pilotos filtrados`
      : limited && rows.length > limit
        ? `${visibleRows.length} primeiros de ${rows.length} pilotos`
        : `${visibleRows.length} pilotos exibidos`;

  const chips: [FilterMode, string][] = [
    ["all", `Todos (${rows.length})`],
    ["top10", "Top 10"],
    ["insanos", `Ultras Insanos (${insanosCount})`],
    ["rapidos", `Ultras Rápidos (${rapidosCount})`],
    ["winners", `Vencedores (${winnersCount})`],
  ];

  return (
    <div className="udkr-table-frame">
      <div className="udkr-table-heading">
        <span>
          Pontos por prova · {races.length} {races.length === 1 ? "prova publicada" : "provas publicadas"}
        </span>
        <strong>{summary}</strong>
      </div>
      <div className="udkr-table-tools">
        <label htmlFor={searchId}>Encontrar piloto</label>
        <div className="udkr-search-control">
          <input
            id={searchId}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nome do piloto..."
            autoComplete="off"
          />
          {query ? (
            <button type="button" onClick={() => setQuery("")} aria-label="Limpar busca">
              <X size={14} aria-hidden="true" />
            </button>
          ) : null}
        </div>
        <div className="udkr-filter-chips" role="group" aria-label="Filtros rápidos de classificação">
          {chips.map(([mode, label]) => (
            <button
              type="button"
              key={mode}
              className={`udkr-chip ${filterMode === mode ? "is-active" : ""}`}
              aria-pressed={filterMode === mode}
              onClick={() => setFilterMode(mode)}
            >
              {label}
            </button>
          ))}
        </div>
        <span className="udkr-search-status" aria-live="polite">
          {normalizedQuery
            ? `Busca: ${summary}`
            : "Consulta rápida por nome, categoria ou filtro"}
        </span>
      </div>
      <ResultsReportMatrixKey />

      <div className="udkr-mobile-ranking" aria-labelledby={`${searchId}-mobile-title`}>
        <div className="udkr-mobile-ranking-heading">
          <h3 id={`${searchId}-mobile-title`}>Leitura rápida</h3>
          <span>{normalizedQuery || filterMode !== "all" ? "Resultado filtrado" : `${mobileRows.length} primeiros · busque pelo nome`}</span>
        </div>
        <ol>
          {mobileRows.map((row) => (
            <li key={`${row.position}-${row.slug}`}>
              <span className="udkr-mobile-ranking-position">{String(row.position).padStart(2, "0")}</span>
              <span className="udkr-mobile-ranking-driver">
                <strong>{row.driver}</strong>
                <small>
                  {row.category} · {row.wins} {row.wins === 1 ? "vitória" : "vitórias"} · {row.races}{" "}
                  {row.races === 1 ? "prova" : "provas"}
                </small>
              </span>
              <strong className="udkr-mobile-ranking-total">{row.points}</strong>
            </li>
          ))}
        </ol>
        {!mobileRows.length ? <p className="udkr-empty-state">Nenhum piloto corresponde aos critérios.</p> : null}
      </div>

      <ScoreDetail selected={selected} onClose={() => setSelected(null)} />

      {visibleRows.length ? (
        <>
          <p className="udkr-table-hint" id={hintId}>
            <span className="udkr-hint-icon">
              <ArrowLeftRight size={15} aria-hidden="true" />
            </span>{" "}
            Cada coluna é uma prova publicada, na ordem do calendário, com os pontos da posição geral
            (Art. 18) já com bônus e punições. Toque ou clique em uma pontuação para conferir a prova.
          </p>
          <div className="udkr-table-scroll" role="region" aria-label="Matriz de pontuação" aria-describedby={hintId} tabIndex={0}>
            <table className="udkr-classification-table" aria-labelledby={labelledBy}>
              <caption className="udkr-visually-hidden">
                Classificação da temporada UDK 2026 com os pontos de cada prova publicada.
              </caption>
              <thead>
                <tr className="udkr-table-band">
                  <th className="udkr-sticky-rank" rowSpan={2} scope="col">Pos.</th>
                  <th className="udkr-sticky-driver" rowSpan={2} scope="col">Piloto</th>
                  <th className="udkr-level-head" rowSpan={2} scope="col">Categoria</th>
                  <th className="udkr-meta-head" rowSpan={2} scope="col" aria-label="Provas disputadas">Provas</th>
                  <th className="udkr-meta-head" rowSpan={2} scope="col" aria-label="Pódios">Pód.</th>
                  <th colSpan={races.length} scope="colgroup">Pontos por prova · ordem do calendário</th>
                  <th className="udkr-total-head" rowSpan={2} scope="col">Total</th>
                  <th className="udkr-last-position" rowSpan={2} scope="col">Pos.</th>
                </tr>
                <tr className="udkr-table-columns">
                  {races.map((race) => (
                    <th key={race.id} scope="col" title={`${race.label} · ${race.date}`}>
                      <span>{race.shortLabel}</span>
                      <small>{race.date}</small>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row) => (
                  <tr key={`${row.position}-${row.slug}`}>
                    <td className="udkr-sticky-rank udkr-rank-value">
                      <strong>{String(row.position).padStart(2, "0")}</strong>
                    </td>
                    <td className="udkr-sticky-driver udkr-driver-value" title={row.driver}>
                      <strong>{row.driver}</strong>
                    </td>
                    <td className="udkr-level-cell">{row.category}</td>
                    <td className="udkr-number-cell">{row.races || "-"}</td>
                    <td className="udkr-number-cell">{row.podiums || "-"}</td>
                    {races.map((race) => (
                      <ScoreCell
                        key={`${row.slug}-${race.id}`}
                        row={row}
                        race={race}
                        cell={row.cells[race.id]}
                        selected={selected}
                        onSelect={setSelected}
                      />
                    ))}
                    <td
                      className="udkr-total-cell"
                      title={
                        row.discardedPoints
                          ? `Total ${row.points}: ${row.grossPoints} brutos − ${row.discardedPoints} descartados`
                          : `Total ${row.points} pontos`
                      }
                    >
                      <strong>{row.points}</strong>
                      <small>
                        {row.wins} vit. · {row.discardedPoints ? `${row.discardedPoints} desc.` : `${row.races} prov.`}
                      </small>
                    </td>
                    <td className="udkr-last-position udkr-rank-value">
                      <strong>{String(row.position).padStart(2, "0")}</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {limited && rows.length > limit ? (
            <p className="udkr-table-footnote">
              Mostrando os {limit} primeiros pilotos. Use a busca, os filtros ou o botão abaixo para ver a
              classificação completa.
            </p>
          ) : null}
          <p className="udkr-table-source">
            Fonte publicada: {races.length} {races.length === 1 ? "prova homologada" : "provas homologadas"}. Total =
            pontos válidos da classificação oficial da temporada.
          </p>
        </>
      ) : (
        <p className="udkr-table-no-results">
          Nenhum piloto corresponde aos filtros aplicados. Limpe a busca para restaurar a classificação.
        </p>
      )}
      {!normalizedQuery && filterMode === "all" && rows.length > limit ? (
        <div className="udkr-action-row udkr-action-row-end udkr-matrix-toggle">
          <button type="button" className="udkr-button udkr-button-primary" onClick={() => setShowAll(!showAll)}>
            {showAll ? `Mostrar só os ${limit} primeiros` : "Ver matriz completa"}
          </button>
          <a className="udkr-button" href="/classificacao">
            Classificação por categoria
          </a>
        </div>
      ) : null}
    </div>
  );
}

function cellMarks(cell: ReportCell): string[] {
  return [
    cell.position === 1 && !cell.notClassified ? "V" : null,
    cell.pole ? "P" : null,
    cell.fastestLap ? "MV" : null,
    cell.penaltyPoints ? `-${cell.penaltyPoints}` : null,
  ].filter((mark): mark is string => Boolean(mark));
}

function cellDescription(cell: ReportCell | undefined, race: ReportRace): string {
  if (!cell) return `Não correu ${race.label} (${race.date})`;
  const position = cell.notClassified ? "não classificado" : `${cell.position}º geral`;
  const extras = [
    cell.pole ? "pole +1" : null,
    cell.fastestLap ? "melhor volta +1" : null,
    cell.penaltyPoints ? `punição −${cell.penaltyPoints}` : null,
  ].filter(Boolean);
  return `${cell.points} pontos, ${position}${extras.length ? `, ${extras.join(", ")}` : ""}, ${race.label} (${race.date})`;
}

function ScoreCell({
  row,
  race,
  cell,
  selected,
  onSelect,
}: {
  row: ReportRow;
  race: ReportRace;
  cell: ReportCell | undefined;
  selected: SelectedScore | null;
  onSelect: (score: SelectedScore) => void;
}) {
  if (!cell) {
    return (
      <td className="udkr-score-cell is-missing" aria-label={cellDescription(undefined, race)}>
        <span aria-hidden="true">-</span>
      </td>
    );
  }
  const marks = cellMarks(cell);
  const isWin = cell.position === 1 && !cell.notClassified;
  const isSelected = selected?.row.slug === row.slug && selected.race.id === race.id;
  const label = cellDescription(cell, race);
  return (
    <td
      className={`udkr-score-cell is-ok${isWin ? " is-win" : ""}${cell.notClassified ? " is-dsq" : ""}${isSelected ? " is-selected" : ""}`}
    >
      <button
        type="button"
        className="udkr-score-trigger"
        aria-label={label}
        aria-pressed={isSelected}
        title={label}
        onClick={() => onSelect({ row, race, cell })}
      >
        <span>{cell.notClassified && cell.points === 0 ? "NC" : cell.points}</span>
        {marks.length ? <small>{marks.join(" ")}</small> : null}
      </button>
    </td>
  );
}

function ScoreDetail({ selected, onClose }: { selected: SelectedScore | null; onClose: () => void }) {
  if (!selected) {
    return (
      <p className="udkr-audit-detail" aria-live="polite">
        Selecione uma pontuação para conferir a prova, a posição, as voltas e o documento oficial.
      </p>
    );
  }
  const { row, race, cell } = selected;
  return (
    <div className="udkr-audit-detail is-active" aria-live="polite">
      <div>
        <span className="udkr-audit-label">Piloto</span>
        <strong>{row.driver}</strong>
        <small>{row.category}</small>
      </div>
      <div>
        <span className="udkr-audit-label">Prova</span>
        <strong>{race.label}</strong>
        <small>{race.date}</small>
      </div>
      <div>
        <span className="udkr-audit-label">Registro</span>
        <strong>{cellDescription(cell, race)}</strong>
        {cell ? (
          <small>
            {cell.laps} voltas · melhor volta {cell.bestLap}
          </small>
        ) : null}
      </div>
      <div className="udkr-audit-actions">
        <a className="udkr-text-link" href={`/pilotos/${row.slug}?resultado=${encodeURIComponent(race.id)}#volta-a-volta`}>
          Volta a volta
        </a>
        {race.pdfHref ? (
          <a className="udkr-text-link" href={race.pdfHref} target="_blank" rel="noreferrer">
            PDF da prova
          </a>
        ) : null}
        <button type="button" className="udkr-audit-close" onClick={onClose} aria-label="Fechar detalhe da pontuação">
          <X size={14} aria-hidden="true" /> Fechar
        </button>
      </div>
    </div>
  );
}
