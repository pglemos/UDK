"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { RefreshCw, Search } from "lucide-react";
import {
  PanelState,
  Segmented,
  SortHeader,
  errorMessage,
  formatPoints,
  loadStages,
  normalizeSearch,
  useSortable,
} from "./shared";

type Race = { id: string; label: string; title: string; order: string };
type Cell = { position: number; points: number; pole: boolean; fastest: boolean; penalty: number; status: string };
type Row = { driverId: string; name: string; category: string; categorySlug: string; cells: Record<string, Cell>; total: number; races: number };

function raceShort(session: string, format: string): string {
  if (format === "endurance" || /endurance/i.test(session)) return "Endurance";
  const match = /corrida\s*(\d)/i.exec(session);
  return match ? `C${match[1]}` : session;
}

export function PositionsMatrix({ client, editor }: { client: SupabaseClient; editor?: ReactNode }) {
  const [races, setRaces] = useState<Race[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [category, setCategory] = useState("todas");
  const [view, setView] = useState<"pontos" | "posicao">("pontos");
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const stages = await loadStages(client);
      const { data, error: loadError } = await client
        .from("result_entries")
        .select(
          "result_id,position,points,pole,fastest_lap,penalty_points,penalty_ms,status,driver_id,driver:drivers(sport_name,full_name,category:categories(name,slug)),result:results!inner(id,stage_id,deleted_at,session:sessions!results_session_id_fkey(name,starts_at,kind))",
        )
        .is("deleted_at", null)
        .is("result.deleted_at", null);
      if (loadError) throw loadError;
      type Entry = {
        result_id: string;
        position: number;
        points: number | null;
        pole: boolean;
        fastest_lap: boolean;
        penalty_points: number | null;
        penalty_ms: number | null;
        status: string;
        driver_id: string;
        driver: { sport_name: string | null; full_name: string; category: { name: string; slug: string } | null } | null;
        result: { id: string; stage_id: string; session: { name: string; starts_at: string | null; kind: string | null } | null };
      };
      // tomada de tempo não pontua: a tabela é só das provas que valem para a classificação
      const entries = ((data ?? []) as unknown as Entry[]).filter((entry) => entry.result.session?.kind !== "qualifying");
      const stageById = new Map(stages.map((stage) => [stage.id, stage]));
      const raceMap = new Map<string, Race>();
      for (const entry of entries) {
        if (raceMap.has(entry.result.id)) continue;
        const stage = stageById.get(entry.result.stage_id);
        const session = entry.result.session?.name ?? "Corrida";
        raceMap.set(entry.result.id, {
          id: entry.result.id,
          label: `${stage?.ordinal ?? "?"} · ${raceShort(session, stage?.format ?? "").replace(/^C(\d)$/, "Corrida $1")}`,
          title: `${stage?.title ?? "Etapa"} · ${session}${stage ? ` · ${stage.shortDate}` : ""}`,
          order: `${stage?.startsAt ?? ""}|${entry.result.session?.starts_at ?? session}`,
        });
      }
      const rowMap = new Map<string, Row>();
      for (const entry of entries) {
        const row =
          rowMap.get(entry.driver_id) ??
          {
            driverId: entry.driver_id,
            name: entry.driver?.sport_name || entry.driver?.full_name || "Piloto",
            category: entry.driver?.category?.name ?? "—",
            categorySlug: entry.driver?.category?.slug ?? "",
            cells: {},
            total: 0,
            races: 0,
          };
        const points = Number(entry.points ?? 0);
        row.cells[entry.result_id] = {
          position: entry.position,
          points,
          pole: entry.pole,
          fastest: entry.fastest_lap,
          penalty: Number(entry.penalty_points ?? 0),
          status: entry.status,
        };
        row.total += points;
        row.races += 1;
        rowMap.set(entry.driver_id, row);
      }
      setRaces(Array.from(raceMap.values()).sort((a, b) => a.order.localeCompare(b.order)));
      setRows(Array.from(rowMap.values()));
    } catch (loadError) {
      setError(errorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = useMemo(() => {
    const term = normalizeSearch(query);
    return rows
      .filter((row) => category === "todas" || row.categorySlug === category)
      .filter((row) => !term || normalizeSearch(row.name).includes(term));
  }, [rows, category, query]);

  const accessors = useMemo(() => {
    const base: Record<string, (row: Row) => number | string | null> = {
      name: (row) => row.name,
      category: (row) => row.category,
      total: (row) => row.total,
      races: (row) => row.races,
    };
    for (const race of races)
      base[race.id] = (row) => {
        const cell = row.cells[race.id];
        if (!cell) return null;
        return view === "pontos" ? cell.points : cell.position;
      };
    return base;
  }, [races, view]);

  const { sorted, sort, toggle } = useSortable<Row, string>(visible, accessors, { key: "total", direction: "desc" });

  return (
    <div className="pv-workspace">
      <div className="pv-toolbar">
        <Segmented
          label="Categoria"
          value={category}
          onChange={setCategory}
          options={[
            { value: "todas", label: "Geral" },
            { value: "insanos", label: "Ultras Insanos" },
            { value: "rapidos", label: "Ultras Rápidos" },
          ]}
        />
        <Segmented
          label="Mostrar"
          value={view}
          onChange={setView}
          options={[
            { value: "pontos", label: "Pontos" },
            { value: "posicao", label: "Posição" },
          ]}
        />
        <label className="search-box pv-search">
          <Search aria-hidden="true" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar piloto" aria-label="Buscar piloto" />
        </label>
        <button type="button" className="button-secondary" onClick={() => void load()}>
          <RefreshCw aria-hidden="true" /> Atualizar
        </button>
      </div>

      <PanelState loading={loading} error={error} empty={!loading && !visible.length ? "Nenhum resultado nesse filtro." : undefined}>
        <section className="data-card">
          <div className="data-card-head">
            <div>
              <strong>{visible.length}</strong>
              <span>pilotos · {races.length} provas</span>
            </div>
            <ul className="pv-legend" aria-label="Legenda">
              <li><b>P</b> pole (+1)</li>
              <li><b>MV</b> melhor volta (+1)</li>
              <li><b>−10</b> pontos de penalidade</li>
              <li>Total sem descartes; os válidos estão em Classificação</li>
            </ul>
          </div>
          <div className="table-scroll">
            <table className="admin-table pv-table pv-positions">
              <thead>
                <tr>
                  <SortHeader label="Piloto" column="name" sort={sort} onSort={toggle} />
                  <SortHeader label="Categoria" column="category" sort={sort} onSort={toggle} />
                  <SortHeader label="Provas" column="races" sort={sort} onSort={toggle} align="end" firstDirection="desc" />
                  <SortHeader label="Total" column="total" sort={sort} onSort={toggle} align="end" firstDirection="desc" />
                  {races.map((race) => (
                    <SortHeader
                      key={race.id}
                      label={race.label}
                      column={race.id}
                      sort={sort}
                      onSort={toggle}
                      align="end"
                      firstDirection={view === "pontos" ? "desc" : "asc"}
                      title={race.title}
                    />
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((row) => (
                  <tr key={row.driverId}>
                    <th scope="row" className="pv-row-head">
                      {row.name}
                    </th>
                    <td>{row.category}</td>
                    <td className="pv-num">{row.races}</td>
                    <td className="pv-num pv-strong">{formatPoints(row.total)}</td>
                    {races.map((race) => {
                      const cell = row.cells[race.id];
                      if (!cell) return <td key={race.id} className="pv-num pv-muted">—</td>;
                      const marks = [cell.pole ? "P" : "", cell.fastest ? "MV" : "", cell.penalty ? `−${formatPoints(cell.penalty)}` : ""]
                        .filter(Boolean)
                        .join(" ");
                      return (
                        <td key={race.id} className="pv-num" title={`${race.title}: ${cell.position}º, ${formatPoints(cell.points)} pts`}>
                          <span className="pv-cell">
                            <b>{view === "pontos" ? formatPoints(cell.points) : `${cell.position}º`}</b>
                            <small>
                              {view === "pontos" ? `${cell.position}º` : `${formatPoints(cell.points)} pts`}
                              {marks ? ` · ${marks}` : ""}
                            </small>
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        {editor ? (
          <details className="pv-details">
            <summary>Corrigir uma posição (uso da organização)</summary>
            {editor}
          </details>
        ) : null}
      </PanelState>
    </div>
  );
}
