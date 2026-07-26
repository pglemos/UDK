import { createClient } from "@supabase/supabase-js";

type UnknownRow = Record<string, unknown>;

export type PublicContent = {
  slug: string;
  title: string;
  summary: string;
  publishedAt: string;
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
};

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function number(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function contentSummary(value: unknown): string {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object") return "";
  const record = value as Record<string, unknown>;
  return text(record.summary) || text(record.description) || text(record.text);
}

export function normalizePublicContent(row: UnknownRow): PublicContent {
  return {
    slug: text(row.slug),
    title: text(row.title),
    summary: contentSummary(row.content),
    publishedAt: text(row.published_at),
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
  };
}

export async function getPublicContentBundle(): Promise<{
  news: PublicContent[];
  sponsors: PublicSponsor[];
  regulations: PublicTerm[];
}> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return { news: [], sponsors: [], regulations: [] };

  try {
    const client = createClient(url, key, { auth: { persistSession: false } });
    const [newsResponse, sponsorsResponse, termsResponse] = await Promise.all([
      client
        .from("cms_pages")
        .select("slug,title,content,published_at")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(50),
      client
        .from("sponsors")
        .select("name,slug,logo_url,website_url,tier")
        .eq("status", "active")
        .order("name")
        .limit(100),
      client
        .from("terms")
        .select("id,title,version,content,effective_at")
        .eq("kind", "regulation")
        .eq("status", "published")
        .order("version", { ascending: false })
        .limit(20),
    ]);

    return {
      news: ((newsResponse.data ?? []) as UnknownRow[]).map(normalizePublicContent),
      sponsors: ((sponsorsResponse.data ?? []) as UnknownRow[]).map(normalizePublicSponsor),
      regulations: ((termsResponse.data ?? []) as UnknownRow[]).map(normalizePublicTerm),
    };
  } catch {
    return { news: [], sponsors: [], regulations: [] };
  }
}
