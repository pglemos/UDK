import { describe, expect, it } from "vitest";
import {
  buildIdempotentInsertPayload,
  decryptOfflineQueue,
  encryptOfflineQueue,
  filterOfflineQueueForOwner,
  isOfflineCapableTable,
  parseOfflineQueue,
  serializeOfflineQueue,
  type OfflineOperation,
  type OfflineQueueOwner,
} from "./offline-queue";

const owner: OfflineQueueOwner = {
  userId: "user-1",
  projectUrl: "https://project-one.supabase.co",
};

const operation: OfflineOperation = {
  id: "operation-1",
  table: "stints",
  action: "update",
  recordId: "record-1",
  payload: { status: "closed", laps: 22 },
  ownerUserId: owner.userId,
  ownerProjectUrl: owner.projectUrl,
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
    expect(
      parseOfflineQueue(
        JSON.stringify([
          {
            ...operation,
            action: "update",
            recordId: undefined,
          },
        ]),
      ),
    ).toEqual([]);
  });

  it("allows only operational, non-financial tables offline", () => {
    expect(isOfflineCapableTable("stints")).toBe(true);
    expect(isOfflineCapableTable("checkins")).toBe(true);
    expect(isOfflineCapableTable("drivers")).toBe(false);
    expect(isOfflineCapableTable("payments")).toBe(false);
    expect(isOfflineCapableTable("documents")).toBe(false);
  });

  it("requires a stable record id for every persisted insert", () => {
    const insert: OfflineOperation = {
      ...operation,
      id: "operation-2",
      action: "insert",
      recordId: "stable-record-2",
      sequence: 2,
    };

    expect(parseOfflineQueue(serializeOfflineQueue([insert]))).toEqual([insert]);
    expect(buildIdempotentInsertPayload(insert)).toEqual({
      status: "closed",
      laps: 22,
      id: "stable-record-2",
    });
  });

  it("isolates queued mutations by authenticated user and Supabase project", () => {
    const anotherOwnerOperation: OfflineOperation = {
      ...operation,
      id: "operation-3",
      ownerUserId: "user-2",
      ownerProjectUrl: "https://project-two.supabase.co",
    };

    expect(filterOfflineQueueForOwner([operation, anotherOwnerOperation], owner)).toEqual([operation]);
  });

  it("encrypts the persisted queue and restores it with the same key", async () => {
    const key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
    const encrypted = await encryptOfflineQueue([operation], key);

    expect(encrypted.ciphertext).not.toContain("stints");
    expect(encrypted.ciphertext).not.toContain("record-1");
    await expect(decryptOfflineQueue(encrypted, key)).resolves.toEqual([operation]);
  });
});
