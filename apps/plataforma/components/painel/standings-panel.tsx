"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  type StageInfo,
} from "./shared";

type Category = { id: string; name: string; slug: string };

type Line = {
  driverId: string;
  name: string;
  position: number;
  points: number;
  gross: number;
  discarded: number;
  wins: number;
  podiums: number;
  poles: number;
  /** pontos por etapa (soma das corridas da etapa), na ordem das etapas */
  byStage: (number | null)[];
};

export function StandingsPanel({ client }: { client: SupabaseClient }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [stages, setStages] = useState<StageInfo[]>([]);
  const [lines, setLines] = useState<Record<string, Line[]>>({});
  const [meta, setMeta] = useState<Record<string, { version: number; updatedAt: string }>>({});
  const [category, setCategory] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [stageList, categoryResult, standingsResult, entriesResult] = await Promise.all([
        loadStages(client),
        client.from("categories").select("id,name,slug").is("deleted_at", null).order("name"),
        client
          .from("standings")
          .select("category_id,driver_id,position,points,gross_points,wins,podiums,poles,version,updated_at,driver:drivers(sport_name,full_name,deleted_at)")
          .is("deleted_at", null)
          .in("status", ["provisional", "official", "rectified"]),
        client
          .from("result_entries")
          .select("driver_id,points,result:results!inner(stage_id,deleted_at)")
          .is("deleted_at", null)
          .is("result.deleted_at", null),
      ]);
      for (const result of [categoryResult, standingsResult, entriesResult])
        if (result.error) throw result.error;

      const stageIndex = new Map(stageList.map((stage, index) => [stage.id, index]));
      const perStage = new Map<string, (number | null)[]>();
      for (const row of (entriesResult.data ?? []) as unknown as {
        driver_id: string;
        points: number | null;
        result: { stage_id: string };
      }[]) {
        const index = stageIndex.get(row.result.stage_id);
        if (index === undefined) continue;
        const list = perStage.get(row.driver_id) ?? stageList.map(() => null);
        list[index] = (list[index] ?? 0) + Number(row.points ?? 0);
        perStage.set(row.driver_id, list);
      }

      type StandingRow = {
        category_id: string;
        driver_id: string;
        position: number;
        points: number;
        gross_points: number | null;
        wins: number;
        podiums: number;
        poles: number;
        version: number;
        updated_at: string;
        driver: { sport_name: string | null; full_name: string; deleted_at: string | null } | null;
      };
      const standings = (standingsResult.data ?? []) as unknown as StandingRow[];
      // só a versão mais recente de cada categoria é a classificação vigente
      const latest = new Map<string, number>();
      for (const row of standings) latest.set(row.category_id, Math.max(latest.get(row.category_id) ?? 0, row.version));
      const grouped: Record<string, Line[]> = {};
      const info: Record<string, { version: number; updatedAt: string }> = {};
      for (const row of standings) {
        if (row.version !== latest.get(row.category_id) || !row.driver || row.driver.deleted_at) continue;
        const points = Number(row.points);
        const gross = Number(row.gross_points ?? row.points);
        (grouped[row.category_id] ??= []).push({
          driverId: row.driver_id,
          name: row.driver.sport_name || row.driver.full_name,
          position: row.position,
          points,
          gross,
          discarded: Math.max(0, gross - points),
          wins: row.wins,
          podiums: row.podiums,
          poles: row.poles,
          byStage: perStage.get(row.driver_id) ?? stageList.map(() => null),
        });
        const current = info[row.category_id];
        if (!current || row.updated_at > current.updatedAt)
          info[row.category_id] = { version: row.version, updatedAt: row.updated_at };
      }
      const categoryList = (categoryResult.data ?? []).map((row) => ({
        id: String(row.id),
        name: String(row.name),
        slug: String(row.slug),
      }));
      setStages(stageList);
      setCategories(categoryList);
      setLines(grouped);
      setMeta(info);
      setCategory((current) => current || categoryList.find((item) => item.slug === "insanos")?.id || categoryList[0]?.id || "");
    } catch (loadError) {
      setError(errorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    void load();
  }, [load]);

  const scoredStages = useMemo(
    () => stages.map((stage, index) => ({ stage, index })).filter(({ index }) =>
      Object.values(lines).some((list) => list.some((line) => line.byStage[index] !== null)),
    ),
    [stages, lines],
  );

  const visible = useMemo(() => {
    const term = normalizeSearch(query);
    return (lines[category] ?? []).filter((line) => !term || normalizeSearch(line.name).includes(term));
  }, [lines, category, query]);

  const accessors = useMemo(() => {
    const base: Record<string, (line: Line) => number | string | null> = {
      position: (line) => line.position,
      name: (line) => line.name,
      points: (line) => line.points,
      gross: (line) => line.gross,
      discarded: (line) => line.discarded,
      wins: (line) => line.wins,
      podiums: (line) => line.podiums,
      poles: (line) => line.poles,
    };
    for (const { index } of scoredStages) base[`stage-${index}`] = (line) => line.byStage[index] ?? null;
    return base;
  }, [scoredStages]);

  const { sorted, sort, toggle } = useSortable<Line, string>(visible, accessors, { key: "position", direction: "asc" });
  const current = meta[category];

  return (
    <div className="pv-workspace">
      <div className="pv-toolbar">
        <Segmented
          label="Categoria"
          value={category}
          onChange={setCategory}
          options={categories.map((item) => ({ value: item.id, label: item.name }))}
        />
        <label className="search-box pv-search">
          <Search aria-hidden="true" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar piloto" aria-label="Buscar piloto" />
        </label>
        <button type="button" className="button-secondary" onClick={() => void load()}>
          <RefreshCw aria-hidden="true" /> Atualizar
        </button>
      </div>

      <PanelState loading={loading} error={error} empty={!loading && !visible.length ? "Nenhum piloto classificado nessa categoria." : undefined}>
        <section className="data-card">
          <div className="data-card-head">
            <div>
              <strong>{visible.length}</strong>
              <span>pilotos</span>
            </div>
            <p className="pv-note">
              {current
                ? `Classificação vigente · versão ${current.version} · recalculada em ${new Date(current.updatedAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" })}. Válidos = brutos menos os 2 piores resultados regulares (Art. 20).`
                : "Classificação vigente."}
            </p>
          </div>
          <div className="table-scroll">
            <table className="admin-table pv-table">
              <thead>
                <tr>
                  <SortHeader label="Pos." column="position" sort={sort} onSort={toggle} />
                  <SortHeader label="Piloto" column="name" sort={sort} onSort={toggle} />
                  {scoredStages.map(({ stage, index }) => (
                    <SortHeader
                      key={stage.id}
                      label={`${stage.ordinal} etapa`}
                      column={`stage-${index}`}
                      sort={sort}
                      onSort={toggle}
                      align="end"
                      firstDirection="desc"
                      title={`${stage.title} · ${stage.shortDate}`}
                    />
                  ))}
                  <SortHeader label="Brutos" column="gross" sort={sort} onSort={toggle} align="end" firstDirection="desc" />
                  <SortHeader label="Descartes" column="discarded" sort={sort} onSort={toggle} align="end" firstDirection="desc" />
                  <SortHeader label="Válidos" column="points" sort={sort} onSort={toggle} align="end" firstDirection="desc" />
                  <SortHeader label="Vitórias" column="wins" sort={sort} onSort={toggle} align="end" firstDirection="desc" />
                  <SortHeader label="Pódios" column="podiums" sort={sort} onSort={toggle} align="end" firstDirection="desc" />
                  <SortHeader label="Poles" column="poles" sort={sort} onSort={toggle} align="end" firstDirection="desc" />
                </tr>
              </thead>
              <tbody>
                {sorted.map((line) => (
                  <tr key={line.driverId}>
                    <td>
                      <span className={`pv-pos${line.position <= 3 ? " is-podium" : ""}`}>{line.position}</span>
                    </td>
                    <th scope="row" className="pv-row-head">
                      {line.name}
                    </th>
                    {scoredStages.map(({ stage, index }) => (
                      <td key={stage.id} className="pv-num">
                        {line.byStage[index] === null ? <span className="pv-muted">—</span> : formatPoints(line.byStage[index])}
                      </td>
                    ))}
                    <td className="pv-num">{formatPoints(line.gross)}</td>
                    <td className="pv-num">{line.discarded ? `−${formatPoints(line.discarded)}` : <span className="pv-muted">—</span>}</td>
                    <td className="pv-num pv-strong">{formatPoints(line.points)}</td>
                    <td className="pv-num">{line.wins}</td>
                    <td className="pv-num">{line.podiums}</td>
                    <td className="pv-num">{line.poles}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </PanelState>
    </div>
  );
}
