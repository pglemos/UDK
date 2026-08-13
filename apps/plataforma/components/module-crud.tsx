"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  Check,
  CloudOff,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import type { ModuleAction, ModuleConfig, ModuleField } from "../lib/module-config";
import {
  enqueueOfflineOperation,
  flushOfflineQueue,
  getOfflineQueue,
  type OfflineQueueOwner,
} from "../lib/offline-queue";
import { dateTimeLocalToIso, isoToDateTimeLocal } from "../lib/datetime";

type RecordRow = Record<string, unknown> & { id: string };
type RelationOption = { value: string; label: string; pai?: string };
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

function formatValue(
  value: unknown,
  field: ModuleField,
  relationOptions: Record<string, RelationOption[]>,
): string {
  if (value === null || value === undefined || value === "") return "—";
  if (field.kind === "relation") {
    return relationOptions[field.key]?.find((option) => option.value === String(value))?.label ?? String(value);
  }
  if (field.kind === "checkbox") return value ? "Sim" : "Não";
  if (field.kind === "currency") {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value) / 100);
  }
  if (field.kind === "datetime") return new Date(String(value)).toLocaleString("pt-BR");
  if (field.kind === "date") return new Date(`${String(value).slice(0, 10)}T12:00:00`).toLocaleDateString("pt-BR");
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

function buildPayload(config: ModuleConfig, values: Record<string, unknown>): Record<string, unknown> {
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
  if (["approved", "published", "homologated", "official", "active", "paid", "closed"].includes(normalized)) {
    return "status-badge status-success";
  }
  if (["rejected", "cancelled", "disqualified", "revoked", "suspended", "failed"].includes(normalized)) {
    return "status-badge status-danger";
  }
  if (["analysis", "submitted", "provisional", "pending", "review", "invited"].includes(normalized)) {
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
      return `Já existe um ${config.singular} com esses dados. Altere o que precisa ser único (slug, número ou versão) e salve de novo.${sufixo}`;
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
      return e?.message ? `Não foi possível salvar: ${e.message}` : "Não foi possível salvar o registro.";
  }
}

function isNetworkError(error: unknown): boolean {
  const message = String((error as { message?: string } | undefined)?.message ?? error).toLowerCase();
  return !navigator.onLine || message.includes("fetch") || message.includes("network") || message.includes("timeout");
}

