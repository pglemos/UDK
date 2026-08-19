import { publicSupabaseClient } from "./public-supabase";

type UnknownRow = Record<string, unknown>;

export type SportingBreakdown = {
  entryId: string;
  bestPit: boolean;
  penaltyPoints: number;
  timingAdjustmentLaps: number;
  sportingNote: string | null;
};

function numberValue(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function nullableString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function normalizeSportingBreakdown(row: UnknownRow): SportingBreakdown {
  return {
    entryId: typeof row.id === "string" ? row.id : "",
    bestPit: row.best_pit === true || row.best_pit === "true",
    penaltyPoints: numberValue(row.penalty_points),
    timingAdjustmentLaps: numberValue(row.timing_adjustment_laps),
    sportingNote: nullableString(row.sporting_note),
  };
}

export async function getSportingBreakdowns(
  entryIds: readonly string[],
): Promise<Map<string, SportingBreakdown>> {
  const ids = [...new Set(entryIds.filter(Boolean))];
  if (ids.length === 0) return new Map();

  const client = publicSupabaseClient();
  if (!client) return new Map();

  const { data, error } = await client
    .from("public_portal_result_entries")
    .select("id,best_pit,penalty_points,timing_adjustment_laps,sporting_note")
    .in("id", ids);

  if (error) return new Map();

  return new Map(
    ((data ?? []) as UnknownRow[])
      .map(normalizeSportingBreakdown)
      .filter((item) => item.entryId)
      .map((item) => [item.entryId, item] as const),
  );
}
