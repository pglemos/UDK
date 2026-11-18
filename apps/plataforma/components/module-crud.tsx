"use client";

import { SortHeader } from "./painel/shared";
import { confirmAction } from "../lib/confirm-action";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  Archive,
  Check,
  CloudOff,
  Inbox,
  SearchX,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import type { ModuleAction, ModuleConfig, ModuleField } from "../lib/module-config";
import { fieldHelp } from "../lib/module-config";
import {
  enqueueOfflineOperation,
  flushOfflineQueue,
  getOfflineQueue,
  type OfflineQueueOwner,
} from "../lib/offline-queue";
import { dateTimeLocalToIso, isoToDateTimeLocal } from "../lib/datetime";

type RecordRow = Record<string, unknown> & { id: string };
type RelationOption = { value: string; label: string; pai?: string; fill?: Record<string, unknown> };
type UploadedObject = { bucket: string; path: string; fieldKey: string };
type StorageScope = { kind: "season" | "championship"; id: string };

type ModuleCrudProps = {
  client: SupabaseClient;
  config: ModuleConfig;
  owner: OfflineQueueOwner;
};

const PAGE_SIZE = 500;

function normalizeDateValue(value: unknown, kind: ModuleField["kind"]): string {
  if (!value || typeof value !== "string") return "";
  if (kind === "date") return value.slice(0, 10);
  if (kind === "datetime") return isoToDateTimeLocal(value);
  return value;
}

/** "Resultado oficial - 4a etapa - Corrida 1 - Geral" vira "4ª etapa · Corrida 1" nas listas. */
function shortRelationLabel(table: string, label: string): string {
  if (table !== "results") return label;
  return label
    .replace(/^Resultado oficial\s*-\s*/i, "")
    .replace(/\s*-\s*Geral$/i, "")
    .replace(/(\d)a etapa/i, "$1ª etapa")
    .replace(/\s+-\s+/g, " · ");
}

const LAP_TIME_KEYS = new Set(["best_lap_ms", "lap_time_ms", "fastest_lap_ms", "total_time_ms"]);

function formatLapTime(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const millis = Math.round(ms % 1000);
  return `${minutes}:${String(seconds).padStart(2, "0")}.${String(millis).padStart(3, "0")}`;
}

function formatValue(
  value: unknown,
  field: ModuleField,
  relationOptions: Record<string, RelationOption[]>,
): string {
  if (value === null || value === undefined || value === "") return "—";
  if (LAP_TIME_KEYS.has(field.key) && Number.isFinite(Number(value)) && Number(value) > 0)
    return formatLapTime(Number(value));
  if (field.kind === "relation") {
    return (
      relationOptions[field.key]?.find((option) => option.value === String(value))?.label ??
      String(value)
    );
  }
  if (field.kind === "select") {
    return field.options?.find((option) => option.value === String(value))?.label ?? String(value);
  }
  if (field.suggestions) {
    const match = field.suggestions.find((item) => item.value === String(value));
    if (match?.label) return `${String(value)} · ${match.label.split(" — ")[0]}`;
  }
  if (field.kind === "checkbox") return value ? "Sim" : "Não";
  if (field.kind === "currency") {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
      Number(value) / 100,
    );
  }
  if (field.kind === "datetime")
    return new Date(String(value)).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" });
  if (field.kind === "date")
    return new Date(`${String(value).slice(0, 10)}T12:00:00`).toLocaleDateString("pt-BR");
  if (typeof value === "object") return resumirObjeto(value);
  return encurtar(String(value));
}

// Campos de texto longo (o conteúdo de um regulamento inteiro, por exemplo)
// esticavam a célula em milhares de pixels. O texto completo segue no title da
// célula e no formulário de edição.
function encurtar(texto: string, limite = 90): string {
  const limpo = texto.replace(/\s+/g, " ").trim();
  return limpo.length > limite ? `${limpo.slice(0, limite - 1)}…` : limpo;
}

// Na listagem, um objeto cru vira ruído: a tabela de pontuação chegava a
// mostrar `{"1":50,"2":45,…}` em 6 mil pixels de largura. A célula passa a
// dizer o tamanho do conteúdo; o valor completo continua no formulário e no
// title da célula.
function resumirObjeto(value: object): string {
  if (Array.isArray(value)) {
    return value.length === 0 ? "—" : `${value.length} ${value.length === 1 ? "item" : "itens"}`;
  }
  const chaves = Object.keys(value as Record<string, unknown>);
  if (chaves.length === 0) return "—";
  return `${chaves.length} ${chaves.length === 1 ? "campo" : "campos"}`;
}

function initialValues(config: ModuleConfig): Record<string, unknown> {
  return Object.fromEntries(
    config.fields.map((field) => {
      if (field.kind === "checkbox") return [field.key, false];
      if (field.kind === "json") return [field.key, "{}"];
      return [field.key, ""];
    }),
  );
}

function editValues(config: ModuleConfig, record: RecordRow): Record<string, unknown> {
  return Object.fromEntries(
    config.fields.map((field) => {
      const value = record[field.key];
      if (field.kind === "json") return [field.key, JSON.stringify(value ?? {}, null, 2)];
      if (field.kind === "datetime" || field.kind === "date") {
        return [field.key, normalizeDateValue(value, field.kind)];
      }
      return [field.key, value ?? (field.kind === "checkbox" ? false : "")];
    }),
  );
}

