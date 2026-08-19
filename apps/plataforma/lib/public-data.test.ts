import { describe, expect, it } from "vitest";
import {
  buildPageMeta,
  formatGap,
  formatLapTime,
  getPageRange,
  normalizePublicDriver,
  normalizePublicLap,
  normalizePublicResult,
  normalizePublicResultEntry,
  normalizePublicStage,
  parsePositiveInt,
} from "./public-data";

describe("public data normalization", () => {
  it("normalizes the public driver contract without private fields", () => {
    expect(
      normalizePublicDriver({
        id: "driver-1",
        slug: "pedro-guilherme",
        name: "Pedro Guilherme",
        full_name: "Pedro Guilherme Lemos",
        number: 70,
        category: "Ultras Rápidos",
        category_slug: "ultras-rapidos",
        category_color: "#00D9FF",
        points: "91.00",
        gross_points: "103.00",
        discarded_points: "12.00",
        wins: 1,
        podiums: 4,
        poles: 2,
        position: 4,
        previous_position: 6,
        avatar_url: "",
        profile_id: "private-user-id",
      }),
    ).toEqual({
      id: "driver-1",
      slug: "pedro-guilherme",
      name: "Pedro Guilherme",
      fullName: "Pedro Guilherme Lemos",
      number: 70,
      category: "Ultras Rápidos",
      categorySlug: "ultras-rapidos",
      categoryColor: "#00D9FF",
      points: 91,
      grossPoints: 103,
      discardedPoints: 12,
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
    expect(
      normalizePublicStage({
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
      }),
    ).toMatchObject({
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

    expect(
      normalizePublicResult({
        id: "result-1",
        title: "Corrida 1",
        stage_id: "stage-1",
        stage_slug: "etapa-1",
        stage_title: "Etapa 1",
        category: "Ultras Insanos",
        status: "published",
        version: 2,
        fastest_lap_ms: 72_310,
      }),
    ).toMatchObject({
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

    expect(
      normalizePublicResultEntry({
        id: "entry-1",
        result_id: "result-1",
        position: 12,
        driver_slug: "pedro-guilherme",
        driver_name: "Pedro Guilherme",
        driver_number: null,
        laps: 47,
        best_lap_ms: 66_754,
        penalty_ms: 0,
        points: 131,
        pole: false,
        fastest_lap: false,
        best_pit: false,
        penalty_points: 0,
        timing_adjustment_laps: 1,
        sporting_note: "Retificação de cronometragem: total oficial 47 voltas.",
      }),
    ).toMatchObject({
      id: "entry-1",
      resultId: "result-1",
      position: 12,
      driverSlug: "pedro-guilherme",
      driverName: "Pedro Guilherme",
      driverNumber: null,
      laps: 47,
      bestLapMs: 66_754,
      points: 131,
      bestPit: false,
      penaltyPoints: 0,
      timingAdjustmentLaps: 1,
      sportingNote: "Retificação de cronometragem: total oficial 47 voltas.",
    });

    expect(
      normalizePublicResultEntry({
        id: "entry-2",
        result_id: "result-1",
        position: 9,
        driver_slug: "lucas-rabelo",
        driver_name: "Lucas Rabelo",
        laps: 50,
        points: 144,
        best_pit: true,
        penalty_points: "0",
        timing_adjustment_laps: 0,
        sporting_note: "Melhor parada Endurance: TV 05:00.007 (+10 pontos).",
      }),
    ).toMatchObject({
      bestPit: true,
      penaltyPoints: 0,
      timingAdjustmentLaps: 0,
      sportingNote: "Melhor parada Endurance: TV 05:00.007 (+10 pontos).",
    });

    expect(
      normalizePublicLap({
        id: "lap-1",
        result_id: "result-1",
        result_entry_id: "entry-1",
        driver_id: "driver-1",
        driver_slug: "piloto",
        driver_name: "Piloto",
        result_title: "Endurance 1h",
        stage_title: "1ª etapa",
        lap_number: 12,
        lap_time_ms: 65_140,
        elapsed_time_ms: 812_345,
        speed_kph: "52.28",
        valid: true,
      }),
    ).toEqual({
      id: "lap-1",
      resultId: "result-1",
      resultEntryId: "entry-1",
      driverId: "driver-1",
      driverSlug: "piloto",
      driverName: "Piloto",
      resultTitle: "Endurance 1h",
      stageTitle: "1ª etapa",
      lapNumber: 12,
      lapTimeMs: 65_140,
      elapsedTimeMs: 812_345,
      speedKph: 52.28,
      position: null,
      valid: true,
      invalidReason: null,
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
