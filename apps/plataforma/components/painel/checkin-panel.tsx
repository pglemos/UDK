"use client";

import { confirmAction } from "../../lib/confirm-action";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Check, Minus, RefreshCw, Search, X } from "lucide-react";
import {
  PanelState,
  Segmented,
  SortHeader,
  errorMessage,
  loadStages,
  normalizeSearch,
  useSortable,
  type StageInfo,
} from "./shared";

type Status = "present" | "absent" | "excused";
type Cell = { id: string; status: string };
type Pilot = { id: string; name: string; category: string; categorySlug: string };

/** Ordem do clique: vazio → presente → faltou → justificada → vazio. */
const cycle: (Status | null)[] = [null, "present", "absent", "excused"];

const statusInfo: Record<string, { label: string; short: string; tone: string }> = {
  present: { label: "Presente", short: "Presente", tone: "is-present" },
  late: { label: "Atrasado", short: "Atrasado", tone: "is-present" },
  absent: { label: "Faltou", short: "Faltou", tone: "is-absent" },
  excused: { label: "Falta justificada", short: "Justificada", tone: "is-excused" },
  blocked: { label: "Bloqueado", short: "Bloqueado", tone: "is-absent" },
  expected: { label: "Esperado", short: "Esperado", tone: "" },
};

function StatusIcon({ status }: { status: string | undefined }) {
  if (status === "present" || status === "late") return <Check aria-hidden="true" />;
  if (status === "absent" || status === "blocked") return <X aria-hidden="true" />;
  if (status === "excused") return <Minus aria-hidden="true" />;
  return null;
}