function buildPayload(
  config: ModuleConfig,
  values: Record<string, unknown>,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  for (const field of config.fields) {
    if (field.readOnly || field.kind === "file") continue;
    const raw = values[field.key];
    if (raw === "" || raw === undefined) {
      if (!field.required) payload[field.key] = null;
      continue;
    }
    if (field.kind === "number" || field.kind === "currency") payload[field.key] = Number(raw);
    else if (field.kind === "json") payload[field.key] = JSON.parse(String(raw));
    else if (field.kind === "datetime") payload[field.key] = dateTimeLocalToIso(String(raw));
    else payload[field.key] = raw;
  }
  return payload;
}

function statusClass(value: unknown): string {
  const normalized = String(value ?? "").toLowerCase();
  if (
    ["approved", "published", "homologated", "official", "active", "paid", "closed"].includes(
      normalized,
    )
  ) {
    return "status-badge status-success";
  }
  if (
    ["rejected", "cancelled", "disqualified", "revoked", "suspended", "failed"].includes(normalized)
  ) {
    return "status-badge status-danger";
  }
  if (
    ["analysis", "submitted", "provisional", "pending", "review", "invited"].includes(normalized)
  ) {
    return "status-badge status-warning";
  }
  return "status-badge";
}

// O Postgres devolve o motivo real da recusa em `code`; sem tradução o painel
// mostrava sempre "Não foi possível salvar o registro." e o operador não tinha
// como saber se faltou um campo, se o vínculo estava errado ou se já existia
// um registro igual.
function descreverErro(error: unknown, config: ModuleConfig): string {
  const e = error as { code?: string; message?: string; details?: string } | undefined;
  const detalhe = String(e?.details ?? e?.message ?? "");
  const campoCitado = config.fields.find((f) => detalhe.includes(f.key))?.label;
  const sufixo = campoCitado ? ` Campo: ${campoCitado}.` : "";

  switch (e?.code) {
    case "23505":
      return `Já existe um ${config.singular} com esses dados. Altere o campo que precisa ser único e salve de novo.${sufixo}`;
    case "23503":
      return `Vínculo inválido: a combinação selecionada não existe. Confira os campos de seleção — sessão precisa pertencer à etapa escolhida.${sufixo}`;
    case "23502":
      return `Falta preencher um campo obrigatório.${sufixo}`;
    case "23514":
      return `Valor fora das opções aceitas para este ${config.singular}.${sufixo}`;
    case "22P02":
      return `Formato inválido em um dos campos (número, data ou JSON).${sufixo}`;
    case "42501":
      return "Seu papel não permite esta operação neste módulo.";
    default:
      return e?.message
        ? `Não foi possível salvar: ${e.message}`
        : "Não foi possível salvar o registro.";
  }
}

// As funções do banco levantam exceções em inglês e com o UUID do registro.
// Quem opera o campeonato não tem o que fazer com isso.
function traduzirRpc(mensagem: string): string {
  const m = mensagem.toLowerCase();
  if (m.includes("active points rule not found")) {
    return "Nenhuma regra de pontuação ativa atende esta etapa. Verifique em Regras de pontuação se existe uma regra ativa para a temporada, o formato da etapa e a categoria.";
  }
  if (m.includes("permission denied")) return "Seu papel não permite executar esta ação.";
  if (m.includes("result not found"))
    return "Resultado não encontrado — ele pode ter sido arquivado.";
  if (m.includes("not homologated")) return "A sessão precisa estar homologada antes desta ação.";
  return mensagem;
}

function isNetworkError(error: unknown): boolean {
  const message = String(
    (error as { message?: string } | undefined)?.message ?? error,
  ).toLowerCase();
  return (
    !navigator.onLine ||
    message.includes("fetch") ||
    message.includes("network") ||
    message.includes("timeout")
  );
}

const emptyNouns: Record<string, string> = {
  Financeiro: "pagamentos",
  Calendário: "etapas",
  Classificação: "classificações",
  Conteúdo: "notícias",
  Notificações: "avisos",
  Credenciamento: "credenciamentos",
  "Karts e sorteio": "karts sorteados",
  "Entradas de resultado": "posições lançadas",
};

const feminine = /(a|ção|são|ência|ade|agem|ança|equipe)$/;

function newLabel(singular = "registro"): string {
  return `${feminine.test(singular.split(" ")[0] ?? "") ? "Nova" : "Novo"} ${singular}`;
}

function emptyNoun(label: string): string {
  return emptyNouns[label] ?? label.toLowerCase();
}

