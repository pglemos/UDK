"use client";

import { useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Download, FileSpreadsheet, LoaderCircle } from "lucide-react";

type ReportsPanelProps = {
  client: SupabaseClient;
};

const reports = [
  { key: "drivers", label: "Pilotos", description: "Cadastro esportivo e homologação" },
  { key: "registrations", label: "Inscrições", description: "Protocolos, etapas, valores e situação" },
  { key: "payments", label: "Financeiro", description: "Cobranças PIX, análise e reembolsos" },
  { key: "documents", label: "Documentos", description: "Situação documental sem baixar arquivos privados" },
  { key: "results", label: "Resultados", description: "Versões, publicação e homologação" },
  { key: "standings", label: "Classificação", description: "Pontos e posições por versão" },
  { key: "penalties", label: "Penalidades", description: "Efeito, situação e visibilidade" },
  { key: "appeals", label: "Recursos", description: "Protocolos e decisões" },
  { key: "endurance_teams", label: "Equipes Endurance", description: "Composição e homologação" },
  { key: "stints", label: "Stints", description: "Tempos, voltas e validação" },
  { key: "audit_events", label: "Auditoria", description: "Histórico imutável de alterações" },
] as const;

const privateColumns = new Set([
  "deleted_at",
  "original_path",
  "proof_path",
  "file_path",
  "signature_path",
]);

function safeSpreadsheetValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  const normalized = typeof value === "object" ? JSON.stringify(value) : String(value);
  return /^[=+\-@]/.test(normalized) ? `'${normalized}` : normalized;
}

function escapeCsv(value: unknown): string {
  const normalized = safeSpreadsheetValue(value);
  return `"${normalized.replaceAll('"', '""')}"`;
}

export function sanitizeReportRows(
  table: string,
  rows: Record<string, unknown>[],
): Record<string, unknown>[] {
  return rows.map((row) =>
    Object.fromEntries(
      Object.entries(row).filter(([column]) => {
        if (privateColumns.has(column)) return false;
        if (table === "audit_events" && column === "actor_ip") return false;
        return true;
      }),
    ),
  );
}

export function createCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const columns = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
  const header = columns.map(escapeCsv).join(";");
  const body = rows.map((row) => columns.map((column) => escapeCsv(row[column])).join(";")).join("\n");
  return `\uFEFF${header}\n${body}`;
}

export function ReportsPanel({ client }: ReportsPanelProps) {
  const [loading, setLoading] = useState<string>();
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function exportReport(table: string, label: string) {
    setLoading(table);
    setError("");
    setNotice("");

    let query = client.from(table).select("*").limit(5000);
    if (table !== "audit_events") {
      query = query.is("deleted_at", null);
    }

    const { data, error: reportError } = await query;
    if (reportError) {
      setError(reportError.message);
      setLoading(undefined);
      return;
    }

    const rows = sanitizeReportRows(table, (data ?? []) as Record<string, unknown>[]);
    if (rows.length === 0) {
      setNotice(`O relatório ${label} não possui registros no escopo atual.`);
      setLoading(undefined);
      return;
    }

    const blob = new Blob([createCsv(rows)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `udk-${table}-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);

    setNotice(`${rows.length} registro(s) exportado(s) em ${label}.`);
    setLoading(undefined);
  }

  return (
    <section className="reports-workspace">
      {error ? <div className="alert alert-error">{error}</div> : null}
      {notice ? <div className="alert alert-success">{notice}</div> : null}

      <div className="report-grid">
        {reports.map((report) => (
          <article key={report.key} className="report-card">
            <FileSpreadsheet />
            <div>
              <h2>{report.label}</h2>
              <p>{report.description}</p>
            </div>
            <button
              className="button-secondary"
              type="button"
              onClick={() => void exportReport(report.key, report.label)}
              disabled={Boolean(loading)}
            >
              {loading === report.key ? <LoaderCircle className="spin" size={17} /> : <Download size={17} />}
              Exportar CSV
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
