"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Download, RefreshCw } from "lucide-react";
import { lapsHtml, loadRaceReport, openPdf, pdfFileName, resultHtml } from "../../lib/timing-pdf";
import { PanelState, Segmented, errorMessage, formatLap, loadStages, type StageInfo } from "./shared";

type Race = { id: string; stageId: string; label: string; startsAt: string };
type Entry = {
  id: string;
  position: number;
  driver: string;
  category: string;
  kart: number | null;
  laps: number;
  bestMs: number | null;
  points: number | null;
};
type Lap = { id: string; number: number; timeMs: number | null; elapsedMs: number | null; valid: boolean; reason: string };

function sessionLabel(name: string): string {
  const tomada = /tomada de tempo\s*-\s*corrida\s*(\d)/i.exec(name);
  if (tomada) return `Tomada de tempo · C${tomada[1]}`;
  return name.replace(" - Horário", " · horário").replace(" - Anti-horário", " · anti-horário");
}

export function LapsPanel({ client }: { client: SupabaseClient }) {
  const [stages, setStages] = useState<StageInfo[]>([]);
  const [races, setRaces] = useState<Race[]>([]);
  const [stageId, setStageId] = useState("");
  const [raceId, setRaceId] = useState("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [entryId, setEntryId] = useState("");
  const [laps, setLaps] = useState<Lap[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRace, setLoadingRace] = useState(false);
  const [error, setError] = useState("");

  const loadRaces = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const stageList = await loadStages(client);
      const { data, error: racesError } = await client
        .from("results")
        .select("id,stage_id,session:sessions!results_session_id_fkey(name,starts_at)")
        .is("deleted_at", null);
      if (racesError) throw racesError;
      const list = ((data ?? []) as unknown as { id: string; stage_id: string; session: { name: string; starts_at: string | null } | null }[])
        .map((row) => ({
          id: row.id,
          stageId: row.stage_id,
          label: sessionLabel(row.session?.name ?? "Corrida"),
          startsAt: row.session?.starts_at ?? "",
        }))
        .sort((a, b) => a.startsAt.localeCompare(b.startsAt) || a.label.localeCompare(b.label));
      const withRaces = stageList.filter((stage) => list.some((race) => race.stageId === stage.id));
      setStages(withRaces);
      setRaces(list);
      const last = withRaces.at(-1);
      setStageId((current) => current || last?.id || "");
    } catch (loadError) {
      setError(errorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    void loadRaces();
  }, [loadRaces]);

  const stageRaces = useMemo(() => races.filter((race) => race.stageId === stageId), [races, stageId]);

  useEffect(() => {
    if (!stageRaces.some((race) => race.id === raceId)) setRaceId(stageRaces[0]?.id ?? "");
  }, [stageRaces, raceId]);

  useEffect(() => {
    if (!raceId) return;
    let active = true;
    setLoadingRace(true);
    setError("");
    void (async () => {
      const { data, error: entriesError } = await client
        .from("result_entries")
        .select("id,position,kart_number,laps,best_lap_ms,points,driver:drivers(sport_name,full_name,category:categories(name))")
        .eq("result_id", raceId)
        .is("deleted_at", null)
        .order("position");
      if (!active) return;
      if (entriesError) {
        setError(errorMessage(entriesError));
        setLoadingRace(false);
        return;
      }
      const list = ((data ?? []) as unknown as {
        id: string;
        position: number;
        kart_number: number | null;
        laps: number | null;
        best_lap_ms: number | null;
        points: number | null;
        driver: { sport_name: string | null; full_name: string; category: { name: string } | null } | null;
      }[]).map((row) => ({
        id: row.id,
        position: row.position,
        driver: row.driver?.sport_name || row.driver?.full_name || "Piloto",
        category: row.driver?.category?.name ?? "—",
        kart: row.kart_number,
        laps: row.laps ?? 0,
        bestMs: row.best_lap_ms,
        points: row.points === null ? null : Number(row.points),
      }));
      setEntries(list);
      setEntryId(list[0]?.id ?? "");
      setLoadingRace(false);
    })();
    return () => {
      active = false;
    };
  }, [client, raceId]);

  useEffect(() => {
    if (!entryId) {
      setLaps([]);
      return;
    }
    let active = true;
    void (async () => {
      const { data, error: lapsError } = await client
        .from("laps")
        .select("id,lap_number,lap_time_ms,elapsed_time_ms,valid,invalid_reason")
        .eq("result_entry_id", entryId)
        .is("deleted_at", null)
        .order("lap_number");
      if (!active) return;
      if (lapsError) {
        setError(errorMessage(lapsError));
        return;
      }
      setLaps(
        (data ?? []).map((row) => ({
          id: String(row.id),
          number: Number(row.lap_number),
          timeMs: row.lap_time_ms === null ? null : Number(row.lap_time_ms),
          elapsedMs: row.elapsed_time_ms === null ? null : Number(row.elapsed_time_ms),
          valid: Boolean(row.valid),
          reason: String(row.invalid_reason ?? ""),
        })),
      );
    })();
    return () => {
      active = false;
    };
  }, [client, entryId]);

  const [pdfBusy, setPdfBusy] = useState(false);
  async function downloadPdf(kind: "resultado" | "voltas" | "piloto") {
    const race = races.find((item) => item.id === raceId);
    const stage = stages.find((item) => item.id === stageId);
    if (!race || !stage) return;
    setPdfBusy(true);
    setError("");
    try {
      const report = await loadRaceReport(client, race.id);
      const logo = `${window.location.origin}/brand/udk-wordmark-dark.svg`;
      const pilot = entries.find((entry) => entry.id === entryId);
      if (kind === "resultado") openPdf(resultHtml(report, logo), pdfFileName("UDK", "Resultado_Oficial", `${stage.ordinal}_etapa`, race.label));
      else if (kind === "voltas") openPdf(lapsHtml(report, logo), pdfFileName("UDK", "Volta_a_Volta", `${stage.ordinal}_etapa`, race.label));
      else if (pilot) openPdf(lapsHtml(report, logo, pilot.id), pdfFileName("UDK", "Volta_a_Volta", `${stage.ordinal}_etapa`, race.label, pilot.driver));
    } catch (pdfError) {
      setError(errorMessage(pdfError));
    } finally {
      setPdfBusy(false);
    }
  }

  const fastestOfRace = useMemo(
    () => Math.min(...entries.map((entry) => entry.bestMs ?? Infinity)),
    [entries],
  );
  const selected = entries.find((entry) => entry.id === entryId);
  const bestOfDriver = useMemo(
    () => Math.min(...laps.filter((lap) => lap.valid && lap.timeMs).map((lap) => lap.timeMs ?? Infinity)),
    [laps],
  );

  return (
    <div className="pv-workspace">
      <div className="pv-toolbar">
        <Segmented
          label="Etapa"
          value={stageId}
          onChange={setStageId}
          options={stages.map((stage) => ({ value: stage.id, label: `${stage.ordinal} etapa`, hint: stage.title }))}
        />
        {stageRaces.length > 1 ? (
          <Segmented
            label="Corrida"
            value={raceId}
            onChange={setRaceId}
            options={stageRaces.map((race) => ({ value: race.id, label: race.label }))}
          />
        ) : null}
        <button type="button" className="button-secondary" onClick={() => void loadRaces()}>
          <RefreshCw aria-hidden="true" /> Atualizar
        </button>
      </div>
      <div className="pv-toolbar pv-pdf-bar">
        <span className="pv-muted">PDF no padrão da cronometragem do kartódromo:</span>
        <button type="button" className="button-secondary" disabled={pdfBusy || !raceId} onClick={() => void downloadPdf("resultado")}>
          <Download aria-hidden="true" /> Resultado oficial
        </button>
        <button type="button" className="button-secondary" disabled={pdfBusy || !raceId} onClick={() => void downloadPdf("voltas")}>
          <Download aria-hidden="true" /> Volta a volta de todos
        </button>
      </div>

      <PanelState loading={loading || loadingRace} error={error} empty={!loading && !loadingRace && !entries.length ? "Nenhum resultado nessa corrida." : undefined}>
        <div className="pv-split">
          <section className="data-card">
            <div className="data-card-head">
              <div>
                <strong>{entries.length}</strong>
                <span>pilotos</span>
              </div>
              <p className="pv-note">Melhor volta da corrida: {formatLap(Number.isFinite(fastestOfRace) ? fastestOfRace : null)}</p>
            </div>
            <ul className="pv-entry-list" aria-label="Pilotos da corrida">
              {entries.map((entry) => (
                <li key={entry.id}>
                  <button
                    type="button"
                    className={entry.id === entryId ? "is-active" : undefined}
                    aria-pressed={entry.id === entryId}
                    onClick={() => setEntryId(entry.id)}
                  >
                    <span className={`pv-pos${entry.position <= 3 ? " is-podium" : ""}`}>{entry.position}</span>
                    <span className="pv-stack">
                      <b>{entry.driver}</b>
                      <small>
                        {entry.category} · kart {entry.kart ?? "—"} · {entry.laps} {entry.laps === 1 ? "volta" : "voltas"}
                      </small>
                    </span>
                    <span className={`pv-num${entry.bestMs === fastestOfRace ? " pv-fastest" : ""}`}>{formatLap(entry.bestMs)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className="data-card" aria-live="polite">
            <div className="data-card-head">
              <div>
                <strong>{selected?.driver ?? "—"}</strong>
              </div>
              <p className="pv-note">
                {selected
                  ? `${selected.position}º · ${selected.points ? `${selected.points} pts` : "sem pontos"} · melhor volta ${formatLap(selected.bestMs)}`
                  : "Escolha um piloto."}
              </p>
              {selected ? (
                <button type="button" className="button-secondary pv-small" disabled={pdfBusy} onClick={() => void downloadPdf("piloto")}>
                  <Download aria-hidden="true" /> PDF deste piloto
                </button>
              ) : null}
            </div>
            {laps.length ? (
              <div className="table-scroll">
                <table className="admin-table pv-table pv-laps">
                  <thead>
                    <tr>
                      <th scope="col">Volta</th>
                      <th scope="col" className="pv-num">Tempo</th>
                      <th scope="col" className="pv-num">Para a melhor</th>
                      <th scope="col" className="pv-num">Acumulado</th>
                      <th scope="col">Situação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {laps.map((lap) => {
                      const isBest = lap.valid && lap.timeMs === bestOfDriver;
                      return (
                        <tr key={lap.id} className={isBest ? "is-best" : undefined}>
                          <td>{lap.number}</td>
                          <td className="pv-num pv-strong">{formatLap(lap.timeMs)}</td>
                          <td className="pv-num">
                            {isBest
                              ? "melhor"
                              : lap.timeMs && Number.isFinite(bestOfDriver)
                                ? `+${((lap.timeMs - bestOfDriver) / 1000).toFixed(3).replace(".", ",")}`
                                : "—"}
                          </td>
                          <td className="pv-num">{formatLap(lap.elapsedMs)}</td>
                          <td>{lap.valid ? "Válida" : `Anulada${lap.reason ? ` · ${lap.reason}` : ""}`}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="pv-state">Sem volta a volta para este piloto.</div>
            )}
          </section>
        </div>
      </PanelState>
    </div>
  );
}
