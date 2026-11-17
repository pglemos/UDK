"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { RefreshCw, Search } from "lucide-react";
import {
  PanelState,
  Segmented,
  SortHeader,
  errorMessage,
  formatLap,
  loadStages,
  normalizeSearch,
  useSortable,
  type StageInfo,
} from "./shared";

type Race = { stageId: string; stage: StageInfo; session: string; fastestMs: number | null };

type Run = {
  id: string;
  kart: number;
  driver: string;
  category: string;
  laps: number;
  bestMs: number | null;
  position: number;
  race: Race;
  /** % acima da melhor volta da corrida: compara karts entre traçados diferentes. */
  gapPct: number | null;
};

type KartRow = {
  kart: number;
  races: number;
  bestMs: number | null;
  bestBy: string;
  bestWhere: string;
  avgGapPct: number | null;
  worstGapPct: number | null;
  lastSeen: string;
};

function raceLabel(race: Race): string {
  const name = race.session.replace(" - Horário", "").replace(" - Anti-horário", "");
  return `${race.stage.ordinal} etapa · ${name}`;
}

function formatGap(value: number | null): string {
  if (value === null) return "—";
  return value === 0 ? "melhor da corrida" : `+${value.toFixed(2).replace(".", ",")}%`;
}

export function KartsPanel({ client }: { client: SupabaseClient }) {
  const [stages, setStages] = useState<StageInfo[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [view, setView] = useState<"karts" | "corridas">("karts");
  const [stageFilter, setStageFilter] = useState("todas");
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const stageList = await loadStages(client);
      const { data, error: entriesError } = await client
        .from("result_entries")
        .select(
          "id,kart_number,laps,best_lap_ms,position,driver:drivers(sport_name,full_name,category:categories(name)),result:results!inner(stage_id,deleted_at,session:sessions!results_session_id_fkey(name))",
        )
        .is("deleted_at", null)
        .is("result.deleted_at", null)
        .not("kart_number", "is", null);
      if (entriesError) throw entriesError;

      const byId = new Map(stageList.map((stage) => [stage.id, stage]));
      type Row = {
        id: string;
        kart_number: number;
        laps: number | null;
        best_lap_ms: number | null;
        position: number;
        driver: { sport_name: string | null; full_name: string; category: { name: string } | null } | null;
        result: { stage_id: string; session: { name: string } | null };
      };
      const rows = (data ?? []) as unknown as Row[];
      const fastest = new Map<string, number>();
      for (const row of rows) {
        const key = `${row.result.stage_id}|${row.result.session?.name ?? ""}`;
        if (row.best_lap_ms && row.best_lap_ms > 0)
          fastest.set(key, Math.min(fastest.get(key) ?? Infinity, row.best_lap_ms));
      }
      const built: Run[] = [];
      for (const row of rows) {
        const stage = byId.get(row.result.stage_id);
        if (!stage) continue;
        const session = row.result.session?.name ?? "Corrida";
        const fastestMs = fastest.get(`${row.result.stage_id}|${session}`) ?? null;
        const bestMs = row.best_lap_ms && row.best_lap_ms > 0 ? row.best_lap_ms : null;
        built.push({
          id: row.id,
          kart: row.kart_number,
          driver: row.driver?.sport_name || row.driver?.full_name || "Piloto",
          category: row.driver?.category?.name ?? "—",
          laps: row.laps ?? 0,
          bestMs,
          position: row.position,
          race: { stageId: stage.id, stage, session, fastestMs },
          gapPct: bestMs && fastestMs ? ((bestMs - fastestMs) / fastestMs) * 100 : null,
        });
      }
      setStages(stageList);
      setRuns(built);
    } catch (loadError) {
      setError(errorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    void load();
  }, [load]);

  const stagesWithRuns = useMemo(
    () => stages.filter((stage) => runs.some((run) => run.race.stageId === stage.id)),
    [stages, runs],
  );

  const filteredRuns = useMemo(() => {
    const term = normalizeSearch(query);
    return runs.filter((run) => {
      if (stageFilter !== "todas" && run.race.stageId !== stageFilter) return false;
      if (!term) return true;
      return (
        String(run.kart).includes(term) ||
        normalizeSearch(run.driver).includes(term) ||
        normalizeSearch(raceLabel(run.race)).includes(term)
      );
    });
  }, [runs, stageFilter, query]);

  const kartRows = useMemo<KartRow[]>(() => {
    const groups = new Map<number, Run[]>();
    for (const run of filteredRuns) groups.set(run.kart, [...(groups.get(run.kart) ?? []), run]);
    return Array.from(groups.entries()).map(([kart, list]) => {
      const timed = list.filter((run) => run.bestMs !== null);
      const best = timed.reduce<Run | null>(
        (acc, run) => (!acc || (run.bestMs ?? Infinity) < (acc.bestMs ?? Infinity) ? run : acc),
        null,
      );
      const gaps = list.map((run) => run.gapPct).filter((gap): gap is number => gap !== null);
      const latest = [...list].sort((a, b) =>
        b.race.stage.startsAt.localeCompare(a.race.stage.startsAt),
      )[0];
      return {
        kart,
        races: list.length,
        bestMs: best?.bestMs ?? null,
        bestBy: best?.driver ?? "—",
        bestWhere: best ? raceLabel(best.race) : "—",
        avgGapPct: gaps.length ? gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length : null,
        worstGapPct: gaps.length ? Math.max(...gaps) : null,
        lastSeen: latest ? `${latest.race.stage.ordinal} etapa` : "—",
      };
    });
  }, [filteredRuns]);

  const kartSort = useSortable(
    kartRows,
    {
      kart: (row) => row.kart,
      races: (row) => row.races,
      best: (row) => row.bestMs,
      avg: (row) => row.avgGapPct,
      worst: (row) => row.worstGapPct,
    },
    { key: "avg", direction: "asc" },
  );

  const runSort = useSortable(
    filteredRuns,
    {
      race: (run) => `${run.race.stage.startsAt}|${run.race.session}`,
      kart: (run) => run.kart,
      driver: (run) => run.driver,
      best: (run) => run.bestMs,
      gap: (run) => run.gapPct,
      position: (run) => run.position,
      laps: (run) => run.laps,
    },
    { key: "best", direction: "asc" },
  );

  const singleStage = stageFilter !== "todas";

  return (
    <div className="pv-workspace">
      <div className="pv-toolbar">
        <Segmented
          label="Visualização"
          value={view}
          onChange={setView}
          options={[
            { value: "karts", label: "Por kart" },
            { value: "corridas", label: "Por corrida" },
          ]}
        />
        <Segmented
          label="Etapa"
          value={stageFilter}
          onChange={setStageFilter}
          options={[
            { value: "todas", label: "Campeonato" },
            ...stagesWithRuns.map((stage) => ({
              value: stage.id,
              label: `${stage.ordinal} etapa`,
              hint: `${stage.title} · ${stage.shortDate}`,
            })),
          ]}
        />
        <label className="search-box pv-search">
          <Search aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Kart ou piloto"
            aria-label="Buscar kart ou piloto"
          />
        </label>
        <button type="button" className="button-secondary" onClick={() => void load()}>
          <RefreshCw aria-hidden="true" /> Atualizar
        </button>
      </div>

      <PanelState
        loading={loading}
        error={error}
        empty={!loading && !filteredRuns.length ? "Nenhum kart encontrado nesse filtro." : undefined}
      >
        {view === "karts" ? (
          <section className="data-card">
            <div className="data-card-head">
              <div>
                <strong>{kartRows.length}</strong>
                <span>karts usados</span>
              </div>
              <p className="pv-note">
                {singleStage
                  ? "Ritmo = quanto a melhor volta ficou acima da volta mais rápida da corrida."
                  : "Cada etapa tem um traçado; o ritmo compara cada volta com a mais rápida da mesma corrida."}
              </p>
            </div>
            <div className="table-scroll">
              <table className="admin-table pv-table">
                <thead>
                  <tr>
                    <SortHeader label="Kart" column="kart" sort={kartSort.sort} onSort={kartSort.toggle} />
                    <SortHeader label="Corridas" column="races" sort={kartSort.sort} onSort={kartSort.toggle} align="end" firstDirection="desc" />
                    <SortHeader label="Melhor volta" column="best" sort={kartSort.sort} onSort={kartSort.toggle} align="end" />
                    <th scope="col">Feita por</th>
                    <SortHeader
                      label="Ritmo médio"
                      column="avg"
                      sort={kartSort.sort}
                      onSort={kartSort.toggle}
                      align="end"
                      title="Média de quanto a melhor volta do kart ficou acima da mais rápida de cada corrida"
                    />
                    <SortHeader label="Pior corrida" column="worst" sort={kartSort.sort} onSort={kartSort.toggle} align="end" firstDirection="desc" />
                    <th scope="col">Último uso</th>
                  </tr>
                </thead>
                <tbody>
                  {kartSort.sorted.map((row) => (
                    <tr key={row.kart}>
                      <td>
                        <span className="pv-kart">{row.kart}</span>
                      </td>
                      <td className="pv-num">{row.races}</td>
                      <td className="pv-num pv-strong">{formatLap(row.bestMs)}</td>
                      <td>
                        <span className="pv-stack">
                          <b>{row.bestBy}</b>
                          <small>{row.bestWhere}</small>
                        </span>
                      </td>
                      <td className="pv-num">{formatGap(row.avgGapPct)}</td>
                      <td className="pv-num">{formatGap(row.worstGapPct)}</td>
                      <td>{row.lastSeen}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : (
          <section className="data-card">
            <div className="data-card-head">
              <div>
                <strong>{filteredRuns.length}</strong>
                <span>sorteios</span>
              </div>
              <p className="pv-note">Kart sorteado para cada piloto em cada corrida e a melhor volta feita com ele.</p>
            </div>
            <div className="table-scroll">
              <table className="admin-table pv-table">
                <thead>
                  <tr>
                    <SortHeader label="Corrida" column="race" sort={runSort.sort} onSort={runSort.toggle} />
                    <SortHeader label="Kart" column="kart" sort={runSort.sort} onSort={runSort.toggle} />
                    <SortHeader label="Piloto" column="driver" sort={runSort.sort} onSort={runSort.toggle} />
                    <SortHeader label="Melhor volta" column="best" sort={runSort.sort} onSort={runSort.toggle} align="end" />
                    <SortHeader label="Ritmo" column="gap" sort={runSort.sort} onSort={runSort.toggle} align="end" />
                    <SortHeader label="Chegada" column="position" sort={runSort.sort} onSort={runSort.toggle} align="end" />
                    <SortHeader label="Voltas" column="laps" sort={runSort.sort} onSort={runSort.toggle} align="end" firstDirection="desc" />
                  </tr>
                </thead>
                <tbody>
                  {runSort.sorted.map((run) => (
                    <tr key={run.id}>
                      <td>{raceLabel(run.race)}</td>
                      <td>
                        <span className="pv-kart">{run.kart}</span>
                      </td>
                      <td>
                        <span className="pv-stack">
                          <b>{run.driver}</b>
                          <small>{run.category}</small>
                        </span>
                      </td>
                      <td className="pv-num pv-strong">{formatLap(run.bestMs)}</td>
                      <td className="pv-num">{formatGap(run.gapPct)}</td>
                      <td className="pv-num">{run.position}º</td>
                      <td className="pv-num">{run.laps}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </PanelState>
    </div>
  );
}
