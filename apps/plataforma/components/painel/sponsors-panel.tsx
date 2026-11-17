"use client";

import { confirmAction } from "../../lib/confirm-action";
import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent, type FormEvent } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ExternalLink, ImagePlus, Pencil, Plus, RefreshCw, Trash2, Upload, X } from "lucide-react";
import { PanelState, errorMessage } from "./shared";

type Sponsor = {
  id: string;
  championshipId: string;
  name: string;
  slug: string;
  logoUrl: string;
  websiteUrl: string;
  tier: string;
  status: string;
};

type Draft = Omit<Sponsor, "id" | "championshipId"> & { id: string | null };

const ACCEPTED = ["image/svg+xml", "image/png", "image/webp", "image/jpeg"];
const MAX_BYTES = 10 * 1024 * 1024;
const TIERS = ["Patrocinador oficial", "Patrocinador master", "Apoio", "Parceiro"];

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function emptyDraft(): Draft {
  return { id: null, name: "", slug: "", logoUrl: "", websiteUrl: "", tier: TIERS[0]!, status: "active" };
}

function linkLabel(url: string): string {
  if (!url) return "Sem link";
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("instagram.com")) return `@${parsed.pathname.replace(/\//g, "")}`;
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function SponsorsPanel({ client, readOnly }: { client: SupabaseClient; readOnly: boolean }) {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [championshipId, setChampionshipId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [dragging, setDragging] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [sponsorResult, championshipResult] = await Promise.all([
        client
          .from("sponsors")
          .select("id,championship_id,name,slug,logo_url,website_url,tier,status")
          .is("deleted_at", null)
          .order("name"),
        client.from("championships").select("id").eq("slug", "udk").is("deleted_at", null).maybeSingle(),
      ]);
      if (sponsorResult.error) throw sponsorResult.error;
      setSponsors(
        (sponsorResult.data ?? []).map((row) => ({
          id: String(row.id),
          championshipId: String(row.championship_id),
          name: String(row.name ?? ""),
          slug: String(row.slug ?? ""),
          logoUrl: String(row.logo_url ?? ""),
          websiteUrl: String(row.website_url ?? ""),
          tier: String(row.tier ?? ""),
          status: String(row.status ?? "active"),
        })),
      );
      setChampionshipId(String(championshipResult.data?.id ?? sponsorResult.data?.[0]?.championship_id ?? ""));
    } catch (loadError) {
      setError(errorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    void load();
  }, [load]);

  // a prévia de um arquivo local vive só enquanto o editor estiver aberto
  useEffect(() => {
    if (!file) {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const active = useMemo(() => sponsors.filter((sponsor) => sponsor.status === "active"), [sponsors]);
  const inactive = useMemo(() => sponsors.filter((sponsor) => sponsor.status !== "active"), [sponsors]);

  function openEditor(sponsor?: Sponsor) {
    setNotice("");
    setError("");
    setFile(null);
    setDraft(sponsor ? { ...sponsor } : emptyDraft());
    requestAnimationFrame(() => editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  function closeEditor() {
    if (saving) return;
    setDraft(null);
    setFile(null);
  }

  function pickFile(candidate: File | undefined) {
    if (!candidate) return;
    if (!ACCEPTED.includes(candidate.type)) {
      setError("A logo precisa ser SVG, PNG, WEBP ou JPG.");
      return;
    }
    if (candidate.size > MAX_BYTES) {
      setError("A logo deve ter no máximo 10 MB.");
      return;
    }
    setError("");
    setFile(candidate);
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    pickFile(event.dataTransfer.files?.[0]);
  }

  async function uploadLogo(slug: string): Promise<{ path: string; url: string } | null> {
    if (!file) return null;
    const { data, error: userError } = await client.auth.getUser();
    if (userError || !data.user) throw userError ?? new Error("Sessão expirada. Entre de novo.");
    const extension = file.name.split(".").pop()?.toLowerCase() || "png";
    const path = `championship/${championshipId}/${data.user.id}/patrocinadores/${slug}-${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await client.storage.from("public-media").upload(path, file, {
      cacheControl: "31536000",
      contentType: file.type,
      upsert: false,
    });
    if (uploadError) throw uploadError;
    const { data: publicData } = client.storage.from("public-media").getPublicUrl(path);
    return { path, url: publicData.publicUrl };
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft) return;
    const name = draft.name.trim();
    if (!name) {
      setError("Informe o nome do patrocinador.");
      return;
    }
    if (!championshipId) {
      setError("Campeonato não encontrado. Atualize a página.");
      return;
    }
    const slug = draft.slug.trim() || slugify(name);
    let website = draft.websiteUrl.trim();
    if (website && !/^https?:\/\//i.test(website)) website = `https://${website}`;
    setSaving(true);
    setError("");
    let uploaded: { path: string; url: string } | null = null;
    try {
      uploaded = await uploadLogo(slug);
      const payload = {
        championship_id: championshipId,
        name,
        slug,
        logo_url: uploaded?.url ?? (draft.logoUrl || null),
        website_url: website || null,
        tier: draft.tier.trim() || TIERS[0],
        status: draft.status,
      };
      const query = draft.id
        ? client.from("sponsors").update(payload).eq("id", draft.id)
        : client.from("sponsors").insert(payload);
      const { error: saveError } = await query;
      if (saveError) throw saveError;
      setNotice(draft.id ? `${name} atualizado.` : `${name} adicionado.`);
      setDraft(null);
      setFile(null);
      await load();
    } catch (saveError) {
      if (uploaded) await client.storage.from("public-media").remove([uploaded.path]);
      setError(errorMessage(saveError));
    } finally {
      setSaving(false);
    }
  }

  async function remove(sponsor: Sponsor) {
    if (!(await confirmAction(`Remover ${sponsor.name} dos patrocinadores? Ele sai do site na hora.`, "Remover"))) return;
    setError("");
    const { error: removeError } = await client
      .from("sponsors")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", sponsor.id);
    if (removeError) {
      setError(errorMessage(removeError));
      return;
    }
    setNotice(`${sponsor.name} removido.`);
    if (draft?.id === sponsor.id) setDraft(null);
    await load();
  }

  const shownLogo = preview || draft?.logoUrl || "";

  function card(sponsor: Sponsor) {
    return (
      <li key={sponsor.id} className={`pv-sponsor${sponsor.status === "active" ? "" : " is-off"}`}>
        <div className="pv-sponsor-mark">
          {sponsor.logoUrl ? (
            <img src={sponsor.logoUrl} alt={`Logo ${sponsor.name}`} decoding="async" />
          ) : (
            <span className="pv-sponsor-missing">
              <ImagePlus aria-hidden="true" />
              Sem logo
            </span>
          )}
        </div>
        <div className="pv-sponsor-body">
          <h3>{sponsor.name}</h3>
          <p>
            {sponsor.tier}
            {sponsor.status === "active" ? "" : " · fora do site"}
          </p>
          {sponsor.websiteUrl ? (
            <a href={sponsor.websiteUrl} target="_blank" rel="noreferrer">
              {linkLabel(sponsor.websiteUrl)} <ExternalLink aria-hidden="true" />
            </a>
          ) : (
            <span className="pv-muted">Sem link</span>
          )}
        </div>
        {readOnly ? null : (
          <div className="pv-sponsor-actions">
            <button type="button" className="row-action" onClick={() => openEditor(sponsor)} aria-label={`Editar ${sponsor.name}`}>
              <Pencil aria-hidden="true" /> Editar
            </button>
            <button type="button" className="row-action is-quiet" onClick={() => void remove(sponsor)} aria-label={`Remover ${sponsor.name}`}>
              <Trash2 aria-hidden="true" /> Remover
            </button>
          </div>
        )}
      </li>
    );
  }

  return (
    <div className="pv-workspace">
      <div className="pv-toolbar">
        <p className="pv-lede">
          {active.length} no site{inactive.length ? ` · ${inactive.length} fora do site` : ""}. A logo aparece sobre fundo claro na home e
          sobre fundo escuro na página de patrocinadores.
        </p>
        <button type="button" className="button-secondary" onClick={() => void load()}>
          <RefreshCw aria-hidden="true" /> Atualizar
        </button>
        {readOnly ? null : (
          <button type="button" className="button-primary" onClick={() => openEditor()}>
            <Plus aria-hidden="true" /> Novo patrocinador
          </button>
        )}
      </div>

      {notice ? (
        <div className="alert alert-success" role="status">
          {notice}
        </div>
      ) : null}
      {error ? (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      ) : null}

      {draft ? (
        <section className="pv-editor" ref={editorRef} aria-labelledby="sponsor-editor-title">
          <header>
            <h2 id="sponsor-editor-title">{draft.id ? `Editar ${draft.name}` : "Novo patrocinador"}</h2>
            <button type="button" className="icon-button" onClick={closeEditor} aria-label="Fechar editor">
              <X aria-hidden="true" />
            </button>
          </header>
          <form onSubmit={(event) => void save(event)} className="pv-editor-grid">
            <div
              className={`pv-dropzone${dragging ? " is-dragging" : ""}`}
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
            >
              {shownLogo ? (
                <div className="pv-preview-pair">
                  <figure>
                    <div className="pv-sponsor-mark is-large">
                      <img src={shownLogo} alt="Prévia da logo no fundo escuro" />
                    </div>
                    <figcaption>Página de patrocinadores</figcaption>
                  </figure>
                  <figure>
                    <div className="pv-sponsor-mark is-large is-light">
                      <img src={shownLogo} alt="Prévia da logo no fundo claro" />
                    </div>
                    <figcaption>Home do site</figcaption>
                  </figure>
                </div>
              ) : (
                <div className="pv-sponsor-mark is-large">
                  <span className="pv-sponsor-missing">
                    <ImagePlus aria-hidden="true" />
                    Arraste a logo aqui
                  </span>
                </div>
              )}
              <div className="pv-dropzone-actions">
                <button type="button" className="button-secondary" onClick={() => fileInput.current?.click()}>
                  <Upload aria-hidden="true" /> {shownLogo ? "Trocar logo" : "Escolher arquivo"}
                </button>
                {shownLogo ? (
                  <button
                    type="button"
                    className="pv-link-button"
                    onClick={() => {
                      setFile(null);
                      setDraft({ ...draft, logoUrl: "" });
                    }}
                  >
                    Remover logo
                  </button>
                ) : null}
                <small>SVG ou PNG com fundo transparente, até 10 MB. A prévia mostra a logo nos dois fundos em que ela aparece no site.</small>
              </div>
              <input
                ref={fileInput}
                type="file"
                accept={ACCEPTED.join(",")}
                hidden
                onChange={(event) => {
                  pickFile(event.target.files?.[0]);
                  event.target.value = "";
                }}
              />
            </div>

            <div className="form-grid pv-editor-fields">
              <label>
                Nome
                <input
                  value={draft.name}
                  required
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      name: event.target.value,
                      slug: draft.id ? draft.slug : slugify(event.target.value),
                    })
                  }
                />
              </label>
              <label>
                Instagram ou site
                <input
                  value={draft.websiteUrl}
                  placeholder="https://www.instagram.com/marca/"
                  inputMode="url"
                  onChange={(event) => setDraft({ ...draft, websiteUrl: event.target.value })}
                />
              </label>
              <label>
                Cota
                <input
                  value={draft.tier}
                  list="sponsor-tiers"
                  onChange={(event) => setDraft({ ...draft, tier: event.target.value })}
                />
                <datalist id="sponsor-tiers">
                  {TIERS.map((tier) => (
                    <option key={tier} value={tier} />
                  ))}
                </datalist>
              </label>
              <label>
                No site
                <select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value })}>
                  <option value="active">Aparece no site</option>
                  <option value="inactive">Fora do site</option>
                </select>
              </label>
              <div className="pv-editor-actions">
                <button type="button" className="button-secondary" onClick={closeEditor} disabled={saving}>
                  Cancelar
                </button>
                <button type="submit" className="button-primary" disabled={saving}>
                  {saving ? "Salvando…" : draft.id ? "Salvar alterações" : "Adicionar patrocinador"}
                </button>
              </div>
            </div>
          </form>
        </section>
      ) : null}

      <PanelState
        loading={loading}
        error=""
        empty={!loading && !sponsors.length ? "Nenhum patrocinador cadastrado ainda." : undefined}
      >
        <ul className="pv-sponsor-grid">{active.map(card)}</ul>
        {inactive.length ? (
          <>
            <h2 className="pv-subhead">Fora do site</h2>
            <ul className="pv-sponsor-grid">{inactive.map(card)}</ul>
          </>
        ) : null}
      </PanelState>
    </div>
  );
}
