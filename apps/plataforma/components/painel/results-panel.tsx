"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Download, RefreshCw, Timer } from "lucide-react";
import { PanelState, errorMessage, formatLap, loadStages, type StageInfo } from "./shared";
import { lapsHtml, loadRaceReport, openPdf, pdfFileName, resultHtml } from "../../lib/timing-pdf";
import { moduleHref } from "../../lib/painel-structure";

type Row = {
  id: string;
  stage: StageInfo;
  session: string;
  kind: string;
  startsAt: string;
  status: string;
  entries: number;
  fastestMs: number | null;
};

const statusText: Record<string, string> = {
  published: "Publicado",
  homologated: "Homologado",
  rectified: "Retificado",
  provisional: "Provisório",
  draft: "Rascunho",
};

function sessionTitle(name: string, kind: string): string {
  if (kind === "qualifying") return name.replace(/tomada de tempo\s*-\s*/i, "Tomada de tempo · ");
  return name.replace(" - Horário", " · sentido horário").replace(" - Anti-horário", " · sentido anti-horário");
}

export function ResultsPanel({ client, editor }: { client: SupabaseClient; editor?: ReactNode }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const stages = await loadStages(client);
      const { data, error: loadError } = await client
        .from("results")
        .select("id,stage_id,status,fastest_lap_ms,session:sessions!results_session_id_fkey(name,kind,starts_at),entries:result_entries(count)")
        .is("deleted_at", null);
      if (loadError) throw loadError;
      const byId = new Map(stages.map((stage) => [stage.id, stage]));
      setRows(
        ((data ?? []) as unknown as {
          id: string;
          stage_id: string;
          status: string;
          fastest_lap_ms: number | null;
          session: { name: string; kind: string | null; starts_at: string | null } | null;
          entries: { count: number }[];
        }[])
          .filter((row) => byId.has(row.stage_id))
          .map((row) => ({
            id: row.id,
            stage: byId.get(row.stage_id)!,
            session: row.session?.name ?? "Resultado",
            kind: row.session?.kind ?? "race",
            startsAt: row.session?.starts_at ?? "",
            status: row.status,
            entries: row.entries?.[0]?.count ?? 0,
            fastestMs: row.fastest_lap_ms,
          }))
          .sort((a, b) => b.stage.startsAt.localeCompare(a.stage.startsAt) || a.startsAt.localeCompare(b.startsAt)),
      );
    } catch (loadFailure) {
      setError(errorMessage(loadFailure));
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    void load();
  }, [load]);

  async function pdf(row: Row, kind: "resultado" | "voltas") {
    setBusy(`${row.id}-${kind}`);
    setError("");
    try {
      const report = await loadRaceReport(client, row.id);
      const logo = `${window.location.origin}/brand/udk-wordmark-dark.svg`;
      const label = sessionTitle(row.session, row.kind);
      openPdf(
        kind === "resultado" ? resultHtml(report, logo) : lapsHtml(report, logo),
        pdfFileName("UDK", kind === "resultado" ? "Resultado_Oficial" : "Volta_a_Volta", `${row.stage.ordinal}_etapa`, label),
      );
    } catch (pdfError) {
      setError(errorMessage(pdfError));
    } finally {
      setBusy("");
    }
  }

  const stagesInOrder = Array.from(new Map(rows.map((row) => [row.stage.id, row.stage])).values());

  return (
    <div className="pv-workspace">
      <div className="pv-toolbar">
        <p className="pv-lede">
          Cada tomada de tempo e corrida com o resultado oficial e o volta a volta em PDF, no padrão da cronometragem do kartódromo.
        </p>
        <button type="button" className="button-secondary" onClick={() => void load()}>
          <RefreshCw aria-hidden="true" /> Atualizar
        </button>
      </div>
      {error ? <div className="alert alert-error" role="alert">{error}</div> : null}
      <PanelState loading={loading} error="" empty={!loading && !rows.length ? "Nenhum resultado publicado ainda." : undefined}>
        {stagesInOrder.map((stage) => (
          <section key={stage.id} className="data-card pv-result-group" aria-labelledby={`stage-${stage.id}`}>
            <div className="data-card-head">
              <div>
                <h2 id={`stage-${stage.id}`}>{stage.title}</h2>
                <span>{stage.shortDate}</span>
              </div>
            </div>
            <ul className="pv-result-list">
              {rows
                .filter((row) => row.stage.id === stage.id)
                .map((row) => (
                  <li key={row.id}>
                    <span className={`pv-kind ${row.kind === "qualifying" ? "is-quali" : ""}`}>
                      {row.kind === "qualifying" ? "Tomada" : row.kind === "endurance" ? "Endurance" : "Corrida"}
                    </span>
                    <span className="pv-stack">
                      <b>{sessionTitle(row.session, row.kind)}</b>
                      <small>
                        {row.entries} pilotos · melhor volta {formatLap(row.fastestMs)} · {statusText[row.status] ?? row.status}
                        {row.kind === "qualifying" ? " · não pontua" : ""}
                      </small>
                    </span>
                    <span className="pv-result-actions">
                      <button type="button" className="button-secondary pv-small" disabled={Boolean(busy)} onClick={() => void pdf(row, "resultado")}>
                        <Download aria-hidden="true" /> PDF do resultado
                      </button>
                      <button type="button" className="button-secondary pv-small" disabled={Boolean(busy)} onClick={() => void pdf(row, "voltas")}>
                        <Download aria-hidden="true" /> PDF volta a volta
                      </button>
                      <Link className="button-secondary pv-small" href={moduleHref("voltas")}>
                        <Timer aria-hidden="true" /> Ver voltas
                      </Link>
                    </span>
                  </li>
                ))}
            </ul>
          </section>
        ))}
        {editor ? (
          <details className="pv-details">
            <summary>Corrigir dados de um resultado (uso da organização)</summary>
            {editor}
          </details>
        ) : null}
      </PanelState>
    </div>
  );
}
