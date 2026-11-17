"use client";

import { confirmAction } from "../../lib/confirm-action";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ExternalLink, ImagePlus, Pencil, Plus, RefreshCw, Trash2, Upload, X } from "lucide-react";
import { PanelState, errorMessage } from "./shared";

type Article = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  body: string;
  category: string;
  coverUrl: string;
  status: string;
  publishedAt: string;
};

type Draft = Omit<Article, "id"> & { id: string | null };

const CATEGORIES = ["Notícia", "Resultados", "Etapa", "Campeonato", "Comunicado"];
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function toLocalInput(iso: string): string {
  if (!iso) return "";
  const date = new Date(iso);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function bodyOf(content: unknown): string {
  if (typeof content === "string") return content;
  if (content && typeof content === "object") {
    const record = content as Record<string, unknown>;
    for (const key of ["body", "text", "description"]) if (typeof record[key] === "string") return record[key] as string;
  }
  return "";
}

export function NewsPanel({ client, readOnly }: { client: SupabaseClient; readOnly: boolean }) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [championshipId, setChampionshipId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [pages, championship] = await Promise.all([
        client
          .from("cms_pages")
          .select("id,slug,title,summary,content,category,cover_image_url,status,published_at,kind")
          .is("deleted_at", null)
          .order("published_at", { ascending: false, nullsFirst: true }),
        client.from("championships").select("id").eq("slug", "udk").is("deleted_at", null).maybeSingle(),
      ]);
      if (pages.error) throw pages.error;
      setArticles(
        (pages.data ?? [])
          .filter((row) => (row.kind ?? "news") === "news")
          .map((row) => ({
            id: String(row.id),
            slug: String(row.slug),
            title: String(row.title ?? ""),
            summary: String(row.summary ?? ""),
            body: bodyOf(row.content),
            category: String(row.category ?? "Notícia"),
            coverUrl: String(row.cover_image_url ?? ""),
            status: String(row.status ?? "draft"),
            publishedAt: String(row.published_at ?? ""),
          })),
      );
      setChampionshipId(String(championship.data?.id ?? ""));
    } catch (loadError) {
      setError(errorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!file) {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const published = useMemo(() => articles.filter((article) => article.status === "published"), [articles]);
  const drafts = useMemo(() => articles.filter((article) => article.status !== "published"), [articles]);

  function openEditor(article?: Article) {
    setNotice("");
    setError("");
    setFile(null);
    setDraft(
      article
        ? { ...article }
        : {
            id: null,
            slug: "",
            title: "",
            summary: "",
            body: "",
            category: CATEGORIES[0]!,
            coverUrl: "",
            status: "draft",
            publishedAt: new Date().toISOString(),
          },
    );
    requestAnimationFrame(() => editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  async function save(event: FormEvent<HTMLFormElement>, status: "draft" | "published") {
    event.preventDefault();
    if (!draft) return;
    const title = draft.title.trim();
    if (!title || !draft.body.trim()) {
      setError("Preencha o título e o texto da notícia.");
      return;
    }
    setSaving(true);
    setError("");
    let uploadedPath = "";
    try {
      let coverUrl = draft.coverUrl;
      const slug = draft.slug || slugify(title);
      if (file) {
        const { data, error: userError } = await client.auth.getUser();
        if (userError || !data.user) throw userError ?? new Error("Sessão expirada. Entre de novo.");
        const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
        uploadedPath = `championship/${championshipId}/${data.user.id}/noticias/${slug}-${crypto.randomUUID()}.${extension}`;
        const { error: uploadError } = await client.storage
          .from("public-media")
          .upload(uploadedPath, file, { cacheControl: "31536000", contentType: file.type, upsert: false });
        if (uploadError) throw uploadError;
        coverUrl = client.storage.from("public-media").getPublicUrl(uploadedPath).data.publicUrl;
      }
      const payload = {
        championship_id: championshipId,
        slug,
        title,
        summary: draft.summary.trim() || null,
        content: { body: draft.body.trim() },
        category: draft.category.trim() || "Notícia",
        cover_image_url: coverUrl || null,
        status,
        kind: "news",
        published_at: draft.publishedAt ? new Date(draft.publishedAt).toISOString() : new Date().toISOString(),
      };
      const query = draft.id
        ? client.from("cms_pages").update(payload).eq("id", draft.id)
        : client.from("cms_pages").insert(payload);
      const { error: saveError } = await query;
      if (saveError) throw saveError;
      setNotice(status === "published" ? `"${title}" publicada no site.` : `"${title}" salva como rascunho.`);
      setDraft(null);
      setFile(null);
      await load();
    } catch (saveError) {
      if (uploadedPath) await client.storage.from("public-media").remove([uploadedPath]);
      setError(errorMessage(saveError));
    } finally {
      setSaving(false);
    }
  }

  async function remove(article: Article) {
    if (!(await confirmAction(`Apagar a notícia "${article.title}"? Ela sai do site na hora.`, "Apagar"))) return;
    const { error: removeError } = await client
      .from("cms_pages")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", article.id);
    if (removeError) {
      setError(errorMessage(removeError));
      return;
    }
    setNotice(`"${article.title}" apagada.`);
    await load();
  }

  const cover = preview || draft?.coverUrl || "";

  function row(article: Article) {
    return (
      <li key={article.id} className="pv-news">
        <div className="pv-news-cover">
          {article.coverUrl ? (
            <img src={article.coverUrl} alt="" decoding="async" />
          ) : (
            <span className="pv-news-nocover">
              <ImagePlus aria-hidden="true" />
              Sem capa
            </span>
          )}
        </div>
        <div className="pv-stack">
          <b>{article.title}</b>
          <small>
            {article.category} ·{" "}
            {article.publishedAt
              ? new Date(article.publishedAt).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })
              : "sem data"}
            {article.status === "published" ? "" : " · rascunho"}
          </small>
          <p>{article.summary}</p>
        </div>
        <div className="pv-news-actions">
          {article.status === "published" ? (
            <a className="row-action" href={`/noticias/${article.slug}`} target="_blank" rel="noreferrer" aria-label={`Ver ${article.title} no site`}>
              <ExternalLink aria-hidden="true" /> Ver no site
            </a>
          ) : null}
          {readOnly ? null : (
            <>
              <button type="button" className="row-action" onClick={() => openEditor(article)} aria-label={`Editar ${article.title}`}>
                <Pencil aria-hidden="true" /> Editar
              </button>
              <button type="button" className="row-action is-quiet" onClick={() => void remove(article)} aria-label={`Apagar ${article.title}`}>
                <Trash2 aria-hidden="true" /> Apagar
              </button>
            </>
          )}
        </div>
      </li>
    );
  }

  return (
    <div className="pv-workspace">
      <div className="pv-toolbar">
        <p className="pv-lede">
          {published.length} publicada(s) no site{drafts.length ? ` · ${drafts.length} rascunho(s)` : ""}. As notícias aparecem na home e
          em Notícias.
        </p>
        <button type="button" className="button-secondary" onClick={() => void load()}>
          <RefreshCw aria-hidden="true" /> Atualizar
        </button>
        {readOnly ? null : (
          <button type="button" className="button-primary" onClick={() => openEditor()}>
            <Plus aria-hidden="true" /> Nova notícia
          </button>
        )}
      </div>

      {notice ? <div className="alert alert-success" role="status">{notice}</div> : null}
      {error ? <div className="alert alert-error" role="alert">{error}</div> : null}

      {draft ? (
        <section className="pv-editor" ref={editorRef} aria-labelledby="news-editor-title">
          <header>
            <h2 id="news-editor-title">{draft.id ? "Editar notícia" : "Nova notícia"}</h2>
            <button type="button" className="icon-button" onClick={() => !saving && setDraft(null)} aria-label="Fechar editor">
              <X aria-hidden="true" />
            </button>
          </header>
          <form onSubmit={(event) => void save(event, "published")} className="pv-editor-grid">
            <div className="pv-dropzone">
              <div className="pv-cover-preview">
                {cover ? <img src={cover} alt="Prévia da capa" /> : <span className="pv-sponsor-missing"><ImagePlus aria-hidden="true" />Sem capa</span>}
              </div>
              <div className="pv-dropzone-actions">
                <button type="button" className="button-secondary" onClick={() => fileInput.current?.click()}>
                  <Upload aria-hidden="true" /> {cover ? "Trocar capa" : "Escolher capa"}
                </button>
                {cover ? (
                  <button type="button" className="pv-link-button" onClick={() => { setFile(null); setDraft({ ...draft, coverUrl: "" }); }}>
                    Remover capa
                  </button>
                ) : null}
                <small>Foto horizontal em JPG, PNG ou WEBP, até 10 MB.</small>
              </div>
              <input
                ref={fileInput}
                type="file"
                accept={ACCEPTED.join(",")}
                hidden
                onChange={(event) => {
                  const chosen = event.target.files?.[0];
                  event.target.value = "";
                  if (!chosen) return;
                  if (!ACCEPTED.includes(chosen.type)) return setError("A capa precisa ser JPG, PNG ou WEBP.");
                  if (chosen.size > 10 * 1024 * 1024) return setError("A capa deve ter no máximo 10 MB.");
                  setError("");
                  setFile(chosen);
                }}
              />
            </div>
            <div className="form-grid pv-editor-fields">
              <label className="form-wide">
                Título
                <input value={draft.title} required onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
              </label>
              <label className="form-wide">
                Resumo (aparece na lista e na home)
                <textarea rows={2} value={draft.summary} onChange={(event) => setDraft({ ...draft, summary: event.target.value })} />
              </label>
              <label className="form-wide">
                Texto
                <textarea rows={10} value={draft.body} required onChange={(event) => setDraft({ ...draft, body: event.target.value })} />
              </label>
              <label>
                Categoria
                <input value={draft.category} list="news-categories" onChange={(event) => setDraft({ ...draft, category: event.target.value })} />
                <datalist id="news-categories">
                  {CATEGORIES.map((category) => <option key={category} value={category} />)}
                </datalist>
              </label>
              <label>
                Data de publicação
                <input
                  type="datetime-local"
                  value={toLocalInput(draft.publishedAt)}
                  onChange={(event) => setDraft({ ...draft, publishedAt: event.target.value ? new Date(event.target.value).toISOString() : "" })}
                />
              </label>
              <div className="pv-editor-actions">
                <button type="button" className="button-secondary" disabled={saving} onClick={(event) => void save(event as unknown as FormEvent<HTMLFormElement>, "draft")}>
                  Salvar rascunho
                </button>
                <button type="submit" className="button-primary" disabled={saving}>
                  {saving ? "Salvando…" : "Publicar no site"}
                </button>
              </div>
            </div>
          </form>
        </section>
      ) : null}

      <PanelState loading={loading} error="" empty={!loading && !articles.length ? "Nenhuma notícia ainda." : undefined}>
        <ul className="pv-news-list">{[...drafts, ...published].map(row)}</ul>
      </PanelState>
    </div>
  );
}
