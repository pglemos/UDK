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

const initialState: DashboardState = {
  drivers: 0,
  registrations: 0,
  pendingPayments: 0,
  provisionalResults: 0,
  pendingDocuments: 0,
  nextStage: undefined,
};

export function Dashboard({ client }: DashboardProps) {
  const [state, setState] = useState<DashboardState>(initialState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      setLoading(true);
      setError("");

      const now = new Date().toISOString();
      const [drivers, registrations, payments, results, documents, nextStage] = await Promise.all([
        client.from("drivers").select("id", { count: "exact", head: true }).eq("status", "approved"),
        client
          .from("registrations")
          .select("id", { count: "exact", head: true })
          .in("status", ["submitted", "documents_pending", "payment_pending", "analysis", "approved"]),
        client
          .from("payments")
          .select("id", { count: "exact", head: true })
          .in("status", ["proof_sent", "analysis"]),
        client
          .from("results")
          .select("id", { count: "exact", head: true })
          .in("status", ["analysis", "provisional"]),
        client
          .from("documents")
          .select("id", { count: "exact", head: true })
          .in("status", ["submitted", "analysis", "correction_requested"]),
        client
          .from("stages")
          .select("title,track,starts_at,status")
          .gte("starts_at", now)
          .neq("status", "cancelled")
          .order("starts_at", { ascending: true })
          .limit(1)
          .maybeSingle(),
      ]);

      const firstError = [drivers.error, registrations.error, payments.error, results.error, documents.error, nextStage.error].find(
        Boolean,
      );

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
  }, [client]);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <LoaderCircle className="spin" />
        Consolidando a operação da temporada...
      </div>
    );
  }

  return (
    <div className="dashboard-grid">
      {error ? <div className="alert alert-error dashboard-alert">{error}</div> : null}

      <div className="metrics">
        <Link href="/painel/pilotos">
          <article>
            <Users />
            <span>Pilotos homologados</span>
            <b>{state.drivers}</b>
            <small>Perfis esportivos ativos</small>
          </article>
        </Link>
        <Link href="/painel/inscricoes">
          <article>
            <Flag />
            <span>Inscrições em fluxo</span>
            <b>{state.registrations}</b>
            <small>Temporada e etapas</small>
          </article>
        </Link>
        <Link href="/painel/financeiro">
          <article>
            <CircleDollarSign />
            <span>Comprovantes pendentes</span>
            <b>{state.pendingPayments}</b>
            <small>Análise financeira</small>
          </article>
        </Link>
        <Link href="/painel/resultados">
          <article>
            <Trophy />
            <span>Resultados em análise</span>
            <b>{state.provisionalResults}</b>
            <small>Provisórios e pendências</small>
          </article>
        </Link>
      </div>

      <div className="dashboard-columns">
        <article className="dashboard-panel next-stage-panel">
          <div className="panel-title">
            <div>
              <span>Próxima operação</span>
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
                })}
              </strong>
              <p>{state.nextStage.track}</p>
              <div className="stage-progress">
                <span />
              </div>
              <div className="stage-actions">
                <Link href="/painel/calendario">Configurar etapa</Link>
                <Link href="/painel/inscricoes">Revisar inscrições</Link>
                <Link href="/painel/endurance">Equipes Endurance</Link>
              </div>
            </>
          ) : (
            <p>Cadastre uma etapa para iniciar o fluxo operacional.</p>
          )}
        </article>

        <article className="dashboard-panel">
          <div className="panel-title">
            <div>
              <span>Central de pendências</span>
              <h2>O que exige atenção</h2>
            </div>
            <AlertTriangle />
          </div>
          <ul className="pending-list">
            <li>
              <FileCheck2 />
              <div>
                <b>{state.pendingDocuments} documento(s)</b>
                <span>Aguardando análise ou correção</span>
              </div>
              <Link href="/painel/documentos">Abrir</Link>
            </li>
            <li>
              <CircleDollarSign />
              <div>
                <b>{state.pendingPayments} pagamento(s)</b>
                <span>Comprovante enviado ou em análise</span>
              </div>
              <Link href="/painel/financeiro">Abrir</Link>
            </li>
            <li>
              <Trophy />
              <div>
                <b>{state.provisionalResults} resultado(s)</b>
                <span>Aguardando homologação esportiva</span>
              </div>
              <Link href="/painel/resultados">Abrir</Link>
            </li>
          </ul>
        </article>
      </div>
    </div>
  );
}
