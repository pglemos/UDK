"use client";

import { useMemo, useState, type ReactNode } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

export type StageInfo = {
  id: string;
  title: string;
  startsAt: string;
  format: string;
  status: string;
  /** "1ª", "2ª"... pela ordem da data. */
  ordinal: string;
  shortDate: string;
};

/** Etapas da temporada em ordem de data, com o número ordinal usado em todo o painel. */
export async function loadStages(client: SupabaseClient): Promise<StageInfo[]> {
  const { data, error } = await client
    .from("stages")
    .select("id,title,starts_at,format,status")
    .is("deleted_at", null)
    .order("starts_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row, index) => {
    const startsAt = String(row.starts_at);
    return {
      id: String(row.id),
      title: String(row.title ?? ""),
      startsAt,
      format: String(row.format ?? ""),
      status: String(row.status ?? ""),
      ordinal: `${index + 1}ª`,
      shortDate: new Date(startsAt).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        timeZone: "America/Sao_Paulo",
      }),
    };
  });
}

export function formatLap(ms: number | null | undefined): string {
  if (ms === null || ms === undefined || !Number.isFinite(ms) || ms <= 0) return "—";
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const millis = Math.round(ms % 1000);
  return `${minutes}:${String(seconds).padStart(2, "0")}.${String(millis).padStart(3, "0")}`;
}

export function formatPoints(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return Number.isInteger(value) ? String(value) : value.toFixed(1).replace(".", ",");
}

export function normalizeSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

export type SortDirection = "asc" | "desc";

/**
 * Ordenação por coluna: clicar na mesma coluna inverte a direção. Valores vazios
 * (null/undefined) ficam sempre no fim, para "sem volta" não aparecer como a melhor.
 */
export function useSortable<T, K extends string>(
  rows: T[],
  accessors: Record<K, (row: T) => number | string | null | undefined>,
  initial: { key: NoInfer<K>; direction: SortDirection },
) {
  const [sort, setSort] = useState(initial);
  const sorted = useMemo(() => {
    const read = accessors[sort.key];
    const factor = sort.direction === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const va = read(a);
      const vb = read(b);
      const emptyA = va === null || va === undefined || va === "";
      const emptyB = vb === null || vb === undefined || vb === "";
      if (emptyA || emptyB) return emptyA === emptyB ? 0 : emptyA ? 1 : -1;
      if (typeof va === "number" && typeof vb === "number") return (va - vb) * factor;
      return String(va).localeCompare(String(vb), "pt-BR", { numeric: true }) * factor;
    });
    // accessors é estável por chamada de componente; a ordenação só depende das linhas e da escolha
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, sort]);

  function toggle(key: K, firstDirection: SortDirection = "asc") {
    setSort((current) =>
      current.key === key
        ? { key, direction: current.direction === "asc" ? "desc" : "asc" }
        : { key, direction: firstDirection },
    );
  }

  return { sorted, sort, toggle };
}

export function SortHeader<K extends string>({
  label,
  column,
  sort,
  onSort,
  firstDirection = "asc",
  align = "start",
  title,
}: {
  label: string;
  column: K;
  sort: { key: K; direction: SortDirection };
  onSort: (key: K, firstDirection?: SortDirection) => void;
  firstDirection?: SortDirection;
  align?: "start" | "end";
  title?: string;
}) {
  const active = sort.key === column;
  const Icon = !active ? ArrowUpDown : sort.direction === "asc" ? ArrowUp : ArrowDown;
  return (
    <th
      scope="col"
      aria-sort={active ? (sort.direction === "asc" ? "ascending" : "descending") : "none"}
      className={align === "end" ? "pv-num" : undefined}
    >
      <button
        type="button"
        className={`pv-sort${active ? " is-active" : ""}`}
        onClick={() => onSort(column, firstDirection)}
        title={title}
      >
        <span>{label}</span>
        <Icon aria-hidden="true" />
      </button>
    </th>
  );
}

export function PanelState({
  loading,
  error,
  empty,
  children,
}: {
  loading: boolean;
  error: string;
  empty?: ReactNode;
  children: ReactNode;
}) {
  if (loading) {
    return (
      <div className="pv-skeleton" role="status" aria-busy="true">
        <span className="pv-skeleton-label">Carregando…</span>
        {Array.from({ length: 6 }, (_, index) => (
          <i key={index} aria-hidden="true" />
        ))}
      </div>
    );
  }
  if (error) {
    return (
      <div className="alert alert-error" role="alert">
        {error}
      </div>
    );
  }
  if (empty) return <div className="pv-state">{empty}</div>;
  return <>{children}</>;
}

export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string; hint?: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="pv-segmented" role="radiogroup" aria-label={label}>
      <span className="pv-segmented-label" aria-hidden="true">
        {label}
      </span>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          className={value === option.value ? "is-active" : undefined}
          onClick={() => onChange(option.value)}
          title={option.hint}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function errorMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) return String(error.message);
  return "Não foi possível carregar os dados agora. Tente atualizar a página.";
}

/** Glossário recolhível com os termos e siglas da tela. */
export function Glossary({ terms }: { terms: [string, string][] }) {
  return (
    <details className="pv-glossary">
      <summary>O que significa cada coluna?</summary>
      <dl>
        {terms.map(([term, meaning]) => (
          <div key={term}>
            <dt>{term}</dt>
            <dd>{meaning}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}
