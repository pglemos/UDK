"use client";

import { moduleHref } from "../lib/painel-structure";
import { SetupGuide, StageRunbook } from "./painel/setup-guide";

import { useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
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
        ? client
            .from("drivers")
            .select("id", { count: "exact", head: true })
            .eq("status", "approved")
            .is("deleted_at", null)
        : emptyCount();
      const registrationsPromise = allowedKeys.has("inscricoes")
        ? client
            .from("registrations")
            .select("id", { count: "exact", head: true })
            .in("status", [
              "submitted",
              "documents_pending",
              "payment_pending",
              "analysis",
              "approved",
            ])
            .is("deleted_at", null)
        : emptyCount();
      const paymentsPromise = allowedKeys.has("financeiro")
        ? client
            .from("payments")
            .select("id", { count: "exact", head: true })
            .in("status", ["proof_sent", "analysis"])
            .is("deleted_at", null)
        : emptyCount();
      const resultsPromise = allowedKeys.has("resultados")
        ? client
            .from("results")
            .select("id", { count: "exact", head: true })
            .in("status", ["analysis", "provisional"])
            .is("deleted_at", null)
        : emptyCount();
      const documentsPromise = allowedKeys.has("documentos")
        ? client
            .from("documents")
            .select("id", { count: "exact", head: true })
            .in("status", ["submitted", "analysis", "correction_requested"])
            .is("deleted_at", null)
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
        Carregando resumo...
      </div>
    );
  }

  const hasPendingItems = ["documentos", "financeiro", "resultados"].some((key) =>
    allowedKeys.has(key),
  );

  const pendingItems = [
    { key: "documentos", Icon: FileCheck2, count: state.pendingDocuments, title: (n: number) => `${n} documento(s) para analisar`, clear: "Nenhum documento esperando", detail: "Enviados pelos pilotos" },
    { key: "financeiro", Icon: CircleDollarSign, count: state.pendingPayments, title: (n: number) => `${n} pagamento(s) para conferir`, clear: "Nenhum pagamento esperando", detail: "Comprovantes de inscrição" },
    { key: "resultados", Icon: Trophy, count: state.provisionalResults, title: (n: number) => `${n} resultado(s) para homologar`, clear: "Nenhum resultado provisório", detail: "Tomadas e corridas" },
  ].filter((item) => allowedKeys.has(item.key));
  const pendingTotal = pendingItems.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="dashboard-grid">
      <SetupGuide client={client} allowedKeys={allowedKeys} />
      {error ? (
        <div className="alert alert-error dashboard-alert" role="alert">
          {error}
        </div>
      ) : null}

      <div className="metrics">
        {allowedKeys.has("pilotos") ? (
          <Link href={moduleHref("pilotos")}>
            <article>
              <Users />
              <span>Pilotos homologados</span>
              <b>{state.drivers}</b>
              <small>Perfis esportivos ativos</small>
            </article>
          </Link>
        ) : null}
        {allowedKeys.has("inscricoes") ? (
          <Link href={moduleHref("inscricoes")}>
            <article data-tone={state.registrations ? "info" : undefined}>
              <Flag />
              <span>Inscrições em fluxo</span>
              <b>{state.registrations}</b>
              <small>Temporada e etapas</small>
            </article>
          </Link>
        ) : null}
        {allowedKeys.has("financeiro") ? (
          <Link href={moduleHref("financeiro")}>
            <article data-tone={state.pendingPayments ? "warning" : undefined}>
              <CircleDollarSign />
              <span>Comprovantes pendentes</span>
              <b>{state.pendingPayments}</b>
              <small>Análise financeira</small>
            </article>
          </Link>
        ) : null}
        {allowedKeys.has("resultados") ? (
          <Link href={moduleHref("resultados")}>
            <article data-tone={state.provisionalResults ? "warning" : undefined}>
              <Trophy />
              <span>Resultados em análise</span>
              <b>{state.provisionalResults}</b>
              <small>Provisórios e pendências</small>
            </article>
          </Link>
        ) : null}
      </div>

      <div className="dashboard-columns">
        {allowedKeys.has("calendario") ? (
          <article className="dashboard-panel next-stage-panel">
            <div className="panel-title">
              <div>
                <h2>{state.nextStage?.title ?? "Nenhuma etapa futura"}</h2>
              </div>
              <CalendarDays />
            </div>
            {state.nextStage ? (
              <>
                <strong>
                  {new Date(state.nextStage.starts_at).toLocaleString("pt-BR", {
                    dateStyle: "full",
                    timeStyle: "short",
                    timeZone: "America/Sao_Paulo",
                  })}
                </strong>
                <p>{state.nextStage.track}</p>
                <div className="stage-actions">
                  <Link href={moduleHref("calendario")}>Configurar etapa</Link>
                  {allowedKeys.has("inscricoes") ? (
                    <Link href={moduleHref("inscricoes")}>Revisar inscrições</Link>
                  ) : null}
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
              <div>
                <h2>{pendingTotal ? "Pendências" : "Tudo em dia"}</h2>
              </div>
              {pendingTotal ? <AlertTriangle aria-hidden="true" /> : <CheckCircle2 aria-hidden="true" className="is-ok" />}
            </div>
            <ul className="pending-list">
              {pendingItems.map((item) => (
                <li key={item.key} className={item.count ? undefined : "is-clear"}>
                  <item.Icon aria-hidden="true" />
                  <div>
                    <b>{item.count ? item.title(item.count) : item.clear}</b>
                    <span>{item.detail}</span>
                  </div>
                  {item.count ? <Link href={moduleHref(item.key)}>Abrir</Link> : null}
                </li>
              ))}
            </ul>
          </article>
        ) : null}
      </div>
      <StageRunbook allowedKeys={allowedKeys} />
    </div>
  );
}