export function ModuleCrud({ client, config, owner }: ModuleCrudProps) {
  const [records, setRecords] = useState<RecordRow[]>([]);
  const [relationOptions, setRelationOptions] = useState<Record<string, RelationOption[]>>({});
  const [values, setValues] = useState<Record<string, unknown>>(() => initialValues(config));
  const [fileValues, setFileValues] = useState<Record<string, File | undefined>>({});
  const [editing, setEditing] = useState<RecordRow>();
  const [search, setSearch] = useState("");
  const [invalidKeys, setInvalidKeys] = useState<Set<string>>(new Set());
  const [sort, setSort] = useState<{ key: string; direction: "asc" | "desc" }>({ key: "", direction: "asc" });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [lastArchived, setLastArchived] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [pageSize, setPageSize] = useState(50);
  const statusField = config.fields.find((field) => field.key === "status" && field.kind === "select");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pendingOffline, setPendingOffline] = useState(0);
  const modalRef = useRef<HTMLElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const savingRef = useRef(false);

  const visibleFields = useMemo(() => {
    if (!config.tableColumns?.length) return config.fields.slice(0, 5);
    const byKey = new Map(config.fields.map((field) => [field.key, field]));
    return config.tableColumns.map((key) => byKey.get(key)).filter((field): field is ModuleField => Boolean(field));
  }, [config.fields, config.tableColumns]);
  const filteredRecords = useMemo(() => {
    const term = search.trim().toLowerCase();
    const byStatus = statusFilter ? records.filter((record) => String(record.status ?? "") === statusFilter) : records;
    if (!term) return byStatus;
    return byStatus.filter((record) =>
      config.fields.some((field) =>
        formatValue(record[field.key], field, relationOptions).toLowerCase().includes(term),
      ),
    );
  }, [config.fields, records, relationOptions, search, statusFilter]);
  function helpFor(field: ModuleField): string | undefined {
    return field.help ?? fieldHelp[`${config.key}.${field.key}`];
  }

  function rowTitle(record: RecordRow): string {
    const field = config.fields.find((item) => item.key === config.titleColumn);
    const label = field ? formatValue(record[config.titleColumn], field, relationOptions) : "";
    return label && label !== "—" ? label : (config.singular ?? "registro");
  }

  const sortedRecords = useMemo(() => {
    if (!sort.key) return filteredRecords;
    const field = config.fields.find((item) => item.key === sort.key);
    const valueOf = (record: RecordRow): string | number => {
      const raw = record[sort.key];
      if (raw === null || raw === undefined || raw === "") return "";
      if (typeof raw === "number") return raw;
      if (field && (field.kind === "relation" || field.kind === "select")) return formatValue(raw, field, relationOptions);
      return String(raw);
    };
    const factor = sort.direction === "asc" ? 1 : -1;
    return [...filteredRecords].sort((a, b) => {
      const left = valueOf(a);
      const right = valueOf(b);
      if (left === "" && right !== "") return 1;
      if (right === "" && left !== "") return -1;
      if (typeof left === "number" && typeof right === "number") return (left - right) * factor;
      return String(left).localeCompare(String(right), "pt-BR", { numeric: true, sensitivity: "base" }) * factor;
    });
  }, [filteredRecords, sort, config.fields, relationOptions]);
  const shown = useMemo(() => sortedRecords.slice(0, pageSize), [sortedRecords, pageSize]);
  function toggleSort(key: string, first: "asc" | "desc" = "asc") {
    setSort((current) =>
      current.key === key ? { key, direction: current.direction === "asc" ? "desc" : "asc" } : { key, direction: first },
    );
  }



  useEffect(() => {
    savingRef.current = saving;
  }, [saving]);

  useEffect(() => {
    if (!modalOpen) return;
    previousFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const modal = modalRef.current;
    if (!modal) return;
    const selector = [
      "a[href]",
      "button:not([disabled])",
      "input:not([disabled])",
      "select:not([disabled])",
      "textarea:not([disabled])",
      '[tabindex]:not([tabindex="-1"])',
    ].join(",");
    const focusable = Array.from(modal.querySelectorAll<HTMLElement>(selector));
    (focusable[0] ?? modal).focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !savingRef.current) {
        event.preventDefault();
        setModalOpen(false);
        return;
      }
      if (event.key !== 'Tab') return;
      const activeFocusable = Array.from(modal.querySelectorAll<HTMLElement>(selector));
      if (activeFocusable.length === 0) {
        event.preventDefault();
        modal.focus();
        return;
      }
      const first = activeFocusable[0];
      const last = activeFocusable[activeFocusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previousFocusRef.current?.focus();
      previousFocusRef.current = null;
    };
  }, [modalOpen]);

  const loadRelations = useCallback(async () => {
    const relationFields = config.fields.filter(
      (field) => field.kind === "relation" && field.relation,
    );
    const entries = await Promise.all(
      relationFields.map(async (field) => {
        const relation = field.relation!;
        const valueColumn = relation.valueColumn ?? "id";
        let query = client
          .from(relation.table)
          .select(
            relation.labelSelect ??
              [valueColumn, relation.labelColumn, relation.dependsOn?.column].filter(Boolean).join(","),
          )
          .is("deleted_at", null)
          .limit(1000);
        for (const [key, value] of Object.entries(relation.filters ?? {}))
          query = query.eq(key, value);
        const { data, error: relationError } = await query;
        if (relationError) throw relationError;
        const options = ((data ?? []) as unknown as Record<string, unknown>[]).map((row) => ({
          value: String(row[valueColumn]),
          label: relation.formatLabel
            ? relation.formatLabel(row)
            : shortRelationLabel(relation.table, String(row[relation.labelColumn] ?? row[valueColumn])),
          ...(relation.dependsOn ? { pai: String(row[relation.dependsOn.column] ?? "") } : {}),
          ...(relation.fill ? { fill: relation.fill(row) } : {}),
        }));
        return [field.key, options] as const;
      }),
    );
    setRelationOptions(Object.fromEntries(entries));
  }, [client, config.fields]);

  const loadRecords = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const rows: RecordRow[] = [];
      let offset = 0;
      while (true) {
        let query = client
          .from(config.table)
          .select("*")
          .is("deleted_at", null)
          .order(config.orderBy ?? "created_at", { ascending: config.ascending ?? true })
          .order("id", { ascending: true })
          .range(offset, offset + PAGE_SIZE - 1);
        const { data, error: recordsError } = await query;
        if (recordsError) throw recordsError;
        const page = (data ?? []) as RecordRow[];
        rows.push(...page);
        if (page.length < PAGE_SIZE) break;
        offset += PAGE_SIZE;
      }
      setRecords(rows);
      await loadRelations();
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Não foi possível carregar os dados.",
      );
    } finally {
      setLoading(false);
    }
  }, [client, config.ascending, config.orderBy, config.table, loadRelations]);

  const syncOffline = useCallback(async () => {
    setError("");
    setNotice("");
    try {
      setPendingOffline((await getOfflineQueue(owner)).length);
      if (!navigator.onLine) return;
      const result = await flushOfflineQueue(client, owner);
      setPendingOffline(result.remaining);
      if (result.deadLettered > 0) {
        setError(
          `${result.deadLettered} operação(ões) excederam o limite de tentativas e foram movidas para a quarentena offline.`,
        );
      } else if (result.completed > 0) {
        setNotice(`${result.completed} operação(ões) sincronizada(s).`);
      }
      if (result.completed > 0 || result.deadLettered > 0) await loadRecords();
    } catch (syncError) {
      setError(
        syncError instanceof Error
          ? syncError.message
          : "Não foi possível sincronizar a fila offline.",
      );
    }
  }, [client, loadRecords, owner]);

  useEffect(() => {
    void loadRecords();
    void syncOffline();
    const onlineHandler = () => void syncOffline();
    const queueHandler = () =>
      void getOfflineQueue(owner).then((queue) => setPendingOffline(queue.length));
    window.addEventListener("online", onlineHandler);
    window.addEventListener("udk:offline-queue", queueHandler);
    return () => {
      window.removeEventListener("online", onlineHandler);
      window.removeEventListener("udk:offline-queue", queueHandler);
    };
  }, [loadRecords, owner, syncOffline]);

  function openCreate() {
    setInvalidKeys(new Set());
    setEditing(undefined);
    setValues(initialValues(config));
    setFileValues({});
    setError("");
    setModalOpen(true);
  }

  function openEdit(record: RecordRow) {
    setInvalidKeys(new Set());
    setEditing(record);
    setValues(editValues(config, record));
    setFileValues({});
    setError("");
    setModalOpen(true);
  }

  async function loadSeasonId(payload: Record<string, unknown>): Promise<string | undefined> {
    if (typeof payload.season_id === "string") return payload.season_id;
    let stageId = typeof payload.stage_id === "string" ? payload.stage_id : undefined;
    let driverId = typeof payload.driver_id === "string" ? payload.driver_id : undefined;

    if (!driverId && typeof payload.registration_id === "string") {
      const { data, error: relationError } = await client
        .from("registrations")
        .select("driver_id")
        .eq("id", payload.registration_id)
        .single();
      if (relationError) throw relationError;
      driverId = data.driver_id;
    }
    if (!stageId && typeof payload.incident_id === "string") {
      const { data, error: relationError } = await client
        .from("incidents")
        .select("stage_id")
        .eq("id", payload.incident_id)
        .single();
      if (relationError) throw relationError;
      stageId = data.stage_id;
    }
    if (!stageId && typeof payload.result_id === "string") {
      const { data, error: relationError } = await client
        .from("results")
        .select("stage_id")
        .eq("id", payload.result_id)
        .single();
      if (relationError) throw relationError;
      stageId = data.stage_id;
    }
    if (!stageId && typeof payload.team_id === "string") {
      const { data, error: relationError } = await client
        .from("endurance_teams")
        .select("stage_id")
        .eq("id", payload.team_id)
        .single();
      if (relationError) throw relationError;
      stageId = data.stage_id;
    }
    if (driverId) {
      const { data, error: relationError } = await client
        .from("drivers")
        .select("season_id")
        .eq("id", driverId)
        .single();
      if (relationError) throw relationError;
      return data.season_id;
    }
    if (stageId) {
      const { data, error: relationError } = await client
        .from("stages")
        .select("season_id")
        .eq("id", stageId)
        .single();
      if (relationError) throw relationError;
      return data.season_id;
    }
    if (typeof payload.term_id === "string") {
      const { data, error: relationError } = await client
        .from("terms")
        .select("season_id")
        .eq("id", payload.term_id)
        .single();
      if (relationError) throw relationError;
      return data.season_id;
    }
    return undefined;
  }

  async function resolveStorageScope(
    bucket: string,
    payload: Record<string, unknown>,
  ): Promise<StorageScope> {
    if (bucket === "public-media") {
      if (typeof payload.championship_id === "string")
        return { kind: "championship", id: payload.championship_id };
      if (typeof payload.sponsor_id === "string") {
        const { data, error: relationError } = await client
          .from("sponsors")
          .select("championship_id")
          .eq("id", payload.sponsor_id)
          .single();
        if (relationError) throw relationError;
        return { kind: "championship", id: data.championship_id };
      }
      throw new Error("Não foi possível identificar o campeonato do arquivo público.");
    }
    const seasonId = await loadSeasonId(payload);
    if (!seasonId) throw new Error("Não foi possível identificar a temporada do arquivo privado.");
    return { kind: "season", id: seasonId };
  }

  async function cleanupUploads(objects: UploadedObject[]): Promise<void> {
    const groups = objects.reduce<Map<string, string[]>>((map, object) => {
      map.set(object.bucket, [...(map.get(object.bucket) ?? []), object.path]);
      return map;
    }, new Map());
    await Promise.all(
      Array.from(groups.entries()).map(async ([bucket, paths]) => {
        const { error: removalError } = await client.storage.from(bucket).remove(paths);
        if (removalError) console.error("Falha ao remover upload órfão", removalError);
      }),
    );
  }

  async function uploadFiles(payload: Record<string, unknown>): Promise<UploadedObject[]> {
    const uploaded: UploadedObject[] = [];
    try {
      const { data: userData, error: userError } = await client.auth.getUser();
      if (userError || !userData.user) throw userError ?? new Error("Usuário não autenticado.");
      for (const field of config.fields.filter((candidate) => candidate.kind === "file")) {
        const file = fileValues[field.key];
        if (!file) continue;
        const bucket = field.storageBucket ?? "private-documents";
        const scope = await resolveStorageScope(bucket, payload);
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
        const path = `${scope.kind}/${scope.id}/${userData.user.id}/${crypto.randomUUID()}-${safeName}`;
        const { error: uploadError } = await client.storage
          .from(bucket)
          .upload(path, file, { upsert: false });
        if (uploadError) throw uploadError;
        uploaded.push({ bucket, path, fieldKey: field.key });
        payload[field.key] = path;
      }
      return uploaded;
    } catch (uploadError) {
      await cleanupUploads(uploaded);
      throw uploadError;
    }
  }

  async function saveRecord(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    let uploaded: UploadedObject[] = [];
    let keepUploads = false;

    try {
      // Validação própria: diz quais campos faltam, em vez do balão do navegador num campo só.
      const missing = config.fields.filter((field) => {
        if (!field.required || field.readOnly || field.kind === "checkbox") return false;
        if (field.kind === "file" && editing) return false;
        const value = values[field.key];
        return value === "" || value === null || value === undefined;
      });
      setInvalidKeys(new Set(missing.map((field) => field.key)));
      if (missing.length) {
        const first = missing[0];
        if (first) window.requestAnimationFrame(() => document.getElementById(`field-${first.key}`)?.focus());
        throw new Error(
          missing.length === 1
            ? `Preencha o campo ${missing[0]?.label}.`
            : `Preencha os campos: ${missing.map((field) => field.label).join(", ")}.`,
        );
      }
      // Pares mutuamente exclusivos: avisar antes de gastar um round-trip e
      // receber de volta a violação de CHECK do banco.
      for (const field of config.fields) {
        if (!field.exclusiveWith?.length || !values[field.key]) continue;
        const conflito = field.exclusiveWith.find((outro) => values[outro]);
        if (!conflito) continue;
        const rotulo = config.fields.find((f) => f.key === conflito)?.label ?? conflito;
        throw new Error(`Preencha ${field.label} ou ${rotulo}, não os dois.`);
      }

      const payload = buildPayload(config, values);
      if (config.table === "term_acceptances") payload.user_id = owner.userId;
      uploaded = await uploadFiles(payload);

      const mutation = editing
        ? client.from(config.table).update(payload).eq("id", editing.id)
        : client.from(config.table).insert(payload);
      const { error: mutationError } = await mutation;

      if (mutationError) {
        if (isNetworkError(mutationError)) {
          await enqueueOfflineOperation(
            owner,
            editing
              ? { table: config.table, action: "update", payload, recordId: editing.id }
              : { table: config.table, action: "insert", payload },
          );
          keepUploads = true;
          setPendingOffline((await getOfflineQueue(owner)).length);
          setNotice("Sem conexão. A operação foi salva na fila offline criptografada.");
          setModalOpen(false);
          return;
        }
        throw mutationError;
      }

      if (editing && uploaded.length > 0) {
        const replaced = uploaded.flatMap((object) => {
          const previousPath = editing[object.fieldKey];
          return typeof previousPath === "string" && previousPath !== object.path
            ? [{ bucket: object.bucket, path: previousPath, fieldKey: object.fieldKey }]
            : [];
        });
        await cleanupUploads(replaced);
      }

      setNotice(
        `${config.singular.replace(/^./, (letter) => letter.toUpperCase())} salvo(a) com sucesso.`,
      );
      setModalOpen(false);
      await loadRecords();
    } catch (saveError) {
      if (!keepUploads) await cleanupUploads(uploaded);
      setError(descreverErro(saveError, config));
    } finally {
      setSaving(false);
    }
  }

  async function deleteRecord(record: RecordRow) {
    const applied = ["homologated", "published", "approved"].includes(String(record.status ?? ""));
    if (!(await confirmAction(`Arquivar este registro de ${config.singular ?? "cadastro"}? Ele sai da lista, mas o histórico fica guardado.${applied ? " Atenção: ele já está valendo (homologado/publicado); arquivar não recalcula resultados nem classificação." : ""}`, "Arquivar")))
      return;
    setSaving(true);
    setError("");
    const { error: deleteError } = await client
      .from(config.table)
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", record.id);
    if (deleteError) {
      if (isNetworkError(deleteError)) {
        try {
          await enqueueOfflineOperation(owner, {
            table: config.table,
            action: "delete",
            payload: {},
            recordId: record.id,
          });
          setPendingOffline((await getOfflineQueue(owner)).length);
          setNotice("Arquivamento adicionado à fila offline.");
        } catch (queueError) {
          setError(queueError instanceof Error ? queueError.message : deleteError.message);
        }
      } else setError(deleteError.message);
      setSaving(false);
      return;
    }
    setLastArchived([String(record.id)]);
    setNotice("Registro arquivado.");
    await loadRecords();
    setSaving(false);
  }

  async function archiveSelected() {
    const ids = Array.from(selected);
    if (!ids.length) return;
    if (!(await confirmAction(`Arquivar ${ids.length} registro(s) de ${config.label.toLowerCase()}? Eles saem da lista, mas o histórico fica guardado.`, "Arquivar")))
      return;
    setSaving(true);
    setError("");
    const { error: bulkError } = await client.from(config.table).update({ deleted_at: new Date().toISOString() }).in("id", ids);
    if (bulkError) setError(bulkError.message);
    else {
      setLastArchived(ids);
      setSelected(new Set());
      setNotice(`${ids.length} registro(s) arquivado(s).`);
      await loadRecords();
    }
    setSaving(false);
  }

  async function undoArchive() {
    if (!lastArchived.length) return;
    setSaving(true);
    setError("");
    const { error: undoError } = await client.from(config.table).update({ deleted_at: null }).in("id", lastArchived);
    if (undoError) setError(undoError.message);
    else {
      setNotice(`${lastArchived.length} registro(s) de volta à lista.`);
      setLastArchived([]);
      await loadRecords();
    }
    setSaving(false);
  }

  async function runAction(record: RecordRow, action: ModuleAction) {
    if (!(await confirmAction(action.confirmation))) return;
    setSaving(true);
    setError("");
    const parameters = Object.fromEntries(
      Object.entries(action.parameterMap).map(([parameter, recordKey]) => [
        parameter,
        record[recordKey],
      ]),
    );
    const { error: actionError } = await client.rpc(action.rpc, parameters);
    if (actionError) setError(traduzirRpc(actionError.message));
    else {
      setNotice(`${action.label} concluído.`);
      await loadRecords();
    }
    setSaving(false);
  }

  const updateValue = (field: ModuleField, value: unknown) =>
    setValues((current) => {
      const proximo: Record<string, unknown> = { ...current, [field.key]: value };
      // Escolher um item do regulamento ou uma relação pode preencher outros campos.
      const sugestao = field.suggestions?.find((item) => item.value === value);
      if (sugestao?.fill) Object.assign(proximo, sugestao.fill);
      const opcao = relationOptions[field.key]?.find((item) => item.value === value);
      if (opcao?.fill) Object.assign(proximo, opcao.fill);
      // Trocar a etapa invalida a sessão escolhida: ela pertencia à etapa
      // anterior e o banco recusaria a combinação.
      for (const outro of config.fields) {
        if (outro.relation?.dependsOn?.field === field.key) proximo[outro.key] = "";
      }
      return proximo;
    });

  return (
    <section className="module-workspace">
      <div className="module-toolbar">
        <div className="search-box">
          <Search size={18} />
          <input
            aria-keyshortcuts="/"
            aria-label={`Buscar em ${config.label}`}
            placeholder={`Buscar em ${config.label.toLowerCase()}`}
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPageSize(50);
            }}
          />
        </div>
        {statusField?.options?.length ? (
          <label className="pv-select">
            <span>Situação</span>
            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setPageSize(50);
              }}
            >
              <option value="">Todas</option>
              {statusField.options
                .filter((option) => records.some((record) => String(record.status ?? "") === option.value))
                .map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
            </select>
          </label>
        ) : null}
        <button
          className="button-secondary"
          type="button"
          onClick={() => void loadRecords()}
          disabled={loading}
        >
          <RefreshCw size={17} className={loading ? "spin" : ""} />
          Atualizar
        </button>
        {!config.readOnly ? (
          <button className="button-primary" type="button" onClick={openCreate} aria-keyshortcuts="N" title="Atalho: N">
            <Plus size={18} />
            {newLabel(config.singular)}
          </button>
        ) : null}
        <span className="pv-kbd-hint" aria-hidden="true">
          <kbd>/</kbd> busca{config.readOnly ? "" : <> · <kbd>N</kbd> novo</>}
        </span>
      </div>

      {pendingOffline > 0 ? (
        <div className="offline-banner" role="status">
          <CloudOff size={18} />
          {pendingOffline} operação(ões) aguardando sincronização.
          <button type="button" onClick={() => void syncOffline()}>
            Sincronizar agora
          </button>
        </div>
      ) : null}
      {error ? (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      ) : null}
      {notice ? (
        <div className="alert alert-success pv-undo" role="status">
          <span>{notice}</span>
          {lastArchived.length ? (
            <button type="button" className="button-secondary pv-small" onClick={() => void undoArchive()} disabled={saving}>
              Desfazer
            </button>
          ) : null}
        </div>
      ) : null}

      {selected.size ? (
        <div className="pv-bulk" role="region" aria-label="Ações em lote">
          <b>{selected.size} selecionado(s)</b>
          <button type="button" className="button-secondary pv-small" onClick={() => void archiveSelected()} disabled={saving}>
            <Archive size={15} aria-hidden="true" /> Arquivar selecionados
          </button>
          <button type="button" className="pv-link-button" onClick={() => setSelected(new Set())}>
            Limpar seleção
          </button>
        </div>
      ) : null}

      <div className="data-card">
        <div className="data-card-head">
          <div>
            <strong>{filteredRecords.length}</strong>
            <span>
              {filteredRecords.length === 1 ? "registro" : "registros"}
              {filteredRecords.length > pageSize ? ` · mostrando ${pageSize}` : ""}
            </span>
          </div>
        </div>
        {loading ? (
          <div className="empty-state">
            <LoaderCircle className="spin" />
            <p>Carregando {config.label.toLowerCase()}...</p>
          </div>
        ) : filteredRecords.length === 0 ? (
          search.trim() ? (
            <div className="empty-state">
              <SearchX aria-hidden="true" />
              <h3>Nada encontrado para “{search.trim()}”</h3>
              <p>Confira a grafia ou limpe a busca para ver todos.</p>
            </div>
          ) : (
            <div className="empty-state">
              <Inbox aria-hidden="true" />
              <h3>Ainda não há {emptyNoun(config.label)}</h3>
              <p>
                {config.emptyHint ??
                  (config.readOnly
                  ? "Os registros aparecem aqui assim que forem feitos."
                  : `Use “${newLabel(config.singular)}” para cadastrar o primeiro.`)}
              </p>
            </div>
          )
        ) : (
          <div className="table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  {config.readOnly || config.createOnly ? null : (
                    <th className="pv-check">
                      <input
                        type="checkbox"
                        aria-label="Selecionar todos os visíveis"
                        checked={shown.length > 0 && shown.every((record) => selected.has(String(record.id)))}
                        onChange={(event) =>
                          setSelected(event.target.checked ? new Set(shown.map((record) => String(record.id))) : new Set())
                        }
                      />
                    </th>
                  )}
                  {visibleFields.map((field) => (
                    <SortHeader key={field.key} label={field.label} column={field.key} sort={sort} onSort={toggleSort} />
                  ))}
                  {config.tableColumns ? null : <th>Atualizado</th>}
                  {config.readOnly ? null : <th className="actions-column">Ações</th>}
                </tr>
              </thead>
              <tbody>
                {shown.map((record) => (
                  <tr key={record.id} className={selected.has(String(record.id)) ? "is-selected" : undefined}>
                    {config.readOnly || config.createOnly ? null : (
                      <td className="pv-check">
                        <input
                          type="checkbox"
                          aria-label="Selecionar registro"
                          checked={selected.has(String(record.id))}
                          onChange={(event) =>
                            setSelected((current) => {
                              const next = new Set(current);
                              if (event.target.checked) next.add(String(record.id));
                              else next.delete(String(record.id));
                              return next;
                            })
                          }
                        />
                      </td>
                    )}
                    {visibleFields.map((field) => {
                      const formatted = formatValue(record[field.key], field, relationOptions);
                      const completo =
                        record[field.key] == null
                          ? ""
                          : String(
                              typeof record[field.key] === "object"
                                ? JSON.stringify(record[field.key])
                                : record[field.key],
                            );
                      return (
                        <td key={field.key} data-label={field.label} title={completo || formatted} className={field.kind === "select" || field.kind === "date" || field.kind === "datetime" ? "pv-nowrap" : undefined}>
                          {field.key === "status" ? (
                            <span className={statusClass(record[field.key])}>{formatted}</span>
                          ) : field.key === "color" && /^#[0-9a-f]{3,8}$/i.test(formatted) ? (
                            <span className="pv-swatch">
                              <i style={{ background: formatted }} aria-hidden="true" />
                              {formatted.toUpperCase()}
                            </span>
                          ) : (
                            formatted
                          )}
                        </td>
                      );
                    })}
                    {config.tableColumns ? null : (
                      <td>
                        {record.updated_at
                          ? new Date(String(record.updated_at)).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })
                          : "—"}
                      </td>
                    )}
                    {config.readOnly ? null : (
                    <td className="row-actions">
                      {!config.readOnly
                        ? config.actions?.map((action) => (
                            <button
                              type="button"
                              className="row-action"
                              onClick={() => void runAction(record, action)}
                              key={action.key}
                              disabled={saving}
                            >
                              <RefreshCw size={15} aria-hidden="true" /> {action.label}
                            </button>
                          ))
                        : null}
                      {!config.readOnly && !config.createOnly ? (
                        <>
                          <button type="button" className="row-action" onClick={() => openEdit(record)} aria-label={`Editar ${rowTitle(record)}`}>
                            <Pencil size={15} aria-hidden="true" /> Editar
                          </button>
                          <button type="button" className="row-action is-quiet" onClick={() => void deleteRecord(record)} aria-label={`Arquivar ${rowTitle(record)}`}>
                            <Archive size={15} aria-hidden="true" /> Arquivar
                          </button>
                        </>
                      ) : null}
                    </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredRecords.length > pageSize ? (
              <div className="pv-more">
                <button type="button" className="button-secondary" onClick={() => setPageSize((size) => size + 50)}>
                  Mostrar mais {Math.min(50, filteredRecords.length - pageSize)} ({filteredRecords.length - pageSize} restantes)
                </button>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {modalOpen ? (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={() => !saving && setModalOpen(false)}
        >
          <section
            ref={modalRef}
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="module-modal-title"
            tabIndex={-1}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="modal-head">
              <div>
                <small>{editing ? "Editar" : "Novo registro"}</small>
                <h2 id="module-modal-title">
                  {config.singular.replace(/^./, (letter) => letter.toUpperCase())}
                </h2>
              </div>
              <button
                className="icon-button"
                type="button"
                aria-label="Fechar modal"
                onClick={() => setModalOpen(false)}
                disabled={saving}
              >
                <X />
              </button>
            </div>
            <form noValidate onSubmit={(event) => void saveRecord(event)}>
              <div className="form-grid">
                {config.fields.map((field) => {
                  const value = values[field.key];
                  const common = {
                    id: `field-${field.key}`,
                    required:
                      field.kind === "file" ? Boolean(field.required && !value) : field.required,
                    disabled: field.readOnly || saving,
                    "aria-invalid": invalidKeys.has(field.key) || undefined,
                    "aria-describedby": helpFor(field) ? `help-${field.key}` : undefined,
                  };
                  return (
                    <label
                      key={field.key}
                      className={
                        field.kind === "textarea" || field.kind === "json" ? "form-wide" : ""
                      }
                    >
                      <span>
                        {field.label}
                        {field.required ? <b> *</b> : null}
                      </span>
                      {helpFor(field) ? (
                        <small className="field-help" id={`help-${field.key}`}>
                          {helpFor(field)}
                        </small>
                      ) : null}
                      {field.kind === "textarea" || field.kind === "json" ? (
                        <textarea
                          {...common}
                          rows={field.kind === "json" ? 9 : 4}
                          placeholder={field.placeholder}
                          value={String(value ?? "")}
                          onChange={(event) => updateValue(field, event.target.value)}
                        />
                      ) : null}
                      {field.kind === "select" ? (
                        <select
                          {...common}
                          value={String(value ?? "")}
                          onChange={(event) => updateValue(field, event.target.value)}
                        >
                          <option value="">Selecione</option>
                          {field.options?.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      ) : null}
                      {field.kind === "relation"
                        ? (() => {
                            const dep = field.relation?.dependsOn;
                            const pai = dep ? String(values[dep.field] ?? "") : "";
                            const opcoes = (relationOptions[field.key] ?? []).filter(
                              (option) => !dep || (pai ? option.pai === pai : false),
                            );
                            const aguardandoPai = Boolean(dep && !pai);
                            // Sem nenhuma opção, um campo obrigatório trava o envio sem dizer
                            // por quê: o navegador só recusa o submit em silêncio.
                            const vazio = !aguardandoPai && opcoes.length === 0;
                            return (
                              <>
                                <select
                                  {...common}
                                  value={String(value ?? "")}
                                  onChange={(event) => updateValue(field, event.target.value)}
                                >
                                  <option value="">
                                    {aguardandoPai
                                      ? `Selecione ${dep?.field === "stage_id" ? "a etapa" : "o campo anterior"} primeiro`
                                      : vazio
                                        ? "Nenhum registro disponível"
                                        : "Selecione"}
                                  </option>
                                  {opcoes.map((option) => (
                                    <option key={option.value} value={option.value}>
                                      {option.label}
                                    </option>
                                  ))}
                                </select>
                                {vazio ? (
                                  <small className="field-hint">
                                    Cadastre ao menos um registro em{" "}
                                    {field.relation?.table === "endurance_teams"
                                      ? "Equipes de resistência"
                                      : field.label}{" "}
                                    antes de continuar.
                                  </small>
                                ) : null}
                              </>
                            );
                          })()
                        : null}
                      {field.kind === "checkbox" ? (
                        <span className="checkbox-field">
                          <input
                            {...common}
                            type="checkbox"
                            checked={Boolean(value)}
                            onChange={(event) => updateValue(field, event.target.checked)}
                          />
                          Ativo
                        </span>
                      ) : null}
                      {field.kind === "file" ? (
                        <input
                          {...common}
                          type="file"
                          accept={field.accept}
                          onChange={(event) =>
                            setFileValues((current) => ({
                              ...current,
                              [field.key]: event.target.files?.[0],
                            }))
                          }
                        />
                      ) : null}
                      {["text", "number", "currency", "datetime", "date"].includes(field.kind) ? (
                        <input
                          {...common}
                          type={
                            field.kind === "number" || field.kind === "currency"
                              ? "number"
                              : field.kind === "datetime"
                                ? "datetime-local"
                                : field.kind
                          }
                          step={field.kind === "currency" ? "1" : undefined}
                          placeholder={field.placeholder}
                          value={String(value ?? "")}
                          list={field.suggestions ? `sugestoes-${field.key}` : undefined}
                          onChange={(event) => updateValue(field, event.target.value)}
                        />
                      ) : null}
                      {field.suggestions ? (
                        <datalist id={`sugestoes-${field.key}`}>
                          {field.suggestions.map((item) => (
                            <option key={item.value} value={item.value} label={item.label} />
                          ))}
                        </datalist>
                      ) : null}
                    </label>
                  );
                })}
              </div>
              {error ? (
                <div className="alert alert-error" role="alert">
                  {error}
                </div>
              ) : null}
              <div className="modal-actions">
                <button
                  className="button-secondary"
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button className="button-primary" type="submit" disabled={saving}>
                  {saving ? <LoaderCircle className="spin" size={17} /> : <Check size={17} />}Salvar
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </section>
  );
}
