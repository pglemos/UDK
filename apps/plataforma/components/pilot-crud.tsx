"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  Camera,
  Check,
  Image as ImageIcon,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  UserRound,
  X,
} from "lucide-react";

type PilotRecord = Record<string, unknown> & { id: string };
type SeasonOption = { id: string; name: string };
type CategoryOption = { id: string; name: string; season_id: string };
type PilotForm = Record<string, string | boolean>;

const STATE_OPTIONS = [
  ["AC", "Acre"],
  ["AL", "Alagoas"],
  ["AP", "Amapá"],
  ["AM", "Amazonas"],
  ["BA", "Bahia"],
  ["CE", "Ceará"],
  ["DF", "Distrito Federal"],
  ["ES", "Espírito Santo"],
  ["GO", "Goiás"],
  ["MA", "Maranhão"],
  ["MT", "Mato Grosso"],
  ["MS", "Mato Grosso do Sul"],
  ["MG", "Minas Gerais"],
  ["PA", "Pará"],
  ["PB", "Paraíba"],
  ["PR", "Paraná"],
  ["PE", "Pernambuco"],
  ["PI", "Piauí"],
  ["RJ", "Rio de Janeiro"],
  ["RN", "Rio Grande do Norte"],
  ["RS", "Rio Grande do Sul"],
  ["RO", "Rondônia"],
  ["RR", "Roraima"],
  ["SC", "Santa Catarina"],
  ["SP", "São Paulo"],
  ["SE", "Sergipe"],
  ["TO", "Tocantins"],
] as const;

const GENDER_OPTIONS = [
  ["feminino", "Feminino"],
  ["masculino", "Masculino"],
  ["nao_binario", "Não binário"],
  ["nao_informar", "Prefiro não informar"],
] as const;

const STATUS_OPTIONS = [
  ["pending", "Pendente"],
  ["approved", "Aprovado"],
  ["suspended", "Suspenso"],
  ["archived", "Arquivado"],
] as const;

const ACKNOWLEDGEMENTS = [
  [
    "contact_authorized",
    "Autorizo a organização a entrar em contato por WhatsApp ou e-mail para confirmação de vaga, bateria, briefing e orientações do campeonato.",
  ],
  ["regulation_acknowledged", "Li ou vou ler o regulamento oficial antes da primeira bateria."],
  [
    "participation_acknowledged",
    "Estou ciente de que a participação depende de aceite da organização, vaga disponível, briefing e termo de responsabilidade no kartódromo.",
  ],
  [
    "image_authorized",
    "Autorizo o uso de imagem em fotos, vídeos, ranking e materiais da competição UDK.",
  ],
] as const;

function emptyForm(): PilotForm {
  return {
    season_id: "",
    category_id: "",
    full_name: "",
    whatsapp: "",
    cpf: "",
    birth_date: "",
    age: "",
    email: "",
    city: "",
    state: "",
    weight_kg: "",
    height_cm: "",
    gender: "",
    avatar_url: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    medical_restrictions: "",
    allergies: "",
    medications: "",
    operational_notes: "",
    status: "pending",
    public_profile: true,
    contact_authorized: false,
    regulation_acknowledged: false,
    participation_acknowledged: false,
    image_authorized: false,
  };
}

function text(record: PilotRecord | undefined, key: string): string {
  const value = record?.[key];
  return value === null || value === undefined ? "" : String(value);
}

function boolean(record: PilotRecord | undefined, key: string, fallback = false): boolean {
  const value = record?.[key];
  return typeof value === "boolean" ? value : fallback;
}

function editForm(record: PilotRecord): PilotForm {
  const form = emptyForm();
  for (const key of Object.keys(form)) {
    form[key] = typeof form[key] === "boolean" ? boolean(record, key) : text(record, key);
  }
  form.public_profile = boolean(record, "public_profile", true);
  return form;
}

function slugify(value: string): string {
  return (
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "piloto"
  );
}