export function ModuleCrud({ client, config, owner }: ModuleCrudProps) {
  const [records, setRecords] = useState<RecordRow[]>([]);
  const [relationOptions, setRelationOptions] = useState<Record<string, RelationOption[]>>({});
  const [values, setValues] = useState<Record<string, unknown>>(() => initialValues(config));
  const [fileValues, setFileValues] = useState<Record<string, File | undefined>>({});
  const [editing, setEditing] = useState<RecordRow>();
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pendingOffline, setPendingOffline] = useState(0);
  const modalRef = useRef<HTMLElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const savingRef = useRef(false);

  const visibleFields = useMemo(() => config.fields.slice(0, 5), [config.fields]);
  const filteredRecords = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return records;
    return records.filter((record) =>
      config.fields.some((field) => formatValue(record[field.key], field, relationOptions).toLowerCase().includes(term)),
    );
  }, [config.fields, records, relationOptions, search]);

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
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(',');
  const focusable = Array.from(modal.querySelectorAll<HTMLElement>(selector));
  (focusable[0] ?? modal).focus();

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && !savingRef.current) {
      event.preventDefault();
      setModalOpen(false);
      return;
    }
    if (event.key !== 'Tab') return;
    const activeFocusable = Array.from(
      modal.querySelectorAll<HTMLElement>(selector),
    );
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

  document.addEventListener('keydown', handleKeyDown);
  return () => {
    document.removeEventListener('keydown', handleKeyDown);
    previousFocusRef.current?.focus();
    previousFocusRef.current = null;
  };
}, [modalOpen]);

  const loadRelations = useCallback(async () => {
    const relationFields = config.fields.filter((field) => field.kind === "relation" && field.relation);
    const entries = await Promise.all(
      relationFields.map(async (field) => {
        const relation = field.relation!;
        const valueColumn = relation.valueColumn ?? "id";
        let query = client
          .from(relation.table)
          .select(
            [valueColumn, relation.labelColumn, relation.dependsOn?.column]
              .filter(Boolean)
              .join(","),
          )
          .is("deleted_at", null)
          .limit(1000);
        for (const [key, value] of Object.entries(relation.filters ?? {})) query = query.eq(key, value);
        const { data, error: relationError } = await query;
        if (relationError) throw relationError;
        const options = ((data ?? []) as unknown as Record<string, unknown>[]).map((row) => ({
          value: String(row[valueColumn]),
          label: String(row[relation.labelColumn] ?? row[valueColumn]),
          ...(relation.dependsOn ? { pai: String(row[relation.dependsOn.column] ?? "") } : {}),
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
      setError(loadError instanceof Error ? loadError.message : "Não foi possível carregar os dados.");
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
    const queueHandler = () => void getOfflineQueue(owner).then((queue) => setPendingOffline(queue.length));
    window.addEventListener("online", onlineHandler);
    window.addEventListener("udk:offline-queue", queueHandler);
    return () => {
      window.removeEventListener("online", onlineHandler);
      window.removeEventListener("udk:offline-queue", queueHandler);
    };
  }, [loadRecords, owner, syncOffline]);

  function openCreate() {
    setEditing(undefined);
    setValues(initialValues(config));
    setFileValues({});
    setError("");
    setModalOpen(true);
  }

  function openEdit(record: RecordRow) {
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
      const { data, error: relationError } = await client.from("registrations").select("driver_id").eq("id", payload.registration_id).single();
      if (relationError) throw relationError;
      driverId = data.driver_id;
    }
    if (!stageId && typeof payload.incident_id === "string") {
      const { data, error: relationError } = await client.from("incidents").select("stage_id").eq("id", payload.incident_id).single();
      if (relationError) throw relationError;
      stageId = data.stage_id;
    }
    if (!stageId && typeof payload.result_id === "string") {
      const { data, error: relationError } = await client.from("results").select("stage_id").eq("id", payload.result_id).single();
      if (relationError) throw relationError;
      stageId = data.stage_id;
    }
    if (!stageId && typeof payload.team_id === "string") {
      const { data, error: relationError } = await client.from("endurance_teams").select("stage_id").eq("id", payload.team_id).single();
      if (relationError) throw relationError;
      stageId = data.stage_id;
    }
    if (driverId) {
      const { data, error: relationError } = await client.from("drivers").select("season_id").eq("id", driverId).single();
      if (relationError) throw relationError;
      return data.season_id;
    }
    if (stageId) {
      const { data, error: relationError } = await client.from("stages").select("season_id").eq("id", stageId).single();
      if (relationError) throw relationError;
      return data.season_id;
    }
    if (typeof payload.term_id === "string") {
      const { data, error: relationError } = await client.from("terms").select("season_id").eq("id", payload.term_id).single();
      if (relationError) throw relationError;
      return data.season_id;
    }
    return undefined;
  }

  async function resolveStorageScope(bucket: string, payload: Record<string, unknown>): Promise<StorageScope> {
    if (bucket === "public-media") {
      if (typeof payload.championship_id === "string") return { kind: "championship", id: payload.championship_id };
      if (typeof payload.sponsor_id === "string") {
        const { data, error: relationError } = await client.from("sponsors").select("championship_id").eq("id", payload.sponsor_id).single();
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
        const { error: uploadError } = await client.storage.from(bucket).upload(path, file, { upsert: false });
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

      setNotice(`${config.singular.replace(/^./, (letter) => letter.toUpperCase())} salvo(a) com sucesso.`);
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
    if (!window.confirm(`Arquivar ${String(record[config.titleColumn] ?? config.singular)}?`)) return;
    setSaving(true);
    setError("");
    const { error: deleteError } = await client.from(config.table).update({ deleted_at: new Date().toISOString() }).eq("id", record.id);
    if (deleteError) {
      if (isNetworkError(deleteError)) {
        try {
          await enqueueOfflineOperation(owner, { table: config.table, action: "delete", payload: {}, recordId: record.id });
          setPendingOffline((await getOfflineQueue(owner)).length);
          setNotice("Arquivamento adicionado à fila offline.");
        } catch (queueError) {
          setError(queueError instanceof Error ? queueError.message : deleteError.message);
        }
      } else setError(deleteError.message);
      setSaving(false);
      return;
    }
    setNotice("Registro arquivado com exclusão lógica.");
    await loadRecords();
    setSaving(false);
  }

  async function runAction(record: RecordRow, action: ModuleAction) {
    if (!window.confirm(action.confirmation)) return;
    setSaving(true);
    setError("");
    const parameters = Object.fromEntries(Object.entries(action.parameterMap).map(([parameter, recordKey]) => [parameter, record[recordKey]]));
    const { error: actionError } = await client.rpc(action.rpc, parameters);
    if (actionError) setError(actionError.message);
    else {
      setNotice(`${action.label} concluído.`);
      await loadRecords();
    }
    setSaving(false);
  }

  const updateValue = (field: ModuleField, value: unknown) =>
    setValues((current) => {
      const proximo = { ...current, [field.key]: value };
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
        <div className="search-box"><Search size={18} /><input aria-label={`Buscar em ${config.label}`} placeholder="Buscar registros" value={search} onChange={(event) => setSearch(event.target.value)} /></div>
        <button className="button-secondary" type="button" onClick={() => void loadRecords()} disabled={loading}><RefreshCw size={17} className={loading ? "spin" : ""} />Atualizar</button>
        {!config.readOnly ? <button className="button-primary" type="button" onClick={openCreate}><Plus size={18} />Novo</button> : null}
      </div>

      {pendingOffline > 0 ? <div className="offline-banner" role="status"><CloudOff size={18} />{pendingOffline} operação(ões) aguardando sincronização.<button type="button" onClick={() => void syncOffline()}>Sincronizar agora</button></div> : null}
      {error ? <div className="alert alert-error" role="alert">{error}</div> : null}
      {notice ? <div className="alert alert-success" role="status">{notice}</div> : null}

      <div className="data-card">
        <div className="data-card-head"><div><strong>{filteredRecords.length}</strong><span>registro(s)</span></div><small>Dados protegidos pelas políticas RLS do Supabase</small></div>
        {loading ? <div className="empty-state"><LoaderCircle className="spin" /><p>Carregando {config.label.toLowerCase()}...</p></div> : filteredRecords.length === 0 ? <div className="empty-state"><Check /><h3>Nenhum registro encontrado</h3><p>Altere a busca ou crie o primeiro registro deste módulo.</p></div> : (
          <div className="table-scroll"><table className="admin-table"><thead><tr>{visibleFields.map((field) => <th key={field.key}>{field.label}</th>)}<th>Atualizado</th><th className="actions-column">Ações</th></tr></thead><tbody>{filteredRecords.map((record) => (
            <tr key={record.id}>{visibleFields.map((field) => { const formatted = formatValue(record[field.key], field, relationOptions); const completo = record[field.key] == null ? "" : String(typeof record[field.key] === "object" ? JSON.stringify(record[field.key]) : record[field.key]); return <td key={field.key} title={completo || formatted}>{field.key === "status" ? <span className={statusClass(record[field.key])}>{formatted}</span> : formatted}</td>; })}<td>{record.updated_at ? new Date(String(record.updated_at)).toLocaleString("pt-BR") : "—"}</td><td className="row-actions">
              {!config.readOnly ? config.actions?.map((action) => <button type="button" className="icon-button action-button" title={action.label} aria-label={action.label} onClick={() => void runAction(record, action)} key={action.key} disabled={saving}><RefreshCw size={16} /></button>) : null}
              {!config.readOnly && !config.createOnly ? <><button type="button" className="icon-button" title="Editar" aria-label="Editar registro" onClick={() => openEdit(record)}><Pencil size={16} /></button><button type="button" className="icon-button danger" title="Arquivar" aria-label="Arquivar registro" onClick={() => void deleteRecord(record)}><Trash2 size={16} /></button></> : null}
            </td></tr>
          ))}</tbody></table></div>
        )}
      </div>

      {modalOpen ? <div className="modal-backdrop" role="presentation" onMouseDown={() => !saving && setModalOpen(false)}><section ref={modalRef} className="modal" role="dialog" aria-modal="true" aria-labelledby="module-modal-title" tabIndex={-1} onMouseDown={(event) => event.stopPropagation()}><div className="modal-head"><div><small>{editing ? "Editar" : "Novo registro"}</small><h2 id="module-modal-title">{config.singular.replace(/^./, (letter) => letter.toUpperCase())}</h2></div><button className="icon-button" type="button" aria-label="Fechar modal" onClick={() => setModalOpen(false)} disabled={saving}><X /></button></div>
        <form onSubmit={(event) => void saveRecord(event)}><div className="form-grid">{config.fields.map((field) => {
          const value = values[field.key];
          const common = { id: `field-${field.key}`, required: field.kind === "file" ? Boolean(field.required && !value) : field.required, disabled: field.readOnly || saving };
          return <label key={field.key} className={field.kind === "textarea" || field.kind === "json" ? "form-wide" : ""}><span>{field.label}{field.required ? <b> *</b> : null}</span>
            {field.kind === "textarea" || field.kind === "json" ? <textarea {...common} rows={field.kind === "json" ? 9 : 4} placeholder={field.placeholder} value={String(value ?? "")} onChange={(event) => updateValue(field, event.target.value)} /> : null}
            {field.kind === "select" ? <select {...common} value={String(value ?? "")} onChange={(event) => updateValue(field, event.target.value)}><option value="">Selecione</option>{field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : null}
            {field.kind === "relation" ? (() => {
              const dep = field.relation?.dependsOn;
              const pai = dep ? String(values[dep.field] ?? "") : "";
              const opcoes = (relationOptions[field.key] ?? []).filter((option) => !dep || (pai ? option.pai === pai : false));
              const aguardandoPai = Boolean(dep && !pai);
              return <select {...common} value={String(value ?? "")} onChange={(event) => updateValue(field, event.target.value)}>
                <option value="">{aguardandoPai ? `Selecione ${dep?.field === "stage_id" ? "a etapa" : "o campo anterior"} primeiro` : "Selecione"}</option>
                {opcoes.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>;
            })() : null}
            {field.kind === "checkbox" ? <span className="checkbox-field"><input {...common} type="checkbox" checked={Boolean(value)} onChange={(event) => updateValue(field, event.target.checked)} />Ativo</span> : null}
            {field.kind === "file" ? <input {...common} type="file" accept={field.accept} onChange={(event) => setFileValues((current) => ({ ...current, [field.key]: event.target.files?.[0] }))} /> : null}
            {["text", "number", "currency", "datetime", "date"].includes(field.kind) ? <input {...common} type={field.kind === "number" || field.kind === "currency" ? "number" : field.kind === "datetime" ? "datetime-local" : field.kind} step={field.kind === "currency" ? "1" : undefined} placeholder={field.placeholder} value={String(value ?? "")} onChange={(event) => updateValue(field, event.target.value)} /> : null}
          </label>;
        })}</div>{error ? <div className="alert alert-error" role="alert">{error}</div> : null}<div className="modal-actions"><button className="button-secondary" type="button" onClick={() => setModalOpen(false)} disabled={saving}>Cancelar</button><button className="button-primary" type="submit" disabled={saving}>{saving ? <LoaderCircle className="spin" size={17} /> : <Check size={17} />}Salvar</button></div></form>
      </section></div> : null}
    </section>
  );
}
