"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { RefreshCw } from "lucide-react";
import { PanelState, errorMessage, formatPoints, LazyDetails } from "./shared";

type Rule = {
  id: string;
  format: string;
  version: number;
  active: boolean;
  positions: [number, number][];
  pole: number;
  fastestLap: number;
  bestPit: number;
  updatedAt: string;
};

const formatInfo: Record<string, { title: string; scope: string; article: string }> = {
  regular: {
    title: "Etapa regular",
    scope: "Pontos por corrida, pela chegada geral (categorias juntas). Duas corridas por etapa.",
    article: "Art. 18 e 19",
  },
  endurance: {
    title: "Endurance",
    scope: "Pontos da prova de 60 minutos, pela chegada geral.",
    article: "Art. 18 e 19",
  },
  special: {
    title: "Especial",
    scope: "Formato não previsto no regulamento de 2026.",
    article: "—",
  },
};

function RuleTable({ rule }: { rule: Rule }) {
  return (
    <ol className="pv-points-grid" aria-label={`Pontos por posição — ${formatInfo[rule.format]?.title ?? rule.format}`}>
      {rule.positions.map(([position, points]) => (
        <li key={position}>
          <span>{position}º</span>
          <b>{formatPoints(points)}</b>
        </li>
      ))}
    </ol>
  );
}

export function PointsRulesPanel({ client, editor }: { client: SupabaseClient; editor?: ReactNode }) {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data, error: loadError } = await client
        .from("points_rules")
        .select("id,event_format,version,active,position_points,pole_points,fastest_lap_points,best_pit_points,updated_at")
        .is("deleted_at", null)
        .order("version", { ascending: false });
      if (loadError) throw loadError;
      setRules(
        (data ?? []).map((row) => ({
          id: String(row.id),
          format: String(row.event_format),
          version: Number(row.version),
          active: Boolean(row.active),
          positions: Object.entries((row.position_points ?? {}) as Record<string, number>)
            .map(([position, points]) => [Number(position), Number(points)] as [number, number])
            .sort((a, b) => a[0] - b[0]),
          pole: Number(row.pole_points ?? 0),
          fastestLap: Number(row.fastest_lap_points ?? 0),
          bestPit: Number(row.best_pit_points ?? 0),
          updatedAt: String(row.updated_at),
        })),
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

  const active = useMemo(
    () => rules.filter((rule) => rule.active).sort((a, b) => (a.format === "regular" ? -1 : b.format === "regular" ? 1 : 0)),
    [rules],
  );
  const history = useMemo(() => rules.filter((rule) => !rule.active), [rules]);

  return (
    <div className="pv-workspace">
      <div className="pv-toolbar">
        <p className="pv-lede">
          Regras em vigor na temporada. A cronometragem aplica os pontos automaticamente em cada resultado publicado.
        </p>
        <button type="button" className="button-secondary" onClick={() => void load()}>
          <RefreshCw aria-hidden="true" /> Atualizar
        </button>
      </div>

      <PanelState loading={loading} error={error} empty={!loading && !active.length ? "Nenhuma regra ativa." : undefined}>
        {active.map((rule) => {
          const info = formatInfo[rule.format] ?? { title: rule.format, scope: "", article: "—" };
          const bonuses = [
            rule.pole ? `+${formatPoints(rule.pole)} pole position na Super Pole` : null,
            rule.fastestLap ? `+${formatPoints(rule.fastestLap)} melhor volta da prova` : null,
            rule.bestPit ? `+${formatPoints(rule.bestPit)} melhor parada no box` : null,
          ].filter(Boolean);
          return (
            <section key={rule.id} className="data-card pv-rule">
              <div className="pv-rule-head">
                <div>
                  <h2>{info.title}</h2>
                  <p>{info.scope}</p>
                </div>
                <dl>
                  <div>
                    <dt>Regulamento</dt>
                    <dd>{info.article}</dd>
                  </div>
                  <div>
                    <dt>Versão</dt>
                    <dd>{rule.version}</dd>
                  </div>
                  <div>
                    <dt>Posições pontuadas</dt>
                    <dd>{rule.positions.length}</dd>
                  </div>
                </dl>
              </div>
              <RuleTable rule={rule} />
              <p className="pv-rule-foot">
                {bonuses.length ? `Bônus: ${bonuses.join(" · ")}.` : "Sem bônus."} Penalidades descontam pontos conforme o
                Art. 22 (−10, −15 ou −20).
              </p>
            </section>
          );
        })}

        {history.length ? (
          <details className="pv-details">
            <summary>Versões anteriores ({history.length}) — não são mais usadas</summary>
            <ul className="pv-history">
              {history.map((rule) => (
                <li key={rule.id}>
                  <b>
                    {formatInfo[rule.format]?.title ?? rule.format} · versão {rule.version}
                  </b>
                  <span>
                    {rule.positions.map(([position, points]) => `${position}º ${formatPoints(points)}`).join(" · ")}
                  </span>
                </li>
              ))}
            </ul>
          </details>
        ) : null}

        {editor ? (
          <LazyDetails summary="Editar a tabela de pontos (abre o formulário de edição)">{editor}</LazyDetails>
        ) : null}
      </PanelState>
    </div>
  );
}