function numberOrNull(value: string | boolean | undefined): number | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function initials(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function statusLabel(value: unknown): string {
  return STATUS_OPTIONS.find(([code]) => code === String(value))?.[1] ?? "Pendente";
}

function statusClass(value: unknown): string {
  if (value === "approved") return "status-badge status-success";
  if (value === "suspended" || value === "archived") return "status-badge status-danger";
  return "status-badge status-warning";
}

function genderLabel(value: unknown): string {
  return GENDER_OPTIONS.find(([code]) => code === String(value))?.[1] ?? "Não informado";
}

function storagePathFromUrl(value: string): string | null {
  const marker = "/storage/v1/object/public/public-media/";
  const index = value.indexOf(marker);
  if (index < 0) return null;
  return decodeURIComponent(value.slice(index + marker.length));
}

function errorMessage(error: unknown): string {
  const item = error as { code?: string; message?: string; details?: string } | undefined;
  if (item?.code === "23505")
    return "Já existe um piloto com esse cadastro nesta temporada. Confira o nome e tente novamente.";
  if (item?.code === "23503") return "A temporada ou categoria selecionada não é válida.";
  if (item?.code === "23502") return "Preencha todos os campos obrigatórios antes de salvar.";
  if (item?.code === "23514") return "Um dos dados informados está fora das opções aceitas.";
  if (item?.code === "22P02") return "Confira o formato dos números e da data informados.";
  if (item?.code === "42501") return "Seu papel não permite alterar o cadastro de pilotos.";
  return "Não foi possível concluir a operação. Tente novamente ou atualize a página.";
}

function validate(form: PilotForm): string {
  const name = String(form.full_name).trim();
  if (name.split(/\s+/).length < 2) return "Informe o nome completo e o sobrenome do piloto.";
  if (!String(form.season_id)) return "Selecione a temporada do piloto.";
  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(form.email)))
    return "Informe um e-mail válido.";
  const age = numberOrNull(form.age);
  if (age !== null && (age < 5 || age > 120)) return "A idade deve estar entre 5 e 120 anos.";
  const weight = numberOrNull(form.weight_kg);
  if (weight !== null && (weight < 20 || weight > 300))
    return "O peso deve estar entre 20 e 300 kg.";
  const height = numberOrNull(form.height_cm);
  if (height !== null && (height < 80 || height > 250))
    return "A altura deve estar entre 80 e 250 cm.";
  const missingAcknowledgement = ACKNOWLEDGEMENTS.find(([key]) => !form[key]);
  if (missingAcknowledgement) return "Leia e confirme todos os itens obrigatórios antes de salvar.";
  return "";
}