export function CheckinPanel({ client, readOnly }: { client: SupabaseClient; readOnly: boolean }) {
  const [stages, setStages] = useState<StageInfo[]>([]);
  const [pilots, setPilots] = useState<Pilot[]>([]);
  const [cells, setCells] = useState<Map<string, Cell>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState<string | null>(null);
  const [category, setCategory] = useState("todas");
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [stageList, driversResult, checkinsResult] = await Promise.all([
        loadStages(client),
        client
          .from("drivers")
          .select("id,sport_name,full_name,status,category:categories(name,slug)")
          .is("deleted_at", null)
          .neq("status", "archived"),
        client.from("checkins").select("id,stage_id,driver_id,status").is("deleted_at", null),
      ]);
      if (driversResult.error) throw driversResult.error;
      if (checkinsResult.error) throw checkinsResult.error;
      type DriverRow = {
        id: string;
        sport_name: string | null;
        full_name: string;
        category: { name: string; slug: string } | null;
      };
      setStages(stageList);
      setPilots(
        ((driversResult.data ?? []) as unknown as DriverRow[]).map((row) => ({
          id: row.id,
          name: row.sport_name || row.full_name,
          category: row.category?.name ?? "—",
          categorySlug: row.category?.slug ?? "",
        })),
      );
      const map = new Map<string, Cell>();
      for (const row of checkinsResult.data ?? [])
        map.set(`${row.driver_id}|${row.stage_id}`, { id: String(row.id), status: String(row.status) });
      setCells(map);
    } catch (loadError) {
      setError(errorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    void load();
  }, [load]);

  const [now] = useState(() => Date.now());
  const pastStages = useMemo(
    () => stages.filter((stage) => new Date(stage.startsAt).getTime() <= now),
    [stages, now],
  );

  const rows = useMemo(() => {
    const term = normalizeSearch(query);
    return pilots
      .filter((pilot) => category === "todas" || pilot.categorySlug === category)
      .filter((pilot) => !term || normalizeSearch(pilot.name).includes(term))
      .map((pilot) => {
        const present = pastStages.filter((stage) => {
          const status = cells.get(`${pilot.id}|${stage.id}`)?.status;
          return status === "present" || status === "late";
        }).length;
        return { ...pilot, present };
      });
  }, [pilots, pastStages, cells, category, query]);

  const { sorted, sort, toggle } = useSortable(
    rows,
    { name: (row) => row.name, category: (row) => row.category, present: (row) => row.present },
    { key: "name", direction: "asc" },
  );

  async function cycleCell(pilot: Pilot, stage: StageInfo) {
    if (readOnly) return;
    const key = `${pilot.id}|${stage.id}`;
    const current = cells.get(key);
    const index = cycle.indexOf((current?.status as Status) ?? null);
    const next = cycle[(index + 1) % cycle.length] ?? null;
    setSaving(key);
    setError("");
    try {
      const nextCells = new Map(cells);
      if (current && next) {
        const { error: updateError } = await client
          .from("checkins")
          .update({
            status: next,
            checked_in_at: next === "present" ? new Date(stage.startsAt).toISOString() : null,
          })
          .eq("id", current.id);
        if (updateError) throw updateError;
        nextCells.set(key, { id: current.id, status: next });
      } else if (current && !next) {
        const { error: deleteError } = await client
          .from("checkins")
          .update({ deleted_at: new Date().toISOString() })
          .eq("id", current.id);
        if (deleteError) throw deleteError;
        nextCells.delete(key);
      } else if (next) {
        const { data, error: insertError } = await client
          .from("checkins")
          .insert({
            stage_id: stage.id,
            driver_id: pilot.id,
            status: next,
            checked_in_at: next === "present" ? new Date(stage.startsAt).toISOString() : null,
          })
          .select("id")
          .single();
        if (insertError) throw insertError;
        nextCells.set(key, { id: String(data.id), status: next });
      }
      setCells(nextCells);
    } catch (saveError) {
      setError(errorMessage(saveError));
    } finally {
      setSaving(null);
    }
  }

  /** Marca como presente quem ainda não tem registro na etapa (só a lista filtrada). */
  async function markAllPresent(stage: StageInfo) {
    if (readOnly) return;
    const missing = rows.filter((row) => !cells.get(`${row.id}|${stage.id}`));
    if (!missing.length) return;
    const ok = await confirmAction(
      `Marcar ${missing.length} piloto(s) como presentes na ${stage.ordinal} etapa? Quem já tem registro não muda.`,
      "Marcar presentes",
    );
    if (!ok) return;
    setSaving(`todos|${stage.id}`);
    setError("");
    try {
      const { data, error: insertError } = await client
        .from("checkins")
        .insert(
          missing.map((row) => ({
            stage_id: stage.id,
            driver_id: row.id,
            status: "present",
            checked_in_at: new Date(stage.startsAt).toISOString(),
          })),
        )
        .select("id,driver_id");
      if (insertError) throw insertError;
      const nextCells = new Map(cells);
      for (const row of data ?? []) nextCells.set(`${row.driver_id}|${stage.id}`, { id: String(row.id), status: "present" });
      setCells(nextCells);
      setLastBulk({ stageId: stage.id, label: `${stage.ordinal} etapa`, ids: (data ?? []).map((row) => String(row.id)), drivers: (data ?? []).map((row) => String(row.driver_id)) });
    } catch (saveError) {
      setError(errorMessage(saveError));
    } finally {
      setSaving(null);
    }
  }

  const [lastBulk, setLastBulk] = useState<{ stageId: string; label: string; ids: string[]; drivers: string[] } | null>(null);

  async function undoBulk() {
    if (!lastBulk) return;
    setSaving("desfazer");
    setError("");
    try {
      const { error: undoError } = await client
        .from("checkins")
        .update({ deleted_at: new Date().toISOString() })
        .in("id", lastBulk.ids);
      if (undoError) throw undoError;
      const nextCells = new Map(cells);
      for (const driver of lastBulk.drivers) nextCells.delete(`${driver}|${lastBulk.stageId}`);
      setCells(nextCells);
      setLastBulk(null);
    } catch (undoFailure) {
      setError(errorMessage(undoFailure));
    } finally {
      setSaving(null);
    }
  }

  const totals = useMemo(
    () =>
      stages.map(
        (stage) =>
          rows.filter((row) => {
            const status = cells.get(`${row.id}|${stage.id}`)?.status;
            return status === "present" || status === "late";
          }).length,
      ),
    [stages, rows, cells],
  );

  return (
    <div className="pv-workspace">
      <div className="pv-toolbar">
        <Segmented
          label="Categoria"
          value={category}
          onChange={setCategory}
          options={[
            { value: "todas", label: "Todos" },
            { value: "insanos", label: "Ultras Insanos" },
            { value: "rapidos", label: "Ultras Rápidos" },
          ]}
        />
        <label className="search-box pv-search">
          <Search aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar piloto"
            aria-label="Buscar piloto"
          />
        </label>
        <button type="button" className="button-secondary" onClick={() => void load()}>
          <RefreshCw aria-hidden="true" /> Atualizar
        </button>
      </div>

      {error && !loading ? (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      ) : null}

      {lastBulk ? (
        <div className="alert pv-undo" role="status">
          <span>
            {lastBulk.ids.length} piloto(s) marcados como presentes na {lastBulk.label}.
          </span>
          <button type="button" className="button-secondary pv-small" onClick={() => void undoBulk()} disabled={saving !== null}>
            Desfazer
          </button>
          <button type="button" className="pv-link-button" onClick={() => setLastBulk(null)}>
            Fechar
          </button>
        </div>
      ) : null}

      <PanelState loading={loading} error="" empty={!loading && !rows.length ? "Nenhum piloto nesse filtro." : undefined}>
        <section className="data-card">
          <div className="data-card-head">
            <div>
              <strong>{rows.length}</strong>
              <span>pilotos</span>
            </div>
            <ul className="pv-legend" aria-label="Legenda">
              <li><span className="pv-mark is-present"><Check aria-hidden="true" /></span> Presente</li>
              <li><span className="pv-mark is-absent"><X aria-hidden="true" /></span> Faltou</li>
              <li><span className="pv-mark is-excused"><Minus aria-hidden="true" /></span> Justificada</li>
              <li><span className="pv-mark is-empty">·</span> {readOnly ? "Sem registro" : "A marcar (clique para trocar)"}</li>
            </ul>
          </div>
          <div className="table-scroll">
            <table className="admin-table pv-table pv-matrix">
              <thead>
                <tr>
                  <SortHeader label="Piloto" column="name" sort={sort} onSort={toggle} />
                  <SortHeader label="Categoria" column="category" sort={sort} onSort={toggle} />
                  {stages.map((stage) => (
                    <th scope="col" key={stage.id} className="pv-center" title={stage.title}>
                      <span className="pv-stage-head">
                        <b>{stage.ordinal} etapa</b>
                        <small>{stage.shortDate}</small>
                        {!readOnly && new Date(stage.startsAt).getTime() <= now ? (
                          <button
                            type="button"
                            className="pv-link-button"
                            disabled={saving !== null || rows.every((row) => cells.get(`${row.id}|${stage.id}`))}
                            onClick={() => void markAllPresent(stage)}
                            title="Marca presente quem ainda está sem registro nesta etapa"
                          >
                            Todos presentes
                          </button>
                        ) : null}
                      </span>
                    </th>
                  ))}
                  <SortHeader
                    label="Presenças"
                    column="present"
                    sort={sort}
                    onSort={toggle}
                    align="end"
                    firstDirection="desc"
                  />
                </tr>
              </thead>
              <tbody>
                {sorted.map((row) => (
                  <tr key={row.id}>
                    <th scope="row" className="pv-row-head">
                      {row.name}
                    </th>
                    <td>{row.category}</td>
                    {stages.map((stage) => {
                      const key = `${row.id}|${stage.id}`;
                      const status = cells.get(key)?.status;
                      const info = status ? statusInfo[status] : undefined;
                      return (
                        <td key={stage.id} className="pv-center" data-label={`${stage.ordinal} etapa`}>
                          <button
                            type="button"
                            className={`pv-mark ${info?.tone ?? "is-empty"}`}
                            onClick={() => void cycleCell(row, stage)}
                            disabled={readOnly || saving === key}
                            aria-label={`${row.name}, ${stage.ordinal} etapa: ${info?.label ?? "sem registro"}`}
                            title={info?.label ?? "Sem registro"}
                          >
                            <StatusIcon status={status} />
                            <span>{info?.short ?? (new Date(stage.startsAt).getTime() <= now ? "A marcar" : "—")}</span>
                          </button>
                        </td>
                      );
                    })}
                    <td className="pv-num pv-strong">
                      {row.present}/{pastStages.length}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th scope="row" colSpan={2}>
                    Presentes por etapa
                  </th>
                  {totals.map((total, index) => (
                    <td key={stages[index]?.id ?? index} className="pv-center pv-strong">
                      {total}
                    </td>
                  ))}
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </section>
      </PanelState>
    </div>
  );
}
