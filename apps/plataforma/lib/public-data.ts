import { createClient } from "@supabase/supabase-js";

export type PageMeta = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
};

export type PaginatedResult<T> = {
  items: T[];
  meta: PageMeta;
};

export type PublicCategory = {
  slug: string;
  name: string;
  color: string;
};

export type PublicDriver = {
  id: string;
  slug: string;
  name: string;
  fullName: string;
  number: number;
  category: string;
  categorySlug: string;
  categoryColor: string;
  points: number;
  wins: number;
  podiums: number;
  poles: number;
  position: number | null;
  previousPosition: number | null;
  avatarUrl: string | null;
  heroImageUrl: string | null;
  teamName: string | null;
  city: string | null;
  bio: string | null;
};

export type PublicStage = {
  id: string;
  slug: string;
  date: string;
  title: string;
  format: string;
  track: string;
  time: string;
  startsAt?: string;
  status: string;
  location: string;
  city: string;
  registrationOpensAt: string | null;
  registrationClosesAt: string | null;
  trackMapUrl: string | null;
  heroImageUrl: string | null;
  shortDescription: string | null;
};

export type PublicResult = {
  id: string;
  title: string;
  stageId: string;
  stageSlug: string;
  stageTitle: string;
  category: string;
  status: string;
  version: number;
  fastestLapMs: number | null;
  publishedAt: string | null;
  startsAt: string | null;
  track: string;
};

export type PublicResultEntry = {
  id: string;
  resultId: string;
  position: number;
  driverSlug: string;
  driverName: string;
  driverNumber: number;
  kartNumber: number | null;
  laps: number;
  totalTimeMs: number | null;
  bestLapMs: number | null;
  penaltyMs: number;
  points: number;
  pole: boolean;
  fastestLap: boolean;
  status: string;
  stageTitle: string;
  createdAt: string | null;
};

type UnknownRow = Record<string, unknown>;

function stringValue(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function nullableString(value: unknown): string | null {
  const result = stringValue(value).trim();
  return result ? result : null;
}

function numberValue(value: unknown, fallback = 0): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function nullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = numberValue(value, Number.NaN);
  return Number.isFinite(parsed) ? parsed : null;
}

function booleanValue(value: unknown): boolean {
  return value === true || value === "true";
}

export function parsePositiveInt(
  value: string | string[] | undefined,
  fallback: number,
  maximum = 999,
): number {
  const source = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(source ?? "", 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, maximum);
}

export function getPageRange(page: number, pageSize: number): { from: number; to: number } {
  const from = Math.max(0, (page - 1) * pageSize);
  return { from, to: from + pageSize - 1 };
}

export function buildPageMeta(
  page: number,
  pageSize: number,
  totalItems: number,
): PageMeta {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  return {
    page: safePage,
    pageSize,
    totalItems,
    totalPages,
    hasPreviousPage: safePage > 1,
    hasNextPage: safePage < totalPages,
  };
}

export function normalizePublicDriver(row: UnknownRow): PublicDriver {
  const name = stringValue(row.name) || stringValue(row.sport_name) || stringValue(row.full_name);
  const category = stringValue(row.category) || stringValue(row.category_name, "Geral");

  return {
    id: stringValue(row.id),
    slug: stringValue(row.slug),
    name,
    fullName: stringValue(row.full_name, name),
    number: numberValue(row.number),
    category,
    categorySlug: stringValue(row.category_slug),
    categoryColor: stringValue(row.category_color, "#00D9FF"),
    points: numberValue(row.points),
    wins: numberValue(row.wins),
    podiums: numberValue(row.podiums),
    poles: numberValue(row.poles),
    position: nullableNumber(row.position),
    previousPosition: nullableNumber(row.previous_position),
    avatarUrl: nullableString(row.avatar_url),
    heroImageUrl: nullableString(row.hero_image_url),
    teamName: nullableString(row.team_name),
    city: nullableString(row.city),
    bio: nullableString(row.bio),
  };
}

