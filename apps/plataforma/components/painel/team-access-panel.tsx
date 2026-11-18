"use client";

import { confirmAction } from "../../lib/confirm-action";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Mail, Plus, RefreshCw, Search, ShieldCheck, Trash2, UserPlus, X } from "lucide-react";
import { PanelState, Segmented, errorMessage, normalizeSearch } from "./shared";
import {
  panelSections,
  roleDescriptions,
  roleLabels,
  roleOrder,
  staffRoles,
  type Role,
} from "../../lib/painel-structure";

type Grant = { id: string; role: Role; expiresAt: string | null; createdAt: string };
type Person = {
  id: string;
  name: string;
  email: string;
  lastSignInAt: string | null;
  invitedPending: boolean;
  roles: Grant[];
};
type Exception = {
  id: string;
  userRoleId: string;
  module: string;
  action: string;
  allowed: boolean;
  expiresAt: string | null;
};

const moduleLabel = new Map(
  panelSections.flatMap((section) =>
    section.tabs.map((tab) => [tab.module, section.key === "inicio" ? "Início" : `${section.label} · ${tab.label}`] as const),
  ),
);

function dateLabel(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

function relative(iso: string | null): string {
  if (!iso) return "Nunca entrou";
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "Hoje";
  if (days === 1) return "Ontem";
  if (days < 30) return `Há ${days} dias`;
  return dateLabel(iso);
}

function isExpired(iso: string | null): boolean {
  return Boolean(iso && new Date(iso).getTime() <= Date.now());
}

export function TeamAccessPanel({
  client,
  currentUserId,
  isAdmin,
}: {
  client: SupabaseClient;
  currentUserId: string;
  isAdmin: boolean;
}) {
  const [people, setPeople] = useState<Person[]>([]);
  const [exceptions, setExceptions] = useState<Exception[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [filter, setFilter] = useState<"equipe" | "participantes" | "todos">("equipe");
  const [query, setQuery] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const call = useCallback(
    async (method: string, body?: unknown) => {
      const { data } = await client.auth.getSession();
      const response = await fetch("/api/painel/acessos", {
        method,
        headers: {
          Authorization: `Bearer ${data.session?.access_token ?? ""}`,
          ...(body ? { "Content-Type": "application/json" } : {}),
        },
        body: body ? JSON.stringify(body) : null,
      });
      const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
      if (!response.ok) throw new Error(String(payload.error ?? "Não foi possível concluir."));
      return payload;
    },
    [client],
  );

  const loadedOnce = useRef(false);
  const load = useCallback(async () => {
    // só mostra o carregamento na primeira vez; nas atualizações a lista continua na tela
    if (!loadedOnce.current) setLoading(true);
    setError("");
    try {
      const payload = await call("GET");
      setPeople((payload.people as Person[]) ?? []);
      const { data, error: exceptionsError } = await client
        .from("role_permissions")
        .select("id,user_role_id,module,action,allowed,expires_at")
        .is("deleted_at", null);
      if (exceptionsError) throw exceptionsError;
      setExceptions(
        (data ?? []).map((row) => ({
          id: String(row.id),
          userRoleId: String(row.user_role_id),
          module: String(row.module),
          action: String(row.action),
          allowed: Boolean(row.allowed),
          expiresAt: row.expires_at ? String(row.expires_at) : null,
        })),
      );
    } catch (loadError) {
      setError(errorMessage(loadError));
    } finally {
      loadedOnce.current = true;
      setLoading(false);
    }
  }, [call, client]);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = useMemo(() => {
    const term = normalizeSearch(query);
    return people
      .filter((person) => {
        const staff = person.roles.some((grant) => staffRoles.includes(grant.role));
        if (filter === "equipe") return staff;
        if (filter === "participantes") return !staff;
        return true;
      })
      .filter((person) => !term || normalizeSearch(`${person.name} ${person.email}`).includes(term))
      .sort((a, b) => {
        const rank = (person: Person) => Math.min(...person.roles.map((grant) => roleOrder.indexOf(grant.role)));
        return rank(a) - rank(b) || a.name.localeCompare(b.name, "pt-BR");
      });
  }, [people, filter, query]);

  const selected = people.find((person) => person.id === selectedId) ?? null;

  async function run(action: () => Promise<unknown>, success: string) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await action();
      setNotice(success);
      await load();
    } catch (actionError) {
      setError(errorMessage(actionError));
    } finally {
      setBusy(false);
    }
  }

  const grantableRoles = roleOrder.filter((role) => isAdmin || role !== "admin");

  return (
    <div className="pv-workspace">
      <div className="pv-toolbar">
        <Segmented
          label="Quem mostrar"
          value={filter}
          onChange={setFilter}
          options={[
            { value: "equipe", label: "Equipe" },
            { value: "participantes", label: "Pilotos e responsáveis" },
            { value: "todos", label: "Todos" },
          ]}
        />
        <label className="search-box pv-search">
          <Search aria-hidden="true" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nome ou e-mail" aria-label="Buscar pessoa" />
        </label>
        <button type="button" className="button-secondary" onClick={() => void load()}>
          <RefreshCw aria-hidden="true" /> Atualizar
        </button>
        <button
          type="button"
          className="button-primary"
          onClick={() => {
            setInviteOpen(true);
            setSelectedId(null);
          }}
        >
          <UserPlus aria-hidden="true" /> Dar acesso
        </button>
      </div>

      {notice ? <div className="alert alert-success" role="status">{notice}</div> : null}
      {error ? <div className="alert alert-error" role="alert">{error}</div> : null}

      {inviteOpen ? (
        <InviteForm
          roles={grantableRoles}
          busy={busy}
          onClose={() => setInviteOpen(false)}
          onSubmit={(values) =>
            void run(async () => {
              const result = await call("POST", values);
              setInviteOpen(false);
              return result;
            }, `Acesso liberado para ${values.email}. Se ainda não tinha conta, a pessoa recebe um e-mail para criar a senha.`)
          }
        />
      ) : null}

      {selected ? (
        <PersonEditor
          key={selected.id}
          person={selected}
          exceptions={exceptions.filter((item) => selected.roles.some((grant) => grant.id === item.userRoleId))}
          roles={grantableRoles}
          isSelf={selected.id === currentUserId}
          isAdmin={isAdmin}
          busy={busy}
          onClose={() => setSelectedId(null)}
          onAddRole={(role, expiresAt) =>
            void run(() => call("POST", { email: selected.email, role, expiresAt }), `${roleLabels[role]} adicionado para ${selected.name}.`)
          }
          onChangeExpiry={(grant, expiresAt) =>
            void run(() => call("PATCH", { roleId: grant.id, expiresAt }), `Validade de ${roleLabels[grant.role]} atualizada.`)
          }
          onRemoveRole={async (grant) => {
            if (!(await confirmAction(`Tirar o papel ${roleLabels[grant.role]} de ${selected.name}? O acesso termina na hora.`, "Tirar acesso"))) return;
            void run(() => call("DELETE", { roleId: grant.id }), `${roleLabels[grant.role]} retirado de ${selected.name}.`);
          }}
          onAddException={(values) =>
            void run(async () => {
              const { error: insertError } = await client.from("role_permissions").insert(values);
              if (insertError) throw insertError;
            }, "Exceção salva.")
          }
          onRemoveException={(exception) =>
            void run(async () => {
              const { error: removeError } = await client
                .from("role_permissions")
                .update({ deleted_at: new Date().toISOString() })
                .eq("id", exception.id);
              if (removeError) throw removeError;
            }, "Exceção removida.")
          }
        />
      ) : null}

      <PanelState
        loading={loading}
        error=""
        empty={!loading && !visible.length ? "Ninguém nesse filtro." : undefined}
      >
        <section className="data-card">
          <div className="data-card-head">
            <div>
              <strong>{visible.length}</strong>
              <span>pessoas</span>
            </div>
            <p className="pv-note">Clique em uma pessoa para mudar papéis, validade ou abrir uma exceção.</p>
          </div>
          <div className="table-scroll">
            <table className="admin-table pv-table">
              <thead>
                <tr>
                  <th scope="col">Pessoa</th>
                  <th scope="col">Papéis</th>
                  <th scope="col">Último acesso</th>
                  <th scope="col" className="pv-num">Ações</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((person) => (
                  <tr key={person.id} className={person.id === selectedId ? "is-selected" : undefined}>
                    <th scope="row" className="pv-row-head">
                      <span className="pv-stack">
                        <b>
                          {person.name}
                          {person.id === currentUserId ? " (você)" : ""}
                        </b>
                        <small>{person.email || "sem e-mail"}</small>
                      </span>
                    </th>
                    <td>
                      <span className="pv-chips">
                        {person.roles.map((grant) => (
                          <span
                            key={grant.id}
                            className={`pv-chip${grant.role === "admin" ? " is-strong" : ""}${isExpired(grant.expiresAt) ? " is-expired" : ""}`}
                            title={roleDescriptions[grant.role]}
                          >
                            {roleLabels[grant.role]}
                            {grant.expiresAt ? ` · até ${dateLabel(grant.expiresAt)}` : ""}
                          </span>
                        ))}
                      </span>
                    </td>
                    <td>{person.invitedPending ? "Convite enviado" : relative(person.lastSignInAt)}</td>
                    <td className="pv-num">
                      <button
                        type="button"
                        className="button-secondary pv-small"
                        aria-label={`Gerenciar acesso de ${person.name}`}
                        onClick={() => {
                          setSelectedId(person.id);
                          setInviteOpen(false);
                        }}
                      >
                        Gerenciar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </PanelState>
    </div>
  );
}

function RoleSelect({
  roles,
  value,
  onChange,
}: {
  roles: Role[];
  value: Role;
  onChange: (role: Role) => void;
}) {
  return (
    <fieldset className="pv-role-picker">
      <legend>Papel</legend>
      {roles.map((role) => (
        <label key={role} className={value === role ? "is-active" : undefined}>
          <input type="radio" name="role" value={role} checked={value === role} onChange={() => onChange(role)} />
          <span>
            <b>{roleLabels[role]}</b>
            <small>{roleDescriptions[role]}</small>
          </span>
        </label>
      ))}
    </fieldset>
  );
}

function InviteForm({
  roles,
  busy,
  onClose,
  onSubmit,
}: {
  roles: Role[];
  busy: boolean;
  onClose: () => void;
  onSubmit: (values: { email: string; name: string; role: Role; expiresAt: string | null }) => void;
}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("organization");
  const [expires, setExpires] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit({ email, name, role, expiresAt: expires ? new Date(`${expires}T23:59:59-03:00`).toISOString() : null });
  }

  return (
    <section className="pv-editor" aria-labelledby="invite-title">
      <header>
        <h2 id="invite-title">Dar acesso ao painel</h2>
        <button type="button" className="icon-button" onClick={onClose} aria-label="Fechar">
          <X aria-hidden="true" />
        </button>
      </header>
      <form className="pv-access-form" onSubmit={submit}>
        <div className="form-grid">
          <label>
            E-mail
            <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nome@exemplo.com" />
          </label>
          <label>
            Nome (opcional)
            <input value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <label>
            Válido até (opcional)
            <input type="date" value={expires} onChange={(event) => setExpires(event.target.value)} />
            <small className="field-hint">Sem data, o acesso vale até ser retirado. Use prazo para fiscais e convidados de uma etapa.</small>
          </label>
        </div>
        <RoleSelect roles={roles} value={role} onChange={setRole} />
        <p className="pv-note pv-left">
          <Mail aria-hidden="true" /> Quem ainda não tem conta recebe um e-mail para criar a senha. Quem já tem entra com a senha de sempre e vê
          as áreas do novo papel.
        </p>
        <div className="pv-editor-actions">
          <button type="button" className="button-secondary" onClick={onClose} disabled={busy}>
            Cancelar
          </button>
          <button type="submit" className="button-primary" disabled={busy}>
            {busy ? "Liberando…" : "Liberar acesso"}
          </button>
        </div>
      </form>
    </section>
  );
}

function PersonEditor({
  person,
  exceptions,
  roles,
  isSelf,
  isAdmin,
  busy,
  onClose,
  onAddRole,
  onChangeExpiry,
  onRemoveRole,
  onAddException,
  onRemoveException,
}: {
  person: Person;
  exceptions: Exception[];
  roles: Role[];
  isSelf: boolean;
  isAdmin: boolean;
  busy: boolean;
  onClose: () => void;
  onAddRole: (role: Role, expiresAt: string | null) => void;
  onChangeExpiry: (grant: Grant, expiresAt: string | null) => void;
  onRemoveRole: (grant: Grant) => void;
  onAddException: (values: Record<string, unknown>) => void;
  onRemoveException: (exception: Exception) => void;
}) {
  const available = roles.filter((role) => !person.roles.some((grant) => grant.role === role));
  const [newRole, setNewRole] = useState<Role>(available[0] ?? "organization");
  const [exceptionModule, setExceptionModule] = useState(panelSections[1]?.tabs[0]?.module ?? "pilotos");
  const [exceptionAction, setExceptionAction] = useState<"read" | "manage">("manage");
  const [exceptionAllowed, setExceptionAllowed] = useState(true);
  const [exceptionUntil, setExceptionUntil] = useState("");
  const baseGrant = person.roles[0];

  return (
    <section className="pv-editor" aria-labelledby="person-title">
      <header>
        <div>
          <h2 id="person-title">{person.name}</h2>
          <p className="pv-note pv-left">{person.email}</p>
        </div>
        <button type="button" className="icon-button" onClick={onClose} aria-label="Fechar">
          <X aria-hidden="true" />
        </button>
      </header>

      <div className="pv-person-grid">
        <div>
          <h3 className="pv-block-title">Papéis</h3>
          <ul className="pv-grant-list">
            {person.roles.map((grant) => {
              const locked = (grant.role === "admin" && (!isAdmin || isSelf));
              return (
                <li key={grant.id}>
                  <span className="pv-stack">
                    <b>
                      <ShieldCheck aria-hidden="true" /> {roleLabels[grant.role]}
                    </b>
                    <small>{roleDescriptions[grant.role]}</small>
                  </span>
                  <label className="pv-inline-field">
                    Válido até
                    <input
                      type="date"
                      disabled={busy || locked}
                      defaultValue={grant.expiresAt ? grant.expiresAt.slice(0, 10) : ""}
                      onBlur={(event) => {
                        const next = event.target.value ? new Date(`${event.target.value}T23:59:59-03:00`).toISOString() : null;
                        if ((next ?? "").slice(0, 10) !== (grant.expiresAt ?? "").slice(0, 10)) onChangeExpiry(grant, next);
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    className="icon-button danger"
                    disabled={busy || locked}
                    onClick={() => onRemoveRole(grant)}
                    aria-label={`Tirar papel ${roleLabels[grant.role]}`}
                    title={locked ? "Você não pode tirar o seu próprio acesso de administrador" : undefined}
                  >
                    <Trash2 aria-hidden="true" />
                  </button>
                </li>
              );
            })}
          </ul>
          {available.length && person.email ? (
            <div className="pv-inline-add">
              <select value={newRole} onChange={(event) => setNewRole(event.target.value as Role)} aria-label="Papel para adicionar">
                {available.map((role) => (
                  <option key={role} value={role}>
                    {roleLabels[role]}
                  </option>
                ))}
              </select>
              <button type="button" className="button-secondary" disabled={busy} onClick={() => onAddRole(newRole, null)}>
                <Plus aria-hidden="true" /> Adicionar papel
              </button>
            </div>
          ) : null}
        </div>

        <div>
          <h3 className="pv-block-title">Exceções</h3>
          <p className="pv-note pv-left">
            Libera ou bloqueia uma área só para esta pessoa, sem mudar o papel. Ex.: um fiscal que também lança pagamentos numa etapa.
          </p>
          {exceptions.length ? (
            <ul className="pv-grant-list">
              {exceptions.map((exception) => (
                <li key={exception.id}>
                  <span className="pv-stack">
                    <b>
                      {exception.allowed ? "Libera" : "Bloqueia"} {exception.action === "read" ? "ver" : "ver e editar"}
                    </b>
                    <small>
                      {moduleLabel.get(exception.module) ?? exception.module}
                      {exception.expiresAt ? ` · até ${dateLabel(exception.expiresAt)}` : ""}
                    </small>
                  </span>
                  <button type="button" className="icon-button danger" disabled={busy} onClick={() => onRemoveException(exception)} aria-label="Remover exceção">
                    <Trash2 aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="pv-muted pv-small-text">Nenhuma exceção. Vale só o que o papel permite.</p>
          )}
          {baseGrant ? (
            <form
              className="pv-exception-form"
              onSubmit={(event) => {
                event.preventDefault();
                onAddException({
                  user_role_id: baseGrant.id,
                  module: exceptionModule,
                  action: exceptionAction,
                  allowed: exceptionAllowed,
                  expires_at: exceptionUntil ? new Date(`${exceptionUntil}T23:59:59-03:00`).toISOString() : null,
                });
              }}
            >
              <select value={exceptionAllowed ? "allow" : "deny"} onChange={(event) => setExceptionAllowed(event.target.value === "allow")} aria-label="Liberar ou bloquear">
                <option value="allow">Liberar</option>
                <option value="deny">Bloquear</option>
              </select>
              <select value={exceptionAction} onChange={(event) => setExceptionAction(event.target.value as "read" | "manage")} aria-label="Nível">
                <option value="manage">ver e editar</option>
                <option value="read">só ver</option>
              </select>
              <select value={exceptionModule} onChange={(event) => setExceptionModule(event.target.value)} aria-label="Área">
                {panelSections
                  .filter((section) => section.key !== "inicio")
                  .map((section) => (
                    <optgroup key={section.key} label={section.label}>
                      {section.tabs.map((tab) => (
                        <option key={tab.module} value={tab.module}>
                          {tab.label}
                        </option>
                      ))}
                    </optgroup>
                  ))}
              </select>
              <input type="date" value={exceptionUntil} onChange={(event) => setExceptionUntil(event.target.value)} aria-label="Válida até (opcional)" />
              <button type="submit" className="button-secondary" disabled={busy}>
                Salvar exceção
              </button>
            </form>
          ) : null}
        </div>
      </div>
    </section>
  );
}
