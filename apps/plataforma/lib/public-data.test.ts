import { describe, expect, it } from "vitest";
import { normalizePublicDriver, normalizePublicResult, normalizePublicStage } from "./public-data";

describe("public data normalization", () => {
  it("normalizes standings rows without leaking internal fields", () => {
    expect(normalizePublicDriver({
      slug: "pedro-guilherme",
      name: "Pedro Guilherme",
      number: 70,
      category: "Ultras Rápidos",
      points: "91.00",
      wins: 1,
      podiums: 4,
      profile_id: "private-user-id",
    })).toEqual({
      slug: "pedro-guilherme",
      name: "Pedro Guilherme",
      number: 70,
      category: "Ultras Rápidos",
      points: 91,
      wins: 1,
      podiums: 4,
    });
  });

  it("normalizes calendar and result rows for the public UI", () => {
    expect(normalizePublicStage({
      date_label: "18 AGO",
      title: "Endurance",
      track: "Traçado 01",
      time_label: "21h",
      starts_at: "2026-08-18T21:00:00-03:00",
    })).toEqual({
      date: "18 AGO",
      title: "Endurance",
      track: "Traçado 01",
      time: "21h",
      startsAt: "2026-08-18T21:00:00-03:00",
    });

    expect(normalizePublicResult({
      id: "result-1",
      stage_title: "Etapa 1",
      category: "Ultras Insanos",
      status: "published",
      version: 2,
      fastest_lap_ms: 72310,
    })).toEqual({
      id: "result-1",
      stageTitle: "Etapa 1",
      category: "Ultras Insanos",
      status: "published",
      version: 2,
      fastestLapMs: 72310,
    });
  });
});
