"use client";

import { useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import Link from "next/link";
import {
  AlertTriangle,
  CalendarDays,
  CircleDollarSign,
  FileCheck2,
  Flag,
  LoaderCircle,
  Trophy,
  Users,
} from "lucide-react";

type DashboardProps = {
  client: SupabaseClient;
  allowedKeys: ReadonlySet<string>;
};

type DashboardState = {
  drivers: number;
  registrations: number;
  pendingPayments: number;
  provisionalResults: number;
  pendingDocuments: number;
  nextStage:
    | {
        title: string;
        track: string;
        starts_at: string;
        status: string;
      }
    | undefined;
};

type CountResult = {
  count: number | null;
  error: { message: string } | null;
};

type StageResult = {
  data: DashboardState["nextStage"] | null;
  error: { message: string } | null;
};

const initialState: DashboardState = {
  drivers: 0,
  registrations: 0,
  pendingPayments: 0,
  provisionalResults: 0,
  pendingDocuments: 0,
  nextStage: undefined,
};

const emptyCount = (): Promise<CountResult> => Promise.resolve({ count: 0, error: null });
const emptyStage = (): Promise<StageResult> => Promise.resolve({ data: null, error: null });

export function Dashboard({ client, allowedKeys }: DashboardProps) {
  const [state, setState] = useState<DashboardState>(initialState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      setLoading(true);
      setError("");

      const now = new Date().toISOString();
      const driversPromise = allowedKeys.has("pilotos")
        ? client.from("drivers").select("id", { count: "exact", head: true }).eq("status", "approved")
        : emptyCount();
      const registrationsPromise = allowedKeys.has("inscricoes")
        ? client
            .from("registrations")
            .select("id", { count: "exact", head: true })
            .in("status", ["submitted", "documents_pending", "payment_pending", "analysis", "approved"])
        : emptyCount();
      const paymentsPromise = allowedKeys.has("financeiro")
        ? client
            .from("payments")
            .select("id", { count: "exact", head: true })
            .in("status", ["proof_sent", "analysis"])
        : emptyCount();
      const resultsPromise = allowedKeys.has("resultados")
        ? client
            .from("results")
            .select("id", { count: "exact", head: true })
            .in("status", ["analysis", "provisional"])
        : emptyCount();
      const documentsPromise = allowedKeys.has("documentos")
        ? client
            .from("documents")
            .select("id", { count: "exact", head: true })
            .in("status", ["submitted", "analysis", "correction_requested"])
        : emptyCount();
      const nextStagePromise = allowedKeys.has("calendario")
        ? client
            .from("stages")
            .select("title,track,starts_at,status")
            .gte("starts_at", now)
            .neq("status", "cancelled")
            .order("starts_at", { ascending: true })
            .limit(1)
            .maybeSingle()
        : emptyStage();

      const [drivers, registrations, payments, results, documents, nextStage] = await Promise.all([
        driversPromise,
        registrationsPromise,
        paymentsPromise,
        resultsPromise,
        documentsPromise,
        nextStagePromise,
      ]);

      const firstError = [
        drivers.error,
        registrations.error,
        payments.error,
        results.error,
        documents.error,
        nextStage.error,
      ].find(Boolean);

      if (!active) return;

      if (firstError) {
        setError(firstError.message);
      } else {
        setState({
          drivers: drivers.count ?? 0,
          registrations: registrations.count ?? 0,
          pendingPayments: payments.count ?? 0,
          provisionalResults: results.count ?? 0,
          pendingDocuments: documents.count ?? 0,
          nextStage: nextStage.data ?? undefined,
        });
      }
      setLoading(false);
    }

    void loadDashboard();
    return () => {
      active = false;
    };
  }, [allowedKeys, client]);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <LoaderCircle className="spin" />
        Consolidando a operação autorizada...
      </div>
    );
  }

  const hasPendingItems = ["documentos", "financeiro", "resultados"].some((key) => allowedKeys.has(key));

  return (
    <div className="dashboard-grid">
      {error ? <div className="alert alert-error dashboard-alert" role="alert">{error}</div> : null}

      <div className="metrics">
        {allowedKeys.has("pilotos") ? (
          <Link href="/painel/pilotos">
            <article><Users /><span>Pilotos homologados</span><b>{state.drivers}</b><small>Perfis esportivos ativos</small></article>
          </Link>
        ) : null}
        {allowedKeys.has("inscricoes") ? (
          <Link href="/painel/inscricoes">
            <article><Flag /><span>Inscrições em fluxo</span><b>{state.registrations}</b><small>Temporada e etapas</small></article>
          </Link>
        ) : null}
        {allowedKeys.has("financeiro") ? (
          <Link href="/painel/financeiro">
            <article><CircleDollarSign /><span>Comprovantes pendentes</span><b>{state.pendingPayments}</b><small>Análise financeira</small></article>
          </Link>
        ) : null}
        {allowedKeys.has("resultados") ? (
          <Link href="/painel/resultados">
            <article><Trophy /><span>Resultados em análise</span><b>{state.provisionalResults}</b><small>Provisórios e pendências</small></article>
          </Link>
        ) : null}
      </div>

      <div className="dashboard-columns">
        {allowedKeys.has("calendario") ? (
          <article className="dashboard-panel next-stage-panel">
            <div className="panel-title">
              <div><span>Próxima operação</span><h2>{state.nextStage?.title ?? "Nenhuma etapa futura"}</h2></div>
              <CalendarDays />
            </div>
            {state.nextStage ? (
              <>
                <strong>
                  {new Date(state.nextStage.starts_at).toLocaleString("pt-BR", {
                    dateStyle: "full",
                    timeStyle: "short",
                  })}
                </strong>
                <p>{state.nextStage.track}</p>
                <div className="stage-progress"><span /></div>
                <div className="stage-actions">
                  <Link href="/painel/calendario">Configurar etapa</Link>
                  {allowedKeys.has("inscricoes") ? <Link href="/painel/inscricoes">Revisar inscrições</Link> : null}
                  {allowedKeys.has("endurance") ? <Link href="/painel/endurance">Equipes Endurance</Link> : null}
                </div>
              </>
            ) : (
              <p>Cadastre uma etapa para iniciar o fluxo operacional.</p>
            )}
          </article>
        ) : null}

        {hasPendingItems ? (
          <article className="dashboard-panel">
            <div className="panel-title">
              <div><span>Central de pendências</span><h2>O que exige atenção</h2></div>
              <AlertTriangle />
            </div>
            <ul className="pending-list">
              {allowedKeys.has("documentos") ? (
                <li><FileCheck2 /><div><b>{state.pendingDocuments} documento(s)</b><span>Aguardando análise ou correção</span></div><Link href="/painel/documentos">Abrir</Link></li>
              ) : null}
              {allowedKeys.has("financeiro") ? (
                <li><CircleDollarSign /><div><b>{state.pendingPayments} pagamento(s)</b><span>Comprovante enviado ou em análise</span></div><Link href="/painel/financeiro">Abrir</Link></li>
              ) : null}
              {allowedKeys.has("resultados") ? (
                <li><Trophy /><div><b>{state.provisionalResults} resultado(s)</b><span>Aguardando homologação esportiva</span></div><Link href="/painel/resultados">Abrir</Link></li>
              ) : null}
            </ul>
          </article>
        ) : null}
      </div>
    </div>
  );
}