export function normalizePublicStage(row: UnknownRow): PublicStage {
  const startsAt = stringValue(row.starts_at);

  return {
    id: stringValue(row.id),
    slug: stringValue(row.slug) || stringValue(row.id),
    date: stringValue(row.date_label),
    title: stringValue(row.title),
    format: stringValue(row.format),
    track: stringValue(row.track),
    time: stringValue(row.time_label),
    ...(startsAt ? { startsAt } : {}),
    status: stringValue(row.status, "scheduled"),
    location: stringValue(row.location, "Kartódromo Internacional de Betim"),
    city: stringValue(row.city, "Betim/MG"),
    registrationOpensAt: nullableString(row.registration_opens_at),
    registrationClosesAt: nullableString(row.registration_closes_at),
    trackMapUrl: nullableString(row.track_map_url),
    heroImageUrl: nullableString(row.hero_image_url),
    shortDescription: nullableString(row.short_description),
  };
}

export function normalizePublicResult(row: UnknownRow): PublicResult {
  return {
    id: stringValue(row.id),
    title: stringValue(row.title),
    stageId: stringValue(row.stage_id),
    stageSlug: stringValue(row.stage_slug) || stringValue(row.stage_id),
    stageTitle: stringValue(row.stage_title),
    category: stringValue(row.category, "Geral"),
    status: stringValue(row.status),
    version: numberValue(row.version, 1),
    fastestLapMs: nullableNumber(row.fastest_lap_ms),
    publishedAt: nullableString(row.published_at),
    startsAt: nullableString(row.starts_at),
    track: stringValue(row.track),
  };
}

export function normalizePublicResultEntry(row: UnknownRow): PublicResultEntry {
  return {
    id: stringValue(row.id),
    resultId: stringValue(row.result_id),
    position: numberValue(row.position),
    driverSlug: stringValue(row.driver_slug),
    driverName: stringValue(row.driver_name),
    driverNumber: numberValue(row.driver_number),
    kartNumber: nullableNumber(row.kart_number),
    laps: numberValue(row.laps),
    totalTimeMs: nullableNumber(row.total_time_ms),
    bestLapMs: nullableNumber(row.best_lap_ms),
    penaltyMs: numberValue(row.penalty_ms),
    points: numberValue(row.points),
    pole: booleanValue(row.pole),
    fastestLap: booleanValue(row.fastest_lap),
    status: stringValue(row.status),
    stageTitle: stringValue(row.stage_title),
    createdAt: nullableString(row.created_at),
  };
}

const developmentDrivers: PublicDriver[] = [
  {
    id: "demo-1",
    slug: "walison-goncalves",
    name: "Walison Gonçalves",
    fullName: "Walison Gonçalves",
    number: 7,
    category: "Ultras Insanos",
    categorySlug: "ultras-insanos",
    categoryColor: "#00D9FF",
    points: 112,
    wins: 3,
    podiums: 5,
    poles: 2,
    position: 1,
    previousPosition: 2,
    avatarUrl: null,
    heroImageUrl: null,
    teamName: null,
    city: "Betim/MG",
    bio: null,
  },
  {
    id: "demo-2",
    slug: "haroldo-alves",
    name: "Haroldo Alves",
    fullName: "Haroldo Alves",
    number: 79,
    category: "Ultras Insanos",
    categorySlug: "ultras-insanos",
    categoryColor: "#00D9FF",
    points: 104,
    wins: 2,
    podiums: 5,
    poles: 1,
    position: 2,
    previousPosition: 2,
    avatarUrl: null,
    heroImageUrl: null,
    teamName: null,
    city: "Betim/MG",
    bio: null,
  },
  {
    id: "demo-3",
    slug: "aldo-senna",
    name: "Aldo Senna",
    fullName: "Aldo Senna",
    number: 44,
    category: "Ultras Rápidos",
    categorySlug: "ultras-rapidos",
    categoryColor: "#35E6FF",
    points: 98,
    wins: 2,
    podiums: 4,
    poles: 1,
    position: 3,
    previousPosition: 1,
    avatarUrl: null,
    heroImageUrl: null,
    teamName: null,
    city: "Betim/MG",
    bio: null,
  },
];

