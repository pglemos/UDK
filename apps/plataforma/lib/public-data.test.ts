import { describe, expect, it } from "vitest";
import {
  buildPageMeta,
  formatGap,
  formatLapTime,
  getPageRange,
  normalizePublicDriver,
  normalizePublicResult,
  normalizePublicResultEntry,
  normalizePublicStage,
  parsePositiveInt,
} from "./public-data";

describe("public data normalization", () => {
  it("normalizes the public driver contract without private fields", () => {
    expect(normalizePublicDriver({
      id: "driver-1",
      slug: "pedro-guilherme",
      name: "Pedro Guilherme",
      full_name: "Pedro Guilherme Lemos",
      number: 70,
      category: "Ultras Rápidos",
      category_slug: "ultras-rapidos",
      category_color: "#00D9FF",
      points: "91.00",
      wins: 1,
      podiums: 4,
      poles: 2,
      position: 4,
      previous_position: 6,
      avatar_url: "",
      profile_id: "private-user-id",
    })).toEqual({
      id: "driver-1",
      slug: "pedro-guilherme",
      name: "Pedro Guilherme",
      fullName: "Pedro Guilherme Lemos",
      number: 70,
      category: "Ultras Rápidos",
      categorySlug: "ultras-rapidos",
      categoryColor: "#00D9FF",
      points: 91,
      wins: 1,
      podiums: 4,
      poles: 2,
      position: 4,
      previousPosition: 6,
      avatarUrl: null,
      heroImageUrl: null,
      teamName: null,
      city: null,
      bio: null,
    });
  });

  it("normalizes calendar, result and entry rows", () => {
    expect(normalizePublicStage({
      id: "stage-1",
      slug: "etapa-1",
      date_label: "18 AGO",
      title: "Endurance",
      format: "endurance",
      track: "Traçado 01",
      time_label: "21h",
      starts_at: "2026-08-18T21:00:00-03:00",
      status: "scheduled",
      location: "Kartódromo Internacional de Betim",
      city: "Betim/MG",
    })).toMatchObject({
      id: "stage-1",
      slug: "etapa-1",
      date: "18 AGO",
      title: "Endurance",
      format: "endurance",
      track: "Traçado 01",
      time: "21h",
      startsAt: "2026-08-18T21:00:00-03:00",
      status: "scheduled",
    });

    expect(normalizePublicResult({
      id: "result-1",
      title: "Corrida 1",
      stage_id: "stage-1",
      stage_slug: "etapa-1",
      stage_title: "Etapa 1",
      category: "Ultras Insanos",
      status: "published",
      version: 2,
      fastest_lap_ms: 72_310,
    })).toMatchObject({
      id: "result-1",
      title: "Corrida 1",
      stageId: "stage-1",
      stageSlug: "etapa-1",
      stageTitle: "Etapa 1",
      category: "Ultras Insanos",
      status: "published",
      version: 2,
      fastestLapMs: 72_310,
    });

    expect(normalizePublicResultEntry({
      id: "entry-1",
      result_id: "result-1",
      position: 1,
      driver_slug: "piloto",
      driver_name: "Piloto",
      driver_number: 33,
      laps: 15,
      best_lap_ms: 48_237,
      points: 25,
      fastest_lap: true,
    })).toMatchObject({
      id: "entry-1",
      resultId: "result-1",
      position: 1,
      driverSlug: "piloto",
      driverName: "Piloto",
      driverNumber: 33,
      laps: 15,
      bestLapMs: 48_237,
      points: 25,
      fastestLap: true,
    });
  });
});

describe("public pagination and timing", () => {
  it("parses safe positive pages and creates Supabase ranges", () => {
    expect(parsePositiveInt(undefined, 1)).toBe(1);
    expect(parsePositiveInt("-3", 1)).toBe(1);
    expect(parsePositiveInt("2", 1)).toBe(2);
    expect(getPageRange(1, 20)).toEqual({ from: 0, to: 19 });
    expect(getPageRange(2, 20)).toEqual({ from: 20, to: 39 });
  });

  it("builds complete page metadata", () => {
    expect(buildPageMeta(2, 20, 95)).toEqual({
      page: 2,
      pageSize: 20,
      totalItems: 95,
      totalPages: 5,
      hasPreviousPage: true,
      hasNextPage: true,
    });
  });

  it("formats lap times and gaps with tabular precision", () => {
    expect(formatLapTime(72_310)).toBe("1:12.310");
    expect(formatLapTime(null)).toBe("—");
    expect(formatGap(375)).toBe("+0,375");
    expect(formatGap(0)).toBe("Líder");
  });
});
