import { describe, expect, it } from "vitest";
import {
  decryptOfflineQueue,
  encryptOfflineQueue,
  isOfflineCapableTable,
  parseOfflineQueue,
  serializeOfflineQueue,
  type OfflineOperation,
} from "./offline-queue";

const operation: OfflineOperation = {
  id: "operation-1",
  table: "stints",
  action: "update",
  recordId: "record-1",
  payload: { status: "closed", laps: 22 },
  deviceId: "device-1",
  sequence: 1,
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

  it("allows only operational, non-financial tables offline", () => {
    expect(isOfflineCapableTable("stints")).toBe(true);
    expect(isOfflineCapableTable("checkins")).toBe(true);
    expect(isOfflineCapableTable("drivers")).toBe(false);
    expect(isOfflineCapableTable("payments")).toBe(false);
    expect(isOfflineCapableTable("documents")).toBe(false);
  });

  it("accepts inserts without a record id", () => {
    const insert: OfflineOperation = {
      id: "operation-2",
      table: operation.table,
      action: "insert",
      payload: operation.payload,
      deviceId: operation.deviceId,
      sequence: 2,
      createdAt: operation.createdAt,
      attempts: operation.attempts,
    };

    expect(parseOfflineQueue(serializeOfflineQueue([insert]))).toEqual([insert]);
  });

  it("encrypts the persisted queue and restores it with the same key", async () => {
    const key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
    const encrypted = await encryptOfflineQueue([operation], key);

    expect(encrypted.ciphertext).not.toContain("stints");
    expect(encrypted.ciphertext).not.toContain("record-1");
    await expect(decryptOfflineQueue(encrypted, key)).resolves.toEqual([operation]);
  });
});