const developmentStages: PublicStage[] = [
  {
    id: "demo-stage-1",
    slug: "endurance-agosto",
    date: "18 AGO",
    title: "Endurance",
    format: "Endurance",
    track: "Traçado 01 invertido com chicane",
    time: "21h",
    startsAt: "2026-08-18T21:00:00-03:00",
    status: "registration_open",
    location: "Kartódromo Internacional de Betim",
    city: "Betim/MG",
    registrationOpensAt: null,
    registrationClosesAt: null,
    trackMapUrl: null,
    heroImageUrl: null,
    shortDescription: "Estratégia, consistência e trabalho em equipe sob as luzes de Betim.",
  },
];

function demoEnabled(): boolean {
  return process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_ENABLE_DEMO_DATA === "true";
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

export async function getCategories(): Promise<PublicCategory[]> {
  const client = publicClient();
  if (!client) {
    return demoEnabled()
      ? [
          { slug: "ultras-insanos", name: "Ultras Insanos", color: "#00D9FF" },
          { slug: "ultras-rapidos", name: "Ultras Rápidos", color: "#35E6FF" },
        ]
      : [];
  }

  const { data, error } = await client
    .from("public_portal_categories")
    .select("slug,name,color")
    .order("name");

  if (error) return [];
  return ((data ?? []) as UnknownRow[]).map((row) => ({
    slug: stringValue(row.slug),
    name: stringValue(row.name),
    color: stringValue(row.color, "#00D9FF"),
  }));
}

export async function getStandingsPage({
  page = 1,
  pageSize = 20,
  category,
  query,
  sort = "position",
}: {
  page?: number;
  pageSize?: number;
  category?: string;
  query?: string;
  sort?: "position" | "points" | "name";
} = {}): Promise<PaginatedResult<PublicDriver>> {
  const client = publicClient();

  if (!client) {
    const source = demoEnabled() ? developmentDrivers : [];
    return {
      items: source,
      meta: buildPageMeta(1, pageSize, source.length),
    };
  }

  const { from, to } = getPageRange(page, pageSize);
  const sortColumn = sort === "name" ? "name" : sort;
  let request = client
    .from("public_portal_standings")
    .select("*", { count: "exact" })
    .order(sortColumn, { ascending: sort === "name" })
    .range(from, to);

  if (category && category !== "geral") request = request.eq("category_slug", category);
  const cleanQuery = safeSearch(query);
  if (cleanQuery) request = request.ilike("name", `%${cleanQuery}%`);

  const { data, count, error } = await request;
  if (error) return { items: [], meta: buildPageMeta(page, pageSize, 0) };

  return {
    items: ((data ?? []) as UnknownRow[]).map(normalizePublicDriver),
    meta: buildPageMeta(page, pageSize, count ?? 0),
  };
}

export async function getDriversPage({
  page = 1,
  pageSize = 12,
  category,
  query,
  sort = "position",
}: {
  page?: number;
  pageSize?: number;
  category?: string;
  query?: string;
  sort?: "position" | "points" | "name";
} = {}): Promise<PaginatedResult<PublicDriver>> {
  const client = publicClient();

  if (!client) {
    const source = demoEnabled() ? developmentDrivers : [];
    return {
      items: source,
      meta: buildPageMeta(1, pageSize, source.length),
    };
  }

  const { from, to } = getPageRange(page, pageSize);
  const sortColumn = sort === "name" ? "name" : sort;
  let request = client
    .from("public_portal_drivers")
    .select("*", { count: "exact" })
    .order(sortColumn, { ascending: sort === "name" })
    .range(from, to);

  if (category && category !== "geral") request = request.eq("category_slug", category);
  const cleanQuery = safeSearch(query);
  if (cleanQuery) request = request.ilike("name", `%${cleanQuery}%`);

  const { data, count, error } = await request;
  if (error) return { items: [], meta: buildPageMeta(page, pageSize, 0) };

  return {
    items: ((data ?? []) as UnknownRow[]).map(normalizePublicDriver),
    meta: buildPageMeta(page, pageSize, count ?? 0),
  };
}

export async function getDriverBySlug(slug: string): Promise<PublicDriver | null> {
  const client = publicClient();
  if (!client) {
    return demoEnabled() ? developmentDrivers.find((item) => item.slug === slug) ?? null : null;
  }

  const { data, error } = await client
    .from("public_portal_drivers")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) return null;
  return normalizePublicDriver(data as UnknownRow);
}

