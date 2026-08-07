export const packageName = "@udk/scoring-engine" as const;

export type ScoringFormat = "regular" | "endurance";

export type ScoreResultInput = {
  format: ScoringFormat;
  position: number;
  pole?: boolean;
  fastestLap?: boolean;
};

export type ScoringEventResult = {
  id: string;
  points: number;
};

export type SeasonDiscardSummary = {
  grossPoints: number;
  netPoints: number;
  discardCount: number;
  discardedIds: string[];
  countedIds: string[];
};

export const MAX_SCORING_EVENTS = 8;
export const COUNTED_RESULTS = 6;
export const MAX_DISCARDS = 2;

export const REGULAR_POSITION_POINTS = {
  1: 50,
  2: 45,
  3: 42,
  4: 40,
  5: 38,
  6: 37,
  7: 36,
  8: 35,
  9: 34,
  10: 33,
  11: 32,
  12: 31,
  13: 30,
  14: 29,
  15: 28,
  16: 27,
  17: 26,
  18: 25,
  19: 24,
  20: 23,
  21: 22,
  22: 21,
  23: 20,
  24: 19,
  25: 18,
  26: 17,
  27: 16,
  28: 15,
  29: 14,
  30: 13,
  31: 12,
  32: 11,
  33: 10,
  34: 9,
  35: 8,
  36: 7,
  37: 6,
  38: 5,
  39: 4,
  40: 3,
  41: 2,
  42: 1,
} as const satisfies Record<number, number>;

const ENDURANCE_TOP_FIVE = {
  1: 150,
  2: 145,
  3: 142,
  4: 140,
  5: 138,
} as const satisfies Record<number, number>;

export function positionPoints(format: ScoringFormat, position: number): number {
  if (!Number.isInteger(position) || position < 1) return 0;

  if (format === "regular") {
    return REGULAR_POSITION_POINTS[position as keyof typeof REGULAR_POSITION_POINTS] ?? 0;
  }

  if (position <= 5) {
    return ENDURANCE_TOP_FIVE[position as keyof typeof ENDURANCE_TOP_FIVE] ?? 0;
  }

  return Math.max(0, 143 - position);
}

export function scoreResult({
  format,
  position,
  pole = false,
  fastestLap = false,
}: ScoreResultInput): number {
  return positionPoints(format, position) + (pole ? 1 : 0) + (fastestLap ? 1 : 0);
}

export function applySeasonDiscards(results: readonly ScoringEventResult[]): SeasonDiscardSummary {
  if (results.length > MAX_SCORING_EVENTS) {
    throw new RangeError(`UDK 2026 accepts at most ${MAX_SCORING_EVENTS} scoring events.`);
  }

  const normalized = results.map((result, index) => ({
    ...result,
    points: Number.isFinite(result.points) ? Math.max(0, result.points) : 0,
    index,
  }));
  const grossPoints = normalized.reduce((sum, result) => sum + result.points, 0);
  const discardCount = Math.min(MAX_DISCARDS, Math.max(0, normalized.length - COUNTED_RESULTS));

  const worst = [...normalized]
    .sort((left, right) => left.points - right.points || left.index - right.index)
    .slice(0, discardCount);
  const discardedIndexes = new Set(worst.map((result) => result.index));
  const discardedPoints = worst.reduce((sum, result) => sum + result.points, 0);

  return {
    grossPoints,
    netPoints: grossPoints - discardedPoints,
    discardCount,
    discardedIds: worst.map((result) => result.id),
    countedIds: normalized.filter((result) => !discardedIndexes.has(result.index)).map((result) => result.id),
  };
}
