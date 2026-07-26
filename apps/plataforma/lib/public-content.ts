import { createClient } from "@supabase/supabase-js";
import { buildPageMeta, getPageRange, type PageMeta } from "./public-data";

type UnknownRow = Record<string, unknown>;

export type PublicContent = {
  slug: string;
  title: string;
  summary: string;
  content: string;
  category: string;
  coverImageUrl: string | null;
  publishedAt: string;
  readingMinutes: number;
};

export type PublicSponsor = {
  name: string;
  slug: string;
  logoUrl: string;
  websiteUrl: string;
  tier: string;
};

export type PublicTerm = {
  id: string;
  title: string;
  version: number;
  content: string;
  effectiveAt: string;
  status: string;
  downloadUrl: string | null;
};

export type PaginatedContent = {
  items: PublicContent[];
  meta: PageMeta;
};

function text(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function nullableText(value: unknown): string | null {
  const normalized = text(value).trim();
  return normalized || null;
}

function number(value: unknown, fallback = 0): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function contentText(value: unknown): string {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object") return "";
  const record = value as Record<string, unknown>;
  return text(record.body) || text(record.text) || text(record.description) || text(record.summary);
}

function contentSummary(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value.slice(0, 240);
  if (!value || typeof value !== "object") return fallback;
  const record = value as Record<string, unknown>;
  return text(record.summary) || text(record.description) || text(record.excerpt) || fallback;
}

export function normalizePublicContent(row: UnknownRow): PublicContent {
  const body = contentText(row.content);
  const summary = text(row.summary) || contentSummary(row.content, body.slice(0, 220));
  const words = body.trim() ? body.trim().split(/\s+/).length : summary.trim().split(/\s+/).length;

  return {
    slug: text(row.slug),
    title: text(row.title),
    summary,
    content: body,
    category: text(row.category, "Notícias"),
    coverImageUrl: nullableText(row.cover_image_url),
    publishedAt: text(row.published_at),
    readingMinutes: Math.max(1, Math.ceil(words / 220)),
  };
}

export function normalizePublicSponsor(row: UnknownRow): PublicSponsor {
  return {
    name: text(row.name),
    slug: text(row.slug),
    logoUrl: text(row.logo_url),
    websiteUrl: text(row.website_url),
    tier: text(row.tier),
  };
}

export function normalizePublicTerm(row: UnknownRow): PublicTerm {
  return {
    id: text(row.id),
    title: text(row.title),
    version: number(row.version),
    content: text(row.content),
    effectiveAt: text(row.effective_at),
    status: text(row.status, "published"),
    downloadUrl: nullableText(row.download_url),
  };
}

function publicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

function safeSearch(value: string | undefined): string {
  return (value ?? "").replaceAll("%", "").replaceAll("_", "").trim().slice(0, 80);
}

export async function getNewsPage({
  page = 1,
  pageSize = 9,
  category,
  query,
}: {
  page?: number;
  pageSize?: number;
  category?: string;
  query?: string;
} = {}): Promise<PaginatedContent> {
  const client = publicClient();
  if (!client) return { items: [], meta: buildPageMeta(page, pageSize, 0) };

  const { from, to } = getPageRange(page, pageSize);
  let request = client
    .from("public_portal_news")
    .select("*", { count: "exact" })
    .order("published_at", { ascending: false })
    .range(from, to);

  if (category && category !== "todas") request = request.eq("category", category);
  const cleanQuery = safeSearch(query);
  if (cleanQuery) request = request.ilike("title", `%${cleanQuery}%`);

  const { data, count, error } = await request;
  if (error) return { items: [], meta: buildPageMeta(page, pageSize, 0) };

  return {
    items: ((data ?? []) as UnknownRow[]).map(normalizePublicContent),
    meta: buildPageMeta(page, pageSize, count ?? 0),
  };
}

export async function getNewsBySlug(slug: string): Promise<PublicContent | null> {
  const client = publicClient();
  if (!client) return null;

  const { data, error } = await client
    .from("public_portal_news")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) return null;
  return normalizePublicContent(data as UnknownRow);
}

export async function getSponsors(): Promise<PublicSponsor[]> {
  const client = publicClient();
  if (!client) return [];

  const { data, error } = await client
    .from("public_portal_sponsors")
    .select("*")
    .order("tier")
    .order("name");

  if (error) return [];
  return ((data ?? []) as UnknownRow[]).map(normalizePublicSponsor);
}

export async function getRegulations(): Promise<PublicTerm[]> {
  const client = publicClient();
  if (!client) return [];

  const { data, error } = await client
    .from("public_portal_regulations")
    .select("*")
    .order("version", { ascending: false });

  if (error) return [];
  return ((data ?? []) as UnknownRow[]).map(normalizePublicTerm);
}

export async function getPublicContentBundle(): Promise<{
  news: PublicContent[];
  sponsors: PublicSponsor[];
  regulations: PublicTerm[];
}> {
  const [news, sponsors, regulations] = await Promise.all([
    getNewsPage({ pageSize: 50 }),
    getSponsors(),
    getRegulations(),
  ]);

  return { news: news.items, sponsors, regulations };
}
