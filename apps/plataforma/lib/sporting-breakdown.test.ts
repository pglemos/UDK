import { describe, expect, it } from "vitest";
import { normalizeSportingBreakdown } from "./sporting-breakdown";

describe("sporting breakdown", () => {
  it("normalizes bonuses, deductions and timing corrections", () => {
    expect(
      normalizeSportingBreakdown({
        id: "entry-1",
        best_pit: true,
        penalty_points: "10",
        timing_adjustment_laps: 1,
        sporting_note: "Retificação oficial.",
      }),
    ).toEqual({
      entryId: "entry-1",
      bestPit: true,
      penaltyPoints: 10,
      timingAdjustmentLaps: 1,
      sportingNote: "Retificação oficial.",
    });
  });
});
