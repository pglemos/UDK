"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ArrowRight } from "lucide-react";
import { PanelState, errorMessage } from "./shared";
import { moduleHref } from "../../lib/painel-structure";

type Championship = { id: string; name: string; description: string; color: string; status: string };
type Season = { id: string; name: string; year: number; status: string; startsAt: string; endsAt: string };
type Summary = { categories: number; stages: number; regulation: string; rules: number; sponsors: number };

const championshipStatus = [
  { value: "active", label: "Ativo — aparece no site" },
  { value: "draft", label: "Em preparação" },
  { value: "closed", label: "Encerrado" },
  { value: "archived", label: "Arquivado" },
];
const seasonStatus = [
  { value: "registration", label: "Inscrições abertas" },
  { value: "active", label: "Em andamento" },
  { value: "homologated", label: "Homologada (resultado final)" },
  { value: "draft", label: "Em preparação" },
  { value: "archived", label: "Arquivada" },
];

function toDateInput(iso: string): string {
  return iso ? new Date(iso).toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" }) : "";
}

export function ChampionshipSettings({ client, readOnly }: { client: SupabaseClient; readOnly: boolean }) {
  const [championship, setChampionship] = useState<Championship | null>(null);
  const [season, setSeason] = useState<Season | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data: champ, error: champError } = await client
        .from("championships")
        .select("id,name,description,status,primary_color")
        .eq("slug", "udk")
        .is("deleted_at", null)
        .single();
      if (champError) throw champError;
      const { data: seasonRow, error: seasonError } = await client
        .from("seasons")
        .select("id,name,year,status,starts_at,ends_at")
        .eq("championship_id", champ.id)
        .is("deleted_at", null)
        .order("year", { ascending: false })
        .limit(1)
        .single();
      if (seasonError) throw seasonError;
      const [categories, stages, terms, rules, sponsors] = await Promise.all([
        client.from("categories").select("id", { count: "exact", head: true }).eq("season_id", seasonRow.id).is("deleted_at", null),
        client.from("stages").select("id", { count: "exact", head: true }).eq("season_id", seasonRow.id).is("deleted_at", null),
        client.from("terms").select("version").eq("kind", "regulation").eq("status", "published").is("deleted_at", null).order("version", { ascending: false }).limit(1),
        client.from("points_rules").select("id", { count: "exact", head: true }).eq("active", true).is("deleted_at", null),
        client.from("sponsors").select("id", { count: "exact", head: true }).eq("status", "active").is("deleted_at", null),
      ]);
      setChampionship({
        id: String(champ.id),
        name: String(champ.name ?? ""),
        description: String(champ.description ?? ""),
        color: String(champ.primary_color ?? "#28cce5"),
        status: String(champ.status ?? "active"),
      });
      setSeason({
        id: String(seasonRow.id),
        name: String(seasonRow.name ?? ""),
        year: Number(seasonRow.year),
        status: String(seasonRow.status ?? "active"),
        // datas no fuso de Brasília (AAAA-MM-DD), como o campo de data mostra e grava
        startsAt: toDateInput(String(seasonRow.starts_at ?? "")),
        endsAt: toDateInput(String(seasonRow.ends_at ?? "")),
      });
      setSummary({
        categories: categories.count ?? 0,
        stages: stages.count ?? 0,
        regulation: terms.data?.[0] ? `versão ${terms.data[0].version} publicada` : "não publicado",
        rules: rules.count ?? 0,
        sponsors: sponsors.count ?? 0,
      });
    } catch (loadError) {
      setError(errorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!championship || !season) return;
    if (!championship.name.trim() || !season.name.trim()) {
      setError("Informe o nome do campeonato e da temporada.");
      return;
    }
    if (season.startsAt && season.endsAt && season.endsAt < season.startsAt) {
      setError("O fim da temporada precisa ser depois do início.");
      return;
    }
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const champUpdate = await client
        .from("championships")
        .update({
          name: championship.name.trim(),
          description: championship.description.trim() || null,
          primary_color: championship.color,
          status: championship.status,
        })
        .eq("id", championship.id);
      if (champUpdate.error) throw champUpdate.error;
      const seasonUpdate = await client
        .from("seasons")
        .update({
          name: season.name.trim(),
          year: season.year,
          status: season.status,
          starts_at: season.startsAt ? new Date(`${season.startsAt}T00:00:00-03:00`).toISOString() : null,
          ends_at: season.endsAt ? new Date(`${season.endsAt}T23:59:00-03:00`).toISOString() : null,
        })
        .eq("id", season.id);
      if (seasonUpdate.error) throw seasonUpdate.error;
      setNotice("Configurações salvas. O site já usa os novos dados.");
      await load();
    } catch (saveError) {
      setError(errorMessage(saveError));
    } finally {
      setSaving(false);
    }
  }

  const links = summary
    ? [
        { label: "Categorias", value: `${summary.categories} ativas`, href: moduleHref("configuracoes") },
        { label: "Etapas", value: `${summary.stages} no calendário`, href: moduleHref("calendario") },
        { label: "Regulamento", value: summary.regulation, href: moduleHref("termos") },
        { label: "Regras de pontuação", value: `${summary.rules} em vigor`, href: moduleHref("pontuacao") },
        { label: "Patrocinadores", value: `${summary.sponsors} no site`, href: moduleHref("patrocinadores") },
        { label: "Equipe e acessos", value: "quem opera o painel", href: moduleHref("equipe") },
      ]
    : [];

  return (
    <PanelState loading={loading} error={!championship ? error : ""}>
      {championship && season ? (
        <div className="pv-settings">
          <form className="pv-settings-form" onSubmit={(event) => void save(event)}>
            {notice ? <div className="alert alert-success" role="status">{notice}</div> : null}
            {error ? <div className="alert alert-error" role="alert">{error}</div> : null}

            <fieldset disabled={readOnly || saving}>
              <legend>Campeonato</legend>
              <p className="pv-note pv-left">Nome e descrição aparecem no site e nos documentos oficiais.</p>
              <div className="form-grid">
                <label className="form-wide">
                  Nome
                  <input value={championship.name} required onChange={(event) => setChampionship({ ...championship, name: event.target.value })} />
                </label>
                <label className="form-wide">
                  Descrição
                  <textarea rows={2} value={championship.description} onChange={(event) => setChampionship({ ...championship, description: event.target.value })} />
                </label>
                <label>
                  Cor de destaque
                  <span className="pv-color-field">
                    <input type="color" value={championship.color} onChange={(event) => setChampionship({ ...championship, color: event.target.value })} aria-label="Escolher cor" />
                    <input value={championship.color} onChange={(event) => setChampionship({ ...championship, color: event.target.value })} pattern="#[0-9A-Fa-f]{6}" aria-label="Código da cor" />
                  </span>
                </label>
                <label>
                  Situação
                  <select value={championship.status} onChange={(event) => setChampionship({ ...championship, status: event.target.value })}>
                    {championshipStatus.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </label>
              </div>
            </fieldset>

            <fieldset disabled={readOnly || saving}>
              <legend>Temporada</legend>
              <p className="pv-note pv-left">A temporada agrupa etapas, categorias, classificação e regulamento.</p>
              <div className="form-grid">
                <label>
                  Nome
                  <input value={season.name} required onChange={(event) => setSeason({ ...season, name: event.target.value })} />
                </label>
                <label>
                  Ano
                  <input type="number" min={2020} max={2100} value={season.year} onChange={(event) => setSeason({ ...season, year: Number(event.target.value) })} />
                </label>
                <label>
                  Início
                  <input type="date" value={season.startsAt} onChange={(event) => setSeason({ ...season, startsAt: event.target.value })} />
                </label>
                <label>
                  Fim
                  <input type="date" value={season.endsAt} onChange={(event) => setSeason({ ...season, endsAt: event.target.value })} />
                </label>
                <label className="form-wide">
                  Situação
                  <select value={season.status} onChange={(event) => setSeason({ ...season, status: event.target.value })}>
                    {seasonStatus.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </label>
              </div>
            </fieldset>

            {readOnly ? null : (
              <div className="pv-editor-actions">
                <button type="submit" className="button-primary" disabled={saving}>
                  {saving ? "Salvando…" : "Salvar configurações"}
                </button>
              </div>
            )}
          </form>

          <aside className="pv-settings-aside" aria-label="Outras configurações">
            <h2>Também faz parte da configuração</h2>
            <ul>
              {links.map((link) => (
                <li key={link.label}>
                  <Link href={link.href}>
                    <span className="pv-stack">
                      <b>{link.label}</b>
                      <small>{link.value}</small>
                    </span>
                    <ArrowRight aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      ) : null}
    </PanelState>
  );
}
