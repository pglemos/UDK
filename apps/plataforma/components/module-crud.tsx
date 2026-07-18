"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, CloudOff, LoaderCircle, Pencil, Plus, RefreshCw, Search, Trash2, X } from "lucide-react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ModuleConfig, ModuleField } from "../lib/module-config";
import {
  enqueueOfflineOperation,
  flushOfflineQueue,
  getOfflineQueue,
} from "../lib/offline-queue";

export type ModuleRecord = Record<string, unknown> & {
  id: string;
  created_at?: string;
  updated_at?: string;
};

type RelationOption = {
  value: string;
  label: string;
};

type ModuleCrudProps = {
  client: SupabaseClient;
  config: ModuleConfig;
};

function normalizeDateValue(value: unknown, kind: ModuleField["kind"]): string {
  if (!value || typeof value !== "string") return "";
  if (kind === "date") return value.slice(0, 10);
  if (kind === "datetime") return value.slice(0, 16);
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
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number(value) / 100);
  }
  if (field.kind === "datetime") {
    const date = new Date(String(value));
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString("pt-BR");
  }
  if (field.kind === "date") {
    const date = new Date(`${String(value)}T12:00:00`);
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString("pt-BR");
  }
  if (field.kind === "json") {
    return typeof value === "string" ? value : JSON.stringify(value);
  }

  return String(value);
}

function buildInitialValues(config: ModuleConfig, record?: ModuleRecord): Record<string, unknown> {
  return Object.fromEntries(
    config.fields.map((field) => {
      const source = record?.[field.key];
      if (field.kind === "checkbox") return [field.key, Boolean(source)];
      if (field.kind === "json") {
        return [field.key, source ? JSON.stringify(source, null, 2) : "{}"];
      }
      return [field.key, normalizeDateValue(source, field.kind)];
    }),
  );
}

function buildPayload(config: ModuleConfig, values: Record<string, unknown>): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  for (const field of config.fields) {
    if (field.readOnly || field.kind === "file") continue;
    const raw = values[field.key];

    if (raw === "" || raw === undefined) {
      payload[field.key] = null;
      continue;
    }

    if (field.kind === "number" || field.kind === "currency") {
      payload[field.key] = Number(raw);
      continue;
    }

    if (field.kind === "checkbox") {
      payload[field.key] = Boolean(raw);
      continue;
    }

    if (field.kind === "datetime") {
      payload[field.key] = new Date(String(raw)).toISOString();
      continue;
    }

    if (field.kind === "json") {
      payload[field.key] = typeof raw === "string" ? JSON.parse(raw) : raw;
      continue;
    }

    payload[field.key] = raw;
  }

  return payload;
}

function shouldQueueMutation(error: { message?: string } | null): boolean {
  if (typeof navigator !== "undefined" && !navigator.onLine) return true;
  const message = error?.message?.toLowerCase() ?? "";
  return message.includes("fetch") || message.includes("network") || message.includes("timeout");
}

function statusClass(value: unknown): string {
  const status = String(value ?? "").toLowerCase();
  if (["approved", "homologated", "published", "official", "active", "available"].includes(status)) {
    return "status status-success";
  }
  if (["rejected", "cancelled", "suspended", "disqualified", "failed", "annulled"].includes(status)) {
    return "status status-danger";
  }
  if (["analysis", "review", "provisional", "pending", "submitted", "registration"].includes(status)) {
    return "status status-warning";
  }
  return "status";
}

