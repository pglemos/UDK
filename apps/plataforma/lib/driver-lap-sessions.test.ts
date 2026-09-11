import { describe, expect, it, vi } from "vitest";
import { getRequestedResult, selectDriverLapSessions } from "./driver-lap-sessions";
import { officialResultPdfForResult } from "./official-result-links";
import { normalizePublicLap, normalizePublicResultEntry } from "./public-data";
import { publicSupabaseClient } from "./public-supabase";

vi.mock("./public-supabase", () => ({ publicSupabaseClient: vi.fn() }));

const history = [
  normalizePublicResultEntry({
    id: "entry-endurance",
    result_id: "endurance",
    driver_slug: "marcos-felipe",
  }),
  normalizePublicResultEntry({
    id: "entry-corrida-1",
    result_id: "corrida-1",
    driver_slug: "marcos-felipe",
  }),
];
const enduranceLap = normalizePublicLap({
  id: "lap-1",
  result_id: "endurance",
  result_entry_id: "entry-endurance",
  driver_slug: "marcos-felipe",
  lap_number: 1,
});

describe("driver lap race context", () => {
  it("never substitutes Endurance when the requested Corrida 1 has no published laps", () => {
    expect(selectDriverLapSessions(history, [enduranceLap], "corrida-1")).toEqual([]);
    expect(selectDriverLapSessions(history, [enduranceLap], "unknown")).toEqual([]);
    expect(selectDriverLapSessions(history, [enduranceLap], "")).toEqual([]);
    expect(selectDriverLapSessions(history, [enduranceLap])).toEqual([
      { entry: history[0], laps: [enduranceLap] },
    ]);
  });

  it("shows only the selected driver's laps from the selected result and entry", () => {
    const corridaLap = {
      ...enduranceLap,
      id: "lap-2",
      resultId: "corrida-1",
      resultEntryId: "entry-corrida-1",
    };
    expect(
      selectDriverLapSessions(
        history,
        [
          enduranceLap,
          corridaLap,
          { ...corridaLap, id: "wrong-driver", driverSlug: "another-driver" },
          { ...corridaLap, id: "wrong-result", resultId: "endurance" },
          { ...corridaLap, id: "wrong-entry", resultEntryId: "another-entry" },
        ],
        "corrida-1",
      ),
    ).toEqual([{ entry: history[1], laps: [corridaLap] }]);
  });

  it("fetches the requested published race by exact ID and resolves its own PDF", async () => {
    const resultId = "c7cccd16-3cf6-4a8a-a471-8fca5cf011b1";
    const maybeSingle = vi.fn().mockResolvedValue({
      data: { id: resultId, session_name: "Corrida 1 - Horário" },
      error: null,
    });
    const eq = vi.fn().mockReturnValue({ maybeSingle });
    const select = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ select });
    vi.mocked(publicSupabaseClient).mockReturnValue({ from } as unknown as ReturnType<
      typeof publicSupabaseClient
    >);

    const result = await getRequestedResult(resultId);
    expect(from).toHaveBeenCalledWith("public_portal_results");
    expect(eq).toHaveBeenCalledWith("id", resultId);
    expect(officialResultPdfForResult(result!.sessionName, result!.title)).toBe(
      "/resultados/udk-2026-2a-etapa-corrida-1-geral.pdf",
    );

    vi.mocked(publicSupabaseClient).mockClear();
    expect(await getRequestedResult("invalid")).toBeNull();
    expect(await getRequestedResult(undefined)).toBeNull();
    expect(publicSupabaseClient).not.toHaveBeenCalled();
  });
});
