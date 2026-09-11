import { normalizePublicResult, type PublicLap, type PublicResultEntry } from "./public-data";
import { publicSupabaseClient } from "./public-supabase";

export async function getRequestedResult(resultId: string | undefined) {
  if (!resultId || !/^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(resultId)) return null;
  const client = publicSupabaseClient();
  if (!client) return null;

  const { data, error } = await client
    .from("public_portal_results")
    .select("*")
    .eq("id", resultId)
    .maybeSingle();
  return error || !data ? null : normalizePublicResult(data);
}

export function selectDriverLapSessions(
  history: PublicResultEntry[],
  laps: PublicLap[],
  requestedResultId?: string,
) {
  return history
    .filter((entry) => requestedResultId === undefined || entry.resultId === requestedResultId)
    .map((entry) => ({
      entry,
      laps: laps.filter(
        (lap) =>
          lap.resultEntryId === entry.id &&
          lap.resultId === entry.resultId &&
          lap.driverSlug === entry.driverSlug,
      ),
    }))
    .filter((session) => session.laps.length > 0);
}
