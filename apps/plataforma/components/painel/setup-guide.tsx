"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ArrowRight, Check, ChevronDown, Circle } from "lucide-react";
import { moduleHref } from "../../lib/painel-structure";

type Step = { key: string; module: string; title: string; done: boolean; detail: string };

/**
 * Primeiros passos: confere no banco o que já está configurado e leva direto ao que falta.
 * Só aparece para quem configura o campeonato (vê Configurações).
 */
export function SetupGuide({ client, allowedKeys }: { client: SupabaseClient; allowedKeys: ReadonlySet<string> }) {
  const [steps, setSteps] = useState<Step[] | null>(null);
  const [open, setOpen] = useState(true);
  const canSetup = allowedKeys.has("campeonato");

  useEffect(() => {
    if (!canSetup) return;
    let active = true;
    const total = (result: { count: number | null }) => result.count ?? 0;
    const head = (table: string) => client.from(table).select("id", { count: "exact", head: true }).is("deleted_at", null);
    void (async () => {
      const [season, categories, stages, regulation, rules, drivers, staff, sponsors] = await Promise.all([
        client.from("seasons").select("starts_at,ends_at").is("deleted_at", null).order("year", { ascending: false }).limit(1).maybeSingle(),
        head("categories").eq("status", "active").then(total),
        head("stages").then(total),
        head("terms").eq("kind", "regulation").eq("status", "published").then(total),
        head("points_rules").eq("active", true).then(total),
        head("drivers").neq("status", "archived").then(total),
        head("user_roles").in("role", ["admin", "organization", "judge", "marshal", "finance", "editor"]).then(total),
        head("sponsors").eq("status", "active").then(total),
      ]);
      if (!active) return;
      const seasonReady = Boolean(season.data?.starts_at && season.data?.ends_at);
      setSteps([
        { key: "campeonato", module: "campeonato", title: "Campeonato e temporada", done: seasonReady, detail: seasonReady ? "Nome, datas e situação definidos." : "Defina nome, datas e situação da temporada." },
        { key: "categorias", module: "configuracoes", title: "Categorias", done: categories > 0, detail: categories ? `${categories} categoria(s) ativa(s).` : "Crie as categorias do campeonato." },
        { key: "etapas", module: "calendario", title: "Calendário de etapas", done: stages > 0, detail: stages ? `${stages} etapa(s) no calendário.` : "Cadastre as datas e traçados das etapas." },
        { key: "regulamento", module: "termos", title: "Regulamento publicado", done: regulation > 0, detail: regulation ? "Regulamento vigente no site." : "Publique o regulamento da temporada." },
        { key: "pontuacao", module: "pontuacao", title: "Regras de pontuação", done: rules > 0, detail: rules ? `${rules} regra(s) em vigor.` : "Ative a tabela de pontos." },
        { key: "pilotos", module: "pilotos", title: "Pilotos cadastrados", done: drivers > 0, detail: drivers ? `${drivers} piloto(s) no campeonato.` : "Cadastre ou aprove os pilotos." },
        { key: "equipe", module: "equipe", title: "Equipe com acesso", done: staff > 1, detail: staff > 1 ? `${staff} acesso(s) da equipe.` : "Dê acesso à comissão, direção de prova e financeiro." },
        { key: "patrocinadores", module: "patrocinadores", title: "Patrocinadores no site", done: sponsors > 0, detail: sponsors ? `${sponsors} marca(s) no site.` : "Cadastre as marcas e suas logos." },
      ]);
    })().catch(() => undefined);
    return () => {
      active = false;
    };
  }, [client, canSetup]);

  useEffect(() => {
    if (steps && steps.every((step) => step.done)) setOpen(false);
  }, [steps]);

  if (!canSetup || !steps) return null;
  const done = steps.filter((step) => step.done).length;
  const next = steps.find((step) => !step.done);

  return (
    <section className="pv-setup" aria-labelledby="setup-title">
      <button type="button" className="pv-setup-head" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        <span>
          <h2 id="setup-title">{done === steps.length ? "Campeonato configurado" : "Primeiros passos"}</h2>
          <small>
            {done} de {steps.length} prontos{next ? ` · próximo: ${next.title}` : ""}
          </small>
        </span>
        <span className="pv-setup-bar" aria-hidden="true">
          <span style={{ width: `${(done / steps.length) * 100}%` }} />
        </span>
        <ChevronDown aria-hidden="true" className={open ? "is-open" : undefined} />
      </button>
      {open ? (
        <ol className="pv-setup-list">
          {steps.map((step) => (
            <li key={step.key} className={step.done ? "is-done" : undefined}>
              {step.done ? <Check aria-hidden="true" /> : <Circle aria-hidden="true" />}
              <span className="pv-stack">
                <b>{step.title}</b>
                <small>{step.detail}</small>
              </span>
              <Link href={moduleHref(step.module)} aria-label={`${step.done ? "Revisar" : "Configurar"} ${step.title}`}>
                {step.done ? "Revisar" : "Configurar"} <ArrowRight aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  );
}

const runbook = [
  {
    phase: "Antes da etapa",
    items: [
      { module: "inscricoes", label: "Conferir inscrições da etapa" },
      { module: "financeiro", label: "Confirmar pagamentos (Art. 10)" },
      { module: "calendario", label: "Revisar horário e traçado" },
    ],
  },
  {
    phase: "No dia",
    items: [
      { module: "checkin", label: "Marcar presença dos pilotos" },
      { module: "karts", label: "Registrar o sorteio de karts" },
      { module: "ocorrencias", label: "Anotar ocorrências de pista" },
    ],
  },
  {
    phase: "Depois da prova",
    items: [
      { module: "resultados", label: "Publicar resultados das corridas" },
      { module: "julgamentos", label: "Lançar penalidades e julgar recursos" },
      { module: "classificacao", label: "Conferir a classificação" },
      { module: "conteudo", label: "Publicar a notícia da etapa" },
    ],
  },
];

export function StageRunbook({ allowedKeys }: { allowedKeys: ReadonlySet<string> }) {
  const phases = runbook
    .map((phase) => ({ ...phase, items: phase.items.filter((item) => allowedKeys.has(item.module)) }))
    .filter((phase) => phase.items.length > 0);
  if (!phases.length) return null;
  return (
    <section className="pv-runbook" aria-labelledby="runbook-title">
      <h2 id="runbook-title">Roteiro de cada etapa</h2>
      <div className="pv-runbook-grid">
        {phases.map((phase) => (
          <div key={phase.phase}>
            <h3>{phase.phase}</h3>
            <ol>
              {phase.items.map((item) => (
                <li key={item.module}>
                  <Link href={moduleHref(item.module)}>
                    {item.label} <ArrowRight aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </section>
  );
}
