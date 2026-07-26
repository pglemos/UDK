import { createClient } from "@supabase/supabase-js";

export type PublicDriver = {
  slug: string;
  name: string;
  number: number;
  category: string;
  points: number;
  wins: number;
  podiums: number;
};

export type PublicStage = {
  date: string;
  title: string;
  track: string;
  time: string;
  startsAt?: string;
};

export type PublicResult = {
  id: string;
  stageTitle: string;
  category: string;
  status: string;
  version: number;
  fastestLapMs: number | null;
};

type UnknownRow = Record<string, unknown>;

function stringValue(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function numberValue(value: unknown, fallback = 0): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function normalizePublicDriver(row: UnknownRow): PublicDriver {
  return {
    slug: stringValue(row.slug),
    name: stringValue(row.name),
    number: numberValue(row.number),
    category: stringValue(row.category),
    points: numberValue(row.points),
    wins: numberValue(row.wins),
    podiums: numberValue(row.podiums),
  };
}

export function normalizePublicStage(row: UnknownRow): PublicStage {
  const startsAt = stringValue(row.starts_at);
  return {
    date: stringValue(row.date_label),
    title: stringValue(row.title),
    track: stringValue(row.track),
    time: stringValue(row.time_label),
    ...(startsAt ? { startsAt } : {}),
  };
}

export function normalizePublicResult(row: UnknownRow): PublicResult {
  const fastestLap = row.fastest_lap_ms == null ? null : numberValue(row.fastest_lap_ms);
  return {
    id: stringValue(row.id),
    stageTitle: stringValue(row.stage_title),
    category: stringValue(row.category, "Geral"),
    status: stringValue(row.status),
    version: numberValue(row.version, 1),
    fastestLapMs: fastestLap,
  };
}

export const fallbackDrivers: PublicDriver[] = [
  { slug: "walison-goncalves", name: "Walison Gonçalves", number: 7, category: "Ultras Insanos", points: 112, wins: 3, podiums: 5 },
  { slug: "haroldo-alves", name: "Haroldo Alves", number: 79, category: "Ultras Insanos", points: 104, wins: 2, podiums: 5 },
  { slug: "aldo-senna", name: "Aldo Senna", number: 44, category: "Ultras Rápidos", points: 98, wins: 2, podiums: 4 },
  { slug: "pedro-guilherme", name: "Pedro Guilherme", number: 70, category: "Ultras Rápidos", points: 91, wins: 1, podiums: 4 },
  { slug: "arthur-henrique", name: "Arthur Henrique", number: 56, category: "Ultras Rápidos", points: 84, wins: 0, podiums: 3 },
];

export const fallbackStages: PublicStage[] = [
  { date: "18 AGO", title: "Endurance", track: "Traçado 01 invertido com chicane", time: "21h" },
  { date: "08 SET", title: "Etapa regular", track: "Traçado 02 normal e invertido", time: "21h" },
  { date: "13 OUT", title: "Etapa regular", track: "Traçado 05 normal e invertido", time: "21h" },
  { date: "10 NOV", title: "Etapa regular", track: "Traçado 11 normal e invertido", time: "21h" },
  { date: "12 DEZ", title: "Final Endurance", track: "Traçado 01 normal", time: "11h" },
];

export async function getPublicData(): Promise<{
  drivers: PublicDriver[];
  stages: PublicStage[];
  results: PublicResult[];
}> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return { drivers: fallbackDrivers, stages: fallbackStages, results: [] };

  try {
    const client = createClient(url, key, { auth: { persistSession: false } });
    const [driversResponse, stagesResponse, resultsResponse] = await Promise.all([
      client.from("public_standings").select("slug,name,number,category,points,wins,podiums").order("position").limit(100),
      client.from("public_calendar").select("date_label,title,track,time_label,starts_at").order("starts_at").limit(100),
      client.from("public_results").select("id,stage_title,category,status,version,fastest_lap_ms").order("starts_at", { ascending: false }).limit(100),
    ]);

    const drivers = driversResponse.data?.length
      ? (driversResponse.data as UnknownRow[]).map(normalizePublicDriver)
      : fallbackDrivers;
    const stages = stagesResponse.data?.length
      ? (stagesResponse.data as UnknownRow[]).map(normalizePublicStage)
      : fallbackStages;
    const results = resultsResponse.data?.length
      ? (resultsResponse.data as UnknownRow[]).map(normalizePublicResult)
      : [];

    return { drivers, stages, results };
  } catch {
    return { drivers: fallbackDrivers, stages: fallbackStages, results: [] };
  }
}

export function formatLapTime(milliseconds: number | null): string {
  if (milliseconds == null || milliseconds < 0) return "—";
  const minutes = Math.floor(milliseconds / 60000);
  const seconds = Math.floor((milliseconds % 60000) / 1000);
  const millis = milliseconds % 1000;
  return `${minutes}:${String(seconds).padStart(2, "0")}.${String(millis).padStart(3, "0")}`;
}
