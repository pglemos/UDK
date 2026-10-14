import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = JSON.parse(
  fs.readFileSync(
    path.resolve(import.meta.dirname, "../../../docs/results/2026-10-13-stage-3.json"),
    "utf8",
  ),
);
type Entry = {
  race: number;
  slug: string;
  category: string;
  position: number;
  laps: number;
  best_lap_ms: number;
  pole: boolean;
  fastest_lap: boolean;
  penalty_points: number;
  penalty_ms: number;
  expected_points: number;
  total_time_ms: number | null;
  sporting_note: string | null;
  lap_times: { number: number; time_ms: number; elapsed_ms: number }[];
};
const entries: Entry[] = source.entries;

describe("13 October 2026 official import", () => {
  it("preserves all 28 drivers in both races and all 1094 recorded laps", () => {
    expect(entries).toHaveLength(56);
    expect(new Set(entries.map((e) => e.slug)).size).toBe(28);
    expect(entries.reduce((sum, e) => sum + e.laps, 0)).toBe(1094);
    for (const race of [1, 2]) {
      const rows = entries.filter((e) => e.race === race);
      expect(rows.map((e) => e.position)).toEqual(Array.from({ length: 28 }, (_, i) => i + 1));
      expect(rows.filter((e) => e.category === "insanos")).toHaveLength(14);
      expect(rows.filter((e) => e.category === "rapidos")).toHaveLength(14);
      expect(rows.filter((e) => e.pole).map((e) => e.slug)).toEqual(["andre-felisberto"]);
    }
    for (const e of entries) {
      expect(e.lap_times.map((lap) => lap.number)).toEqual(
        Array.from({ length: e.laps }, (_, i) => i + 1),
      );
      expect(Math.min(...e.lap_times.map((lap) => lap.time_ms))).toBe(e.best_lap_ms);
      expect(e.lap_times.every((lap) => lap.time_ms > 0 && lap.elapsed_ms > 0)).toBe(true);
    }
  });

  it("matches every points value supplied by the organizer, including all four penalties", () => {
    for (const e of entries) {
      const base =
        ({ 1: 50, 2: 45, 3: 42, 4: 40, 5: 38 } as Record<number, number>)[e.position] ??
        43 - e.position;
      expect(base + Number(e.pole) + Number(e.fastest_lap) - e.penalty_points).toBe(
        e.expected_points,
      );
      expect(e.penalty_ms).toBe(e.penalty_points ? 5000 : 0);
    }
    expect(entries.filter((e) => e.penalty_points).map((e) => `${e.race}:${e.slug}`)).toEqual([
      "1:marcelo-marques",
      "2:braulio-bonoto",
      "2:lucas-godoy",
      "2:rafael-teodoro",
    ]);
    expect(
      entries
        .filter((e) => e.slug === "andre-felisberto")
        .reduce((sum, e) => sum + e.expected_points, 0),
    ).toBe(103);
    expect(
      entries
        .filter((e) => e.slug === "pedro-horta")
        .reduce((sum, e) => sum + e.expected_points, 0),
    ).toBe(49);
  });

  it("preserves the manual classification without fabricating missing telemetry", () => {
    const marcelo = entries.find((e) => e.race === 1 && e.slug === "marcelo-augusto")!;
    expect(marcelo.position).toBe(10);
    expect(marcelo.expected_points).toBe(33);
    expect(marcelo.lap_times).toHaveLength(3);
    expect(marcelo.total_time_ms).toBeNull();
    expect(marcelo.sporting_note).toContain("não foram estimadas");
    expect(entries.find((e) => e.race === 1 && e.slug === "raphael-werner")!.position).toBe(28);
  });
});
