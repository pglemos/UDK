import { describe, expect, it } from "vitest";
import { parseOfflineQueue, serializeOfflineQueue, type OfflineOperation } from "./offline-queue";

const operation: OfflineOperation = {
  id: "operation-1",
  table: "stints",
  action: "update",
  recordId: "record-1",
  payload: { status: "closed", laps: 22 },
  createdAt: "2026-07-18T10:00:00.000Z",
  attempts: 0,
};

describe("offline queue", () => {
  it("round-trips valid operations", () => {
    expect(parseOfflineQueue(serializeOfflineQueue([operation]))).toEqual([operation]);
  });

  it("rejects malformed JSON and malformed entries", () => {
    expect(parseOfflineQueue("not-json")).toEqual([]);
    expect(parseOfflineQueue(JSON.stringify([{ table: "drivers" }]))).toEqual([]);
  });

  it("accepts inserts without a record id", () => {
    const insert: OfflineOperation = {
      ...operation,
      id: "operation-2",
      action: "insert",
      recordId: undefined,
    };

    expect(parseOfflineQueue(serializeOfflineQueue([insert]))).toEqual([insert]);
  });
});