export function PilotCrud({
  client,
  readOnly = false,
}: {
  client: SupabaseClient;
  readOnly?: boolean;
}) {
  const [records, setRecords] = useState<PilotRecord[]>([]);
  const [seasons, setSeasons] = useState<SeasonOption[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [values, setValues] = useState<PilotForm>(emptyForm);
  const [editing, setEditing] = useState<PilotRecord>();
  const [photoFile, setPhotoFile] = useState<File>();
  const [photoPreview, setPhotoPreview] = useState<string>();
  const [removePhoto, setRemovePhoto] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const editorRef = useRef<HTMLElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const savingRef = useRef(false);

  const loadRecords = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [driversResult, seasonsResult, categoriesResult] = await Promise.all([
        client
          .from("drivers")
          .select("*")
          .is("deleted_at", null)
          .order("full_name", { ascending: true })
          .limit(1000),
        client
          .from("seasons")
          .select("id,name")
          .is("deleted_at", null)
          .order("year", { ascending: false }),
        client
          .from("categories")
          .select("id,name,season_id")
          .is("deleted_at", null)
          .order("name", { ascending: true }),
      ]);
      if (driversResult.error || seasonsResult.error || categoriesResult.error) {
        setError(
          errorMessage(driversResult.error ?? seasonsResult.error ?? categoriesResult.error),
        );
      } else {
        setRecords((driversResult.data ?? []) as PilotRecord[]);
        setSeasons((seasonsResult.data ?? []) as SeasonOption[]);
        setCategories((categoriesResult.data ?? []) as CategoryOption[]);
      }
    } catch (loadError) {
      setError(errorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    void loadRecords();
  }, [loadRecords]);

  useEffect(() => {
    savingRef.current = saving;
  }, [saving]);

  useEffect(() => {
    if (!editorOpen) return;
    previousFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const frame = window.requestAnimationFrame(() => {
      const editor = editorRef.current;
      if (!editor) return;
      editor.scrollIntoView({ behavior: "smooth", block: "start" });
      editor.focus({ preventScroll: true });
    });

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !savingRef.current) {
        event.preventDefault();
        setEditorOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", handleKeyDown);
      previousFocusRef.current?.focus();
      previousFocusRef.current = null;
    };
  }, [editorOpen]);

  useEffect(() => {
    if (!photoFile) {
      setPhotoPreview(String(values.avatar_url || "") || undefined);
      return;
    }
    const url = URL.createObjectURL(photoFile);
    setPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photoFile, values.avatar_url]);

  const visibleRecords = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return records;
    return records.filter((record) =>
      [
        "full_name",
        "email",
        "whatsapp",
        "cpf",
        "city",
        "state",
        "medical_restrictions",
        "operational_notes",
      ]
        .map((key) => text(record, key).toLowerCase())
        .some((value) => value.includes(term)),
    );
  }, [records, search]);

  const selectedCategories = useMemo(
    () => categories.filter((category) => category.season_id === String(values.season_id)),
    [categories, values.season_id],
  );

  function update(key: string, value: string | boolean) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function openCreate() {
    if (readOnly) return;
    setEditing(undefined);
    setValues(emptyForm());
    setPhotoFile(undefined);
    setPhotoPreview(undefined);
    setRemovePhoto(false);
    setError("");
    setEditorOpen(true);
  }

  function openEdit(record: PilotRecord) {
    setEditing(record);
    setValues(editForm(record));
    setPhotoFile(undefined);
    setPhotoPreview(text(record, "avatar_url") || undefined);
    setRemovePhoto(false);
    setError("");
    setEditorOpen(true);
  }

  function closeEditor() {
    if (!saving) setEditorOpen(false);
  }

  function selectPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("A foto precisa estar em JPG, PNG ou WEBP.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError("A foto deve ter no máximo 8 MB.");
      return;
    }
    setError("");
    setPhotoFile(file);
    setRemovePhoto(false);
  }

  async function uploadPhoto(file: File, seasonId: string): Promise<{ path: string; url: string }> {
    const { data, error: userError } = await client.auth.getUser();
    if (userError || !data.user) throw userError ?? new Error("Usuário não autenticado.");
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `season/${seasonId}/${data.user.id}/pilotos/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await client.storage.from("public-media").upload(path, file, {
      cacheControl: "31536000",
      contentType: file.type,
      upsert: false,
    });
    if (uploadError) throw uploadError;
    const { data: publicData } = client.storage.from("public-media").getPublicUrl(path);
    return { path, url: publicData.publicUrl };
  }

  async function removeUploadedPhoto(path: string | null) {
    if (!path) return;
    await client.storage.from("public-media").remove([path]);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (readOnly) return;
    const validationError = validate(values);
    if (validationError) {
      setError(validationError);
      return;
    }
    setSaving(true);
    setError("");
    setNotice("");
    let uploadedPath: string | null = null;
    const previousPhoto = text(editing, "avatar_url");
    try {
      const fullName = String(values.full_name).trim();
      let avatarUrl = String(values.avatar_url || "") || null;
      if (photoFile) {
        const uploaded = await uploadPhoto(photoFile, String(values.season_id));
        uploadedPath = uploaded.path;
        avatarUrl = uploaded.url;
      } else if (removePhoto) {
        avatarUrl = null;
      }

      const payload = {
        season_id: String(values.season_id),
        category_id: String(values.category_id || "") || null,
        full_name: fullName,
        sport_name: editing ? text(editing, "sport_name") || fullName : fullName,
        slug: editing ? text(editing, "slug") || slugify(fullName) : slugify(fullName),
        number: null,
        status: String(values.status || "pending"),
        public_profile: Boolean(values.public_profile),
        avatar_url: avatarUrl,
        whatsapp: String(values.whatsapp || "").trim() || null,
        cpf: String(values.cpf || "").trim() || null,
        birth_date: String(values.birth_date || "") || null,
        age: numberOrNull(values.age),
        email: String(values.email || "").trim() || null,
        city: String(values.city || "").trim() || null,
        state: String(values.state || "") || null,
        weight_kg: numberOrNull(values.weight_kg),
        height_cm: numberOrNull(values.height_cm),
        gender: String(values.gender || "") || null,
        emergency_contact_name: String(values.emergency_contact_name || "").trim() || null,
        emergency_contact_phone: String(values.emergency_contact_phone || "").trim() || null,
        medical_restrictions: String(values.medical_restrictions || "").trim() || null,
        allergies: String(values.allergies || "").trim() || null,
        medications: String(values.medications || "").trim() || null,
        operational_notes: String(values.operational_notes || "").trim() || null,
        contact_authorized: Boolean(values.contact_authorized),
        regulation_acknowledged: Boolean(values.regulation_acknowledged),
        participation_acknowledged: Boolean(values.participation_acknowledged),
        image_authorized: Boolean(values.image_authorized),
      };

      const mutation = editing
        ? await client.from("drivers").update(payload).eq("id", editing.id)
        : await client.from("drivers").insert(payload);
      if (mutation.error) throw mutation.error;

      if (previousPhoto && (photoFile || removePhoto)) {
        await removeUploadedPhoto(storagePathFromUrl(previousPhoto));
      }
      setNotice(`Piloto ${editing ? "atualizado" : "cadastrado"} com sucesso.`);
      setEditorOpen(false);
      await loadRecords();
    } catch (saveError) {
      await removeUploadedPhoto(uploadedPath);
      setError(errorMessage(saveError));
    } finally {
      setSaving(false);
    }
  }

  async function archive(record: PilotRecord) {
    if (readOnly) return;
    if (!window.confirm(`Arquivar o cadastro de ${text(record, "full_name") || "piloto"}?`)) return;
    setSaving(true);
    setError("");
    const { error: archiveError } = await client
      .from("drivers")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", record.id);
    if (archiveError) setError(errorMessage(archiveError));
    else {
      setNotice("Cadastro arquivado com sucesso.");
      await loadRecords();
    }
    setSaving(false);
  }

  return (
    <section className="module-workspace pilot-workspace">
      <div className="module-toolbar">
        <div className="search-box">
          <Search size={18} />
          <input
            aria-label="Buscar pilotos"
            placeholder="Buscar por nome, cidade, CPF ou WhatsApp"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <button
          className="button-secondary"
          type="button"
          onClick={() => void loadRecords()}
          disabled={loading}
        >
          <RefreshCw size={17} className={loading ? "spin" : ""} /> Atualizar
        </button>
        {!readOnly ? (
          <button className="button-primary" type="button" onClick={openCreate}>
            <Plus size={18} /> Novo piloto
          </button>
        ) : null}
      </div>

      {error ? (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      ) : null}
      {notice ? (
        <div className="alert alert-success" role="status">
          {notice}
        </div>
      ) : null}

      <div className="data-card">
        <div className="data-card-head">
          <div>
            <strong>{visibleRecords.length}</strong>
            <span>piloto(s)</span>
          </div>
          <small>Kart definido por sorteio na sessão. O cadastro não usa número de piloto.</small>
        </div>
        {loading ? (
          <div className="empty-state">
            <LoaderCircle className="spin" />
            <p>Carregando pilotos...</p>
          </div>
        ) : visibleRecords.length === 0 ? (
          <div className="empty-state">
            <UserRound />
            <h3>Nenhum piloto encontrado</h3>
            <p>
              {readOnly
                ? "Os pilotos disponíveis aparecerão aqui."
                : "Altere a busca ou cadastre o primeiro piloto."}
            </p>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="admin-table pilot-table">
              <thead>
                <tr>
                  <th>Foto</th>
                  <th>Piloto</th>
                  <th>Contato</th>
                  <th>Cidade/UF</th>
                  <th>Dados físicos</th>
                  <th>Situação</th>
                  {!readOnly ? <th className="actions-column">Ações</th> : null}
                </tr>
              </thead>
              <tbody>
                {visibleRecords.map((record) => {
                  const name = text(record, "full_name") || "Piloto sem nome";
                  const cityState =
                    [text(record, "city"), text(record, "state")].filter(Boolean).join("/") || "—";
                  const physical =
                    [
                      record.weight_kg ? `${record.weight_kg} kg` : "",
                      record.height_cm ? `${record.height_cm} cm` : "",
                      record.gender ? genderLabel(record.gender) : "",
                    ]
                      .filter(Boolean)
                      .join(" · ") || "—";
                  return (
                    <tr key={record.id}>
                      <td>
                        <div className="pilot-table-photo">
                          {text(record, "avatar_url") ? (
                            <img src={text(record, "avatar_url")} alt={`Foto de ${name}`} />
                          ) : (
                            <span>{initials(name) || <UserRound size={17} />}</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <strong className="pilot-table-name">{name}</strong>
                        <small>{text(record, "email") || "E-mail não informado"}</small>
                      </td>
                      <td>{text(record, "whatsapp") || "—"}</td>
                      <td>{cityState}</td>
                      <td>{physical}</td>
                      <td>
                        <span className={statusClass(record.status)}>
                          {statusLabel(record.status)}
                        </span>
                      </td>
                      {!readOnly ? (
                        <td className="row-actions">
                          <button
                            type="button"
                            className="icon-button"
                            title="Editar piloto"
                            aria-label={`Editar ${name}`}
                            onClick={() => openEdit(record)}
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            type="button"
                            className="icon-button danger"
                            title="Arquivar piloto"
                            aria-label={`Arquivar ${name}`}
                            onClick={() => void archive(record)}
                            disabled={saving}
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      ) : null}
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="pilot-mobile-list" aria-label="Lista de pilotos">
              {visibleRecords.map((record) => {
                const name = text(record, "full_name") || "Piloto sem nome";
                const cityState =
                  [text(record, "city"), text(record, "state")].filter(Boolean).join("/") || "—";
                const physical =
                  [
                    record.weight_kg ? `${record.weight_kg} kg` : "",
                    record.height_cm ? `${record.height_cm} cm` : "",
                    record.gender ? genderLabel(record.gender) : "",
                  ]
                    .filter(Boolean)
                    .join(" · ") || "—";
                return (
                  <article className="pilot-mobile-card" key={record.id}>
                    <div className="pilot-mobile-card-head">
                      <div className="pilot-table-photo">
                        {text(record, "avatar_url") ? (
                          <img src={text(record, "avatar_url")} alt={`Foto de ${name}`} />
                        ) : (
                          <span>{initials(name) || <UserRound size={17} />}</span>
                        )}
                      </div>
                      <div className="pilot-mobile-card-identity">
                        <strong>{name}</strong>
                        <small>{text(record, "email") || "E-mail não informado"}</small>
                      </div>
                      <span className={statusClass(record.status)}>
                        {statusLabel(record.status)}
                      </span>
                    </div>
                    <dl className="pilot-mobile-card-details">
                      <div>
                        <dt>WhatsApp</dt>
                        <dd>{text(record, "whatsapp") || "Não informado"}</dd>
                      </div>
                      <div>
                        <dt>Cidade/UF</dt>
                        <dd>{cityState}</dd>
                      </div>
                      <div>
                        <dt>Dados físicos</dt>
                        <dd>{physical}</dd>
                      </div>
                    </dl>
                    {!readOnly ? (
                      <div className="pilot-mobile-card-actions">
                        <button
                          type="button"
                          className="button-secondary"
                          onClick={() => openEdit(record)}
                        >
                          <Pencil size={16} /> Editar cadastro
                        </button>
                        <button
                          type="button"
                          className="button-secondary danger-action"
                          onClick={() => void archive(record)}
                          disabled={saving}
                        >
                          <Trash2 size={16} /> Arquivar
                        </button>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {editorOpen ? (
        <section
          ref={editorRef}
          className="pilot-editor"
          aria-labelledby="pilot-editor-title"
          tabIndex={-1}
        >
          <div className="pilot-editor-head">
            <div>
              <small>{editing ? "Editar cadastro" : "Novo cadastro"}</small>
              <h2 id="pilot-editor-title">Dados do piloto</h2>
              <p>
                Preencha o perfil operacional do piloto. O kart é definido por sorteio em cada
                sessão.
              </p>
            </div>
            <button
              className="icon-button"
              type="button"
              aria-label="Fechar cadastro"
              onClick={closeEditor}
              disabled={saving}
            >
              <X />
            </button>
          </div>
          <form onSubmit={(event) => void save(event)}>
            <div className="pilot-form-intro">
              <ShieldCheck size={20} />
              <p>
                Cadastro oficial para organização das baterias, comunicação, lastro e segurança. O
                kart será sorteado por sessão.
              </p>
            </div>

            <section className="pilot-form-section">
              <div className="pilot-section-heading">
                <span>01</span>
                <div>
                  <h3>Identificação e foto</h3>
                  <p>Dados usados para localizar e reconhecer o piloto.</p>
                </div>
              </div>
              <div className="pilot-photo-field">
                <div className="pilot-photo-preview">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Prévia da foto do piloto" />
                  ) : (
                    <>
                      <Camera size={28} />
                      <span>Sem foto cadastrada</span>
                    </>
                  )}
                </div>
                <div>
                  <label
                    className="button-secondary pilot-photo-button"
                    htmlFor="pilot-photo-input"
                  >
                    <ImageIcon size={17} /> {photoPreview ? "Trocar foto" : "Inserir foto"}
                  </label>
                  <input
                    id="pilot-photo-input"
                    className="sr-only"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={selectPhoto}
                    disabled={saving}
                  />
                  <p className="field-hint">JPG, PNG ou WEBP · até 8 MB.</p>
                  {photoPreview ? (
                    <button
                      className="pilot-remove-photo"
                      type="button"
                      onClick={() => {
                        setPhotoFile(undefined);
                        update("avatar_url", "");
                        setRemovePhoto(true);
                      }}
                      disabled={saving}
                    >
                      Remover foto
                    </button>
                  ) : null}
                </div>
              </div>
            </section>

            <section className="pilot-form-section">
              <div className="pilot-section-heading">
                <span>02</span>
                <div>
                  <h3>Dados do piloto</h3>
                  <p>Informações pessoais e de contato.</p>
                </div>
              </div>
              <div className="form-grid pilot-grid">
                <label>
                  <span>
                    Temporada <b>*</b>
                  </span>
                  <select
                    required
                    value={String(values.season_id)}
                    onChange={(event) => {
                      update("season_id", event.target.value);
                      update("category_id", "");
                    }}
                    disabled={saving}
                  >
                    <option value="">Selecione a temporada</option>
                    {seasons.map((season) => (
                      <option value={season.id} key={season.id}>
                        {season.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Categoria</span>
                  <select
                    value={String(values.category_id)}
                    onChange={(event) => update("category_id", event.target.value)}
                    disabled={saving || !values.season_id}
                  >
                    <option value="">Sem categoria definida</option>
                    {selectedCategories.map((category) => (
                      <option value={category.id} key={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="form-wide">
                  <span>
                    Nome completo <b>*</b>
                  </span>
                  <input
                    required
                    placeholder="Nome e sobrenome"
                    value={String(values.full_name)}
                    onChange={(event) => update("full_name", event.target.value)}
                    disabled={saving}
                  />
                </label>
                <label>
                  <span>WhatsApp</span>
                  <input
                    type="tel"
                    placeholder="(21) 99999-9999"
                    value={String(values.whatsapp)}
                    onChange={(event) => update("whatsapp", event.target.value)}
                    disabled={saving}
                  />
                </label>
                <label>
                  <span>CPF</span>
                  <input
                    inputMode="numeric"
                    placeholder="000.000.000-00"
                    value={String(values.cpf)}
                    onChange={(event) => update("cpf", event.target.value)}
                    disabled={saving}
                  />
                </label>
                <label>
                  <span>Data de nascimento</span>
                  <input
                    type="date"
                    value={String(values.birth_date)}
                    onChange={(event) => update("birth_date", event.target.value)}
                    disabled={saving}
                  />
                </label>
                <label>
                  <span>Idade</span>
                  <input
                    type="number"
                    min="5"
                    max="120"
                    placeholder="Ex.: 34"
                    value={String(values.age)}
                    onChange={(event) => update("age", event.target.value)}
                    disabled={saving}
                  />
                </label>
                <label>
                  <span>E-mail</span>
                  <input
                    type="email"
                    placeholder="piloto@email.com"
                    value={String(values.email)}
                    onChange={(event) => update("email", event.target.value)}
                    disabled={saving}
                  />
                </label>
                <label>
                  <span>Cidade</span>
                  <input
                    placeholder="Belo Horizonte"
                    value={String(values.city)}
                    onChange={(event) => update("city", event.target.value)}
                    disabled={saving}
                  />
                </label>
                <label>
                  <span>Estado (UF)</span>
                  <select
                    value={String(values.state)}
                    onChange={(event) => update("state", event.target.value)}
                    disabled={saving}
                  >
                    <option value="">Selecione o estado</option>
                    {STATE_OPTIONS.map(([code, name]) => (
                      <option value={code} key={code}>
                        {code} — {name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </section>

            <section className="pilot-form-section">
              <div className="pilot-section-heading">
                <span>03</span>
                <div>
                  <h3>Dados físicos</h3>
                  <p>Informações para orientar lastro e organização das baterias.</p>
                </div>
              </div>
              <div className="form-grid pilot-grid">
                <label>
                  <span>Peso aproximado com equipamento (kg)</span>
                  <input
                    type="number"
                    min="20"
                    max="300"
                    step="0.1"
                    placeholder="Ex.: 92"
                    value={String(values.weight_kg)}
                    onChange={(event) => update("weight_kg", event.target.value)}
                    disabled={saving}
                  />
                  <small className="field-hint">
                    Informe o peso em kg para orientar lastro e organização das baterias.
                  </small>
                </label>
                <label>
                  <span>Altura (cm)</span>
                  <input
                    type="number"
                    min="80"
                    max="250"
                    placeholder="Ex.: 178"
                    value={String(values.height_cm)}
                    onChange={(event) => update("height_cm", event.target.value)}
                    disabled={saving}
                  />
                </label>
                <label>
                  <span>Sexo</span>
                  <select
                    value={String(values.gender)}
                    onChange={(event) => update("gender", event.target.value)}
                    disabled={saving}
                  >
                    <option value="">Selecione</option>
                    {GENDER_OPTIONS.map(([code, label]) => (
                      <option value={code} key={code}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </section>

            <section className="pilot-form-section">
              <div className="pilot-section-heading">
                <span>04</span>
                <div>
                  <h3>Segurança e saúde</h3>
                  <p>Dados restritos à operação do campeonato e ao atendimento necessário.</p>
                </div>
              </div>
              <div className="form-grid pilot-grid">
                <label>
                  <span>Contato de emergência</span>
                  <input
                    placeholder="Nome completo"
                    value={String(values.emergency_contact_name)}
                    onChange={(event) => update("emergency_contact_name", event.target.value)}
                    disabled={saving}
                  />
                </label>
                <label>
                  <span>Telefone de emergência</span>
                  <input
                    type="tel"
                    placeholder="(21) 99999-9999"
                    value={String(values.emergency_contact_phone)}
                    onChange={(event) => update("emergency_contact_phone", event.target.value)}
                    disabled={saving}
                  />
                </label>
                <label>
                  <span>Restrições médicas</span>
                  <textarea
                    placeholder="Ex.: nenhuma, lesão, restrição física."
                    rows={3}
                    value={String(values.medical_restrictions)}
                    onChange={(event) => update("medical_restrictions", event.target.value)}
                    disabled={saving}
                  />
                </label>
                <label>
                  <span>Alergias</span>
                  <textarea
                    placeholder="Ex.: nenhuma, medicamento, alimento."
                    rows={3}
                    value={String(values.allergies)}
                    onChange={(event) => update("allergies", event.target.value)}
                    disabled={saving}
                  />
                </label>
                <label>
                  <span>Medicamentos</span>
                  <textarea
                    placeholder="Uso contínuo ou eventual."
                    rows={3}
                    value={String(values.medications)}
                    onChange={(event) => update("medications", event.target.value)}
                    disabled={saving}
                  />
                </label>
                <label>
                  <span>Observações operacionais</span>
                  <textarea
                    placeholder="Ex.: necessidade de orientação especial, restrição de agenda, observação para briefing ou nenhuma."
                    rows={3}
                    value={String(values.operational_notes)}
                    onChange={(event) => update("operational_notes", event.target.value)}
                    disabled={saving}
                  />
                </label>
              </div>
            </section>

            <section className="pilot-form-section">
              <div className="pilot-section-heading">
                <span>05</span>
                <div>
                  <h3>Confirmações obrigatórias</h3>
                  <p>O cadastro só pode ser salvo depois que todos os itens forem confirmados.</p>
                </div>
              </div>
              <div className="pilot-acknowledgements">
                {ACKNOWLEDGEMENTS.map(([key, label]) => (
                  <label className="pilot-acknowledgement" key={key}>
                    <input
                      type="checkbox"
                      checked={Boolean(values[key])}
                      onChange={(event) => update(key, event.target.checked)}
                      disabled={saving}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </section>

            <section className="pilot-form-section">
              <div className="pilot-section-heading">
                <span>06</span>
                <div>
                  <h3>Publicação e situação</h3>
                  <p>Controle interno do cadastro e da exibição pública.</p>
                </div>
              </div>
              <div className="form-grid pilot-grid">
                <label>
                  <span>Situação</span>
                  <select
                    value={String(values.status)}
                    onChange={(event) => update("status", event.target.value)}
                    disabled={saving}
                  >
                    {STATUS_OPTIONS.map(([code, label]) => (
                      <option value={code} key={code}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="checkbox-field pilot-public-toggle">
                  <input
                    type="checkbox"
                    checked={Boolean(values.public_profile)}
                    onChange={(event) => update("public_profile", event.target.checked)}
                    disabled={saving}
                  />{" "}
                  Exibir perfil público
                </label>
              </div>
            </section>

            {error ? (
              <div className="alert alert-error" role="alert">
                {error}
              </div>
            ) : null}
            <div className="modal-actions">
              <button
                className="button-secondary"
                type="button"
                onClick={closeEditor}
                disabled={saving}
              >
                Cancelar
              </button>
              <button className="button-primary" type="submit" disabled={saving}>
                {saving ? <LoaderCircle className="spin" size={17} /> : <Check size={17} />} Salvar
                piloto
              </button>
            </div>
          </form>
        </section>
      ) : null}
    </section>
  );
}
