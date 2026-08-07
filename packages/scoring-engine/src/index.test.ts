import { describe, expect, it } from "vitest";
import {
  applySeasonDiscards,
  positionPoints,
  scoreResult,
} from "./index";

describe("UDK 2026 scoring", () => {
  it("uses the official regular-race points table from P1 through P42", () => {
    expect(positionPoints("regular", 1)).toBe(50);
    expect(positionPoints("regular", 2)).toBe(45);
    expect(positionPoints("regular", 3)).toBe(42);
    expect(positionPoints("regular", 4)).toBe(40);
    expect(positionPoints("regular", 5)).toBe(38);
    expect(positionPoints("regular", 8)).toBe(35);
    expect(positionPoints("regular", 15)).toBe(28);
    expect(positionPoints("regular", 22)).toBe(21);
    expect(positionPoints("regular", 29)).toBe(14);
    expect(positionPoints("regular", 36)).toBe(7);
    expect(positionPoints("regular", 42)).toBe(1);
    expect(positionPoints("regular", 43)).toBe(0);
  });

  it("adds one point for pole and one point for fastest lap in a regular race", () => {
    expect(scoreResult({ format: "regular", position: 1, pole: true, fastestLap: true })).toBe(52);
    expect(scoreResult({ format: "regular", position: 10, pole: true, fastestLap: false })).toBe(34);
  });

  it("uses the official Endurance sequence", () => {
    expect(positionPoints("endurance", 1)).toBe(150);
    expect(positionPoints("endurance", 2)).toBe(145);
    expect(positionPoints("endurance", 3)).toBe(142);
    expect(positionPoints("endurance", 4)).toBe(140);
    expect(positionPoints("endurance", 5)).toBe(138);
    expect(positionPoints("endurance", 6)).toBe(137);
    expect(positionPoints("endurance", 42)).toBe(101);
    expect(positionPoints("endurance", 142)).toBe(1);
    expect(positionPoints("endurance", 143)).toBe(0);
  });

  it("keeps every result until more than six scoring events have been completed", () => {
    const result = applySeasonDiscards([
      { id: "e1", points: 50 },
      { id: "e2", points: 45 },
      { id: "e3", points: 42 },
      { id: "e4", points: 40 },
      { id: "e5", points: 150 },
      { id: "e6", points: 35 },
    ]);

    expect(result.grossPoints).toBe(362);
    expect(result.netPoints).toBe(362);
    expect(result.discardedIds).toEqual([]);
  });

  it("discards one worst result after seven scoring events", () => {
    const result = applySeasonDiscards([
      { id: "e1", points: 50 },
      { id: "e2", points: 45 },
      { id: "e3", points: 42 },
      { id: "e4", points: 40 },
      { id: "e5", points: 150 },
      { id: "e6", points: 35 },
      { id: "e7", points: 20 },
    ]);

    expect(result.grossPoints).toBe(382);
    expect(result.netPoints).toBe(362);
    expect(result.discardedIds).toEqual(["e7"]);
  });

  it("discards the two worst results after all eight scoring events, including an absence scored as zero", () => {
    const result = applySeasonDiscards([
      { id: "e1", points: 50 },
      { id: "e2", points: 45 },
      { id: "e3", points: 42 },
      { id: "e4", points: 40 },
      { id: "e5", points: 150 },
      { id: "e6", points: 35 },
      { id: "e7", points: 20 },
      { id: "e8", points: 0 },
    ]);

    expect(result.grossPoints).toBe(382);
    expect(result.netPoints).toBe(362);
    expect(result.discardedIds).toEqual(["e8", "e7"]);
    expect(result.countedIds).toHaveLength(6);
  });
});