export async function getStages({
  status,
  format,
}: {
  status?: string;
  format?: string;
} = {}): Promise<PublicStage[]> {
  const client = publicClient();
  if (!client) return demoEnabled() ? developmentStages : [];

  let request = client
    .from("public_portal_calendar")
    .select("*")
    .order("starts_at", { ascending: true });

  if (status && status !== "todos") request = request.eq("status", status);
  if (format && format !== "todos") request = request.eq("format", format);

  const { data, error } = await request;
  if (error) return [];
  return ((data ?? []) as UnknownRow[]).map(normalizePublicStage);
}

export async function getResultsPage({
  page = 1,
  pageSize = 8,
  category,
  status,
}: {
  page?: number;
  pageSize?: number;
  category?: string;
  status?: string;
} = {}): Promise<PaginatedResult<PublicResult>> {
  const client = publicClient();
  if (!client) return { items: [], meta: buildPageMeta(page, pageSize, 0) };

  const { from, to } = getPageRange(page, pageSize);
  let request = client
    .from("public_portal_results")
    .select("*", { count: "exact" })
    .order("starts_at", { ascending: false })
    .range(from, to);

  if (category && category !== "geral") request = request.eq("category_slug", category);
  if (status && status !== "todos") request = request.eq("status", status);

  const { data, count, error } = await request;
  if (error) return { items: [], meta: buildPageMeta(page, pageSize, 0) };

  return {
    items: ((data ?? []) as UnknownRow[]).map(normalizePublicResult),
    meta: buildPageMeta(page, pageSize, count ?? 0),
  };
}

export async function getResultEntries(resultId: string): Promise<PublicResultEntry[]> {
  const client = publicClient();
  if (!client || !resultId) return [];

  const { data, error } = await client
    .from("public_portal_result_entries")
    .select("*")
    .eq("result_id", resultId)
    .order("position");

  if (error) return [];
  return ((data ?? []) as UnknownRow[]).map(normalizePublicResultEntry);
}

export async function getDriverHistory(slug: string): Promise<PublicResultEntry[]> {
  const client = publicClient();
  if (!client || !slug) return [];

  const { data, error } = await client
    .from("public_portal_result_entries")
    .select("*")
    .eq("driver_slug", slug)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) return [];
  return ((data ?? []) as UnknownRow[]).map(normalizePublicResultEntry);
}

export async function getPublicData(): Promise<{
  drivers: PublicDriver[];
  stages: PublicStage[];
  results: PublicResult[];
}> {
  const [standings, stages, results] = await Promise.all([
    getStandingsPage({ pageSize: 100 }),
    getStages(),
    getResultsPage({ pageSize: 100 }),
  ]);

  return {
    drivers: standings.items,
    stages,
    results: results.items,
  };
}

export function formatLapTime(milliseconds: number | null): string {
  if (milliseconds == null || milliseconds < 0) return "—";
  const minutes = Math.floor(milliseconds / 60_000);
  const seconds = Math.floor((milliseconds % 60_000) / 1_000);
  const millis = Math.floor(milliseconds % 1_000);
  return `${minutes}:${String(seconds).padStart(2, "0")}.${String(millis).padStart(3, "0")}`;
}

export function formatGap(milliseconds: number | null): string {
  if (milliseconds == null) return "—";
  if (milliseconds === 0) return "Líder";
  return `+${(milliseconds / 1_000).toLocaleString("pt-BR", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  })}`;
}

export function positionDelta(driver: PublicDriver): number | null {
  if (driver.position == null || driver.previousPosition == null) return null;
  return driver.previousPosition - driver.position;
}