export function ModuleCrud({ client, config }: ModuleCrudProps) {
  const [records, setRecords] = useState<ModuleRecord[]>([]);
  const [relationOptions, setRelationOptions] = useState<Record<string, RelationOption[]>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ModuleRecord | undefined>();
  const [values, setValues] = useState<Record<string, unknown>>(() => buildInitialValues(config));
  const [fileValues, setFileValues] = useState<Record<string, File | undefined>>({});
  const [pendingOffline, setPendingOffline] = useState(0);

  const loadRelations = useCallback(async () => {
    const entries = await Promise.all(
      config.fields
        .filter((field) => field.kind === "relation" && field.relation)
        .map(async (field) => {
          const relation = field.relation!;
          const valueColumn = relation.valueColumn ?? "id";
          let query = client
            .from(relation.table)
            .select(`${valueColumn},${relation.labelColumn}`)
            .limit(500);

          for (const [key, value] of Object.entries(relation.filters ?? {})) {
            query = query.eq(key, value);
          }

          const { data, error: relationError } = await query;
          if (relationError) throw relationError;

          return [
            field.key,
            (data ?? []).map((row: Record<string, unknown>) => ({
              value: String(row[valueColumn]),
              label: String(row[relation.labelColumn] ?? row[valueColumn]),
            })),
          ] as const;
        }),
    );

    setRelationOptions(Object.fromEntries(entries));
  }, [client, config.fields]);

  const loadRecords = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      let query = client.from(config.table).select("*").limit(500);
      if (config.orderBy) {
        query = query.order(config.orderBy, { ascending: config.ascending ?? true });
      }

      const [{ data, error: recordsError }] = await Promise.all([query, loadRelations()]);
      if (recordsError) throw recordsError;
      setRecords((data ?? []) as ModuleRecord[]);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Não foi possível carregar os registros.");
    } finally {
      setLoading(false);
    }
  }, [client, config, loadRelations]);

  const syncOffline = useCallback(async () => {
    setPendingOffline(getOfflineQueue().length);
    if (typeof navigator !== "undefined" && navigator.onLine) {
      const result = await flushOfflineQueue(client);
      setPendingOffline(result.remaining);
      if (result.completed > 0) {
        setNotice(`${result.completed} operação(ões) offline sincronizada(s).`);
        await loadRecords();
      }
    }
  }, [client, loadRecords]);

  useEffect(() => {
    void loadRecords();
    void syncOffline();

    const onlineHandler = () => void syncOffline();
    const queueHandler = () => setPendingOffline(getOfflineQueue().length);
    window.addEventListener("online", onlineHandler);
    window.addEventListener("udk:offline-queue", queueHandler);

    return () => {
      window.removeEventListener("online", onlineHandler);
      window.removeEventListener("udk:offline-queue", queueHandler);
    };
  }, [loadRecords, syncOffline]);

  const filteredRecords = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return records;

    return records.filter((record) =>
      config.fields.some((field) =>
        formatValue(record[field.key], field, relationOptions).toLowerCase().includes(term),
      ),
    );
  }, [config.fields, records, relationOptions, search]);

  const visibleFields = useMemo(() => config.fields.slice(0, 6), [config.fields]);

  function openCreate() {
    setEditing(undefined);
    setValues(buildInitialValues(config));
    setFileValues({});
    setError("");
    setModalOpen(true);
  }

  function openEdit(record: ModuleRecord) {
    setEditing(record);
    setValues(buildInitialValues(config, record));
    setFileValues({});
    setError("");
    setModalOpen(true);
  }

  async function uploadFiles(payload: Record<string, unknown>): Promise<void> {
    for (const field of config.fields.filter((candidate) => candidate.kind === "file")) {
      const file = fileValues[field.key];
      if (!file) continue;

      const { data: userData, error: userError } = await client.auth.getUser();
      if (userError || !userData.user) throw userError ?? new Error("Usuário não autenticado.");

      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      const path = `${userData.user.id}/${crypto.randomUUID()}-${safeName}`;
      const { error: uploadError } = await client.storage
        .from(field.storageBucket ?? "private-documents")
        .upload(path, file, { upsert: false });
      if (uploadError) throw uploadError;
      payload[field.key] = path;
    }
  }

  async function saveRecord(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const payload = buildPayload(config, values);
      await uploadFiles(payload);

      const mutation = editing
        ? client.from(config.table).update(payload).eq("id", editing.id).select().single()
        : client.from(config.table).insert(payload).select().single();
      const { error: mutationError } = await mutation;

      if (mutationError) {
        if (shouldQueueMutation(mutationError)) {
          enqueueOfflineOperation({
            table: config.table,
            action: editing ? "update" : "insert",
            payload,
            recordId: editing?.id,
          });
          setPendingOffline(getOfflineQueue().length);
          setNotice("Sem conexão. A operação foi salva na fila offline.");
          setModalOpen(false);
          return;
        }
        throw mutationError;
      }

      setNotice(`${config.singular.replace(/^./, (letter) => letter.toUpperCase())} salvo(a) com sucesso.`);
      setModalOpen(false);
      await loadRecords();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Não foi possível salvar o registro.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteRecord(record: ModuleRecord) {
    if (!window.confirm(`Excluir ${config.singular} ${String(record[config.titleColumn] ?? "selecionado")}?`)) {
      return;
    }

    setError("");
    const { error: deleteError } = await client.from(config.table).delete().eq("id", record.id);
    if (deleteError) {
      if (shouldQueueMutation(deleteError)) {
        enqueueOfflineOperation({
          table: config.table,
          action: "delete",
          payload: {},
          recordId: record.id,
        });
        setPendingOffline(getOfflineQueue().length);
        setNotice("Sem conexão. A exclusão foi adicionada à fila offline.");
        return;
      }
      setError(deleteError.message);
      return;
    }

    setNotice("Registro excluído.");
    await loadRecords();
  }

  async function runAction(record: ModuleRecord, actionIndex: number) {
    const action = config.actions?.[actionIndex];
    if (!action || !window.confirm(action.confirmation)) return;

    const parameters = Object.fromEntries(
      Object.entries(action.parameterMap).map(([parameter, recordKey]) => [parameter, record[recordKey]]),
    );
    setSaving(true);
    setError("");

    const { error: actionError } = await client.rpc(action.rpc, parameters);
    if (actionError) setError(actionError.message);
    else {
      setNotice(`${action.label} concluído.`);
      await loadRecords();
    }
    setSaving(false);
  }

  function updateValue(field: ModuleField, value: unknown) {
    setValues((current) => ({ ...current, [field.key]: value }));
  }

  return (
    <section className="module-workspace">
      <div className="module-toolbar">
        <div className="search-box">
          <Search size={18} />
          <input
            aria-label={`Buscar em ${config.label}`}
            placeholder="Buscar registros"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <button className="button-secondary" type="button" onClick={() => void loadRecords()} disabled={loading}>
          <RefreshCw size={17} className={loading ? "spin" : ""} />
          Atualizar
        </button>
        {!config.readOnly ? (
          <button className="button-primary" type="button" onClick={openCreate}>
            <Plus size={18} />
            Novo
          </button>
        ) : null}
      </div>

      {pendingOffline > 0 ? (
        <div className="offline-banner">
          <CloudOff size={18} />
          {pendingOffline} operação(ões) aguardando sincronização.
          <button type="button" onClick={() => void syncOffline()}>
            Sincronizar agora
          </button>
        </div>
      ) : null}
      {error ? <div className="alert alert-error">{error}</div> : null}
      {notice ? <div className="alert alert-success">{notice}</div> : null}

      <div className="data-card">
        <div className="data-card-head">
          <div>
            <strong>{filteredRecords.length}</strong>
            <span>registro(s)</span>
          </div>
          <small>Dados protegidos pelas políticas RLS do Supabase</small>
        </div>

        {loading ? (
          <div className="empty-state">
            <LoaderCircle className="spin" />
            <p>Carregando {config.label.toLowerCase()}...</p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="empty-state">
            <Check />
            <h3>Nenhum registro encontrado</h3>
            <p>Altere a busca ou crie o primeiro registro deste módulo.</p>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  {visibleFields.map((field) => (
                    <th key={field.key}>{field.label}</th>
                  ))}
                  <th>Atualizado</th>
                  <th className="actions-column">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record) => (
                  <tr key={record.id}>
                    {visibleFields.map((field) => {
                      const formatted = formatValue(record[field.key], field, relationOptions);
                      const isStatus = field.key === "status";
                      return (
                        <td key={field.key} title={formatted}>
                          {isStatus ? <span className={statusClass(record[field.key])}>{formatted}</span> : formatted}
                        </td>
                      );
                    })}
                    <td>{record.updated_at ? new Date(record.updated_at).toLocaleString("pt-BR") : "—"}</td>
                    <td className="row-actions">
                      {config.actions?.map((action, index) => (
                        <button
                          type="button"
                          className="icon-button action-button"
                          title={action.label}
                          onClick={() => void runAction(record, index)}
                          key={action.key}
                          disabled={saving}
                        >
                          <RefreshCw size={16} />
                        </button>
                      ))}
                      {!config.readOnly ? (
                        <>
                          <button
                            type="button"
                            className="icon-button"
                            title="Editar"
                            onClick={() => openEdit(record)}
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            type="button"
                            className="icon-button danger"
                            title="Excluir"
                            onClick={() => void deleteRecord(record)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen ? (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => !saving && setModalOpen(false)}>
          <div className="modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
            <div className="modal-head">
              <div>
                <small>{editing ? "Editar" : "Novo registro"}</small>
                <h2>{config.singular.replace(/^./, (letter) => letter.toUpperCase())}</h2>
              </div>
              <button className="icon-button" type="button" onClick={() => setModalOpen(false)} disabled={saving}>
                <X />
              </button>
            </div>

            <form onSubmit={(event) => void saveRecord(event)}>
              <div className="form-grid">
                {config.fields.map((field) => {
                  const value = values[field.key];
                  const common = {
                    id: `field-${field.key}`,
                    required: field.required,
                    disabled: field.readOnly || saving,
                  };

                  return (
                    <label key={field.key} className={field.kind === "textarea" || field.kind === "json" ? "form-wide" : ""}>
                      <span>
                        {field.label}
                        {field.required ? <b> *</b> : null}
                      </span>

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

                      {field.kind === "relation" ? (
                        <select
                          {...common}
                          value={String(value ?? "")}
                          onChange={(event) => updateValue(field, event.target.value)}
                        >
                          <option value="">Selecione</option>
                          {relationOptions[field.key]?.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      ) : null}

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
                            setFileValues((current) => ({ ...current, [field.key]: event.target.files?.[0] }))
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
                          onChange={(event) => updateValue(field, event.target.value)}
                        />
                      ) : null}
                    </label>
                  );
                })}
              </div>

              {error ? <div className="alert alert-error">{error}</div> : null}

              <div className="modal-actions">
                <button className="button-secondary" type="button" onClick={() => setModalOpen(false)} disabled={saving}>
                  Cancelar
                </button>
                <button className="button-primary" type="submit" disabled={saving}>
                  {saving ? <LoaderCircle className="spin" size={17} /> : <Check size={17} />}
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}
