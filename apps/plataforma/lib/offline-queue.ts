import type { SupabaseClient } from "@supabase/supabase-js";

const OFFLINE_TABLES = [
  "checkins",
  "kart_assignments",
  "stints",
  "incidents",
  "endurance_members",
] as const;

export type OfflineCapableTable = (typeof OFFLINE_TABLES)[number];

export type OfflineQueueOwner = {
  userId: string;
  projectUrl: string;
};

type OfflineOperationBase = {
  id: string;
  table: OfflineCapableTable;
  recordId: string;
  payload: Record<string, unknown>;
  ownerUserId: string;
  ownerProjectUrl: string;
  deviceId: string;
  sequence: number;
  createdAt: string;
  attempts: number;
};

export type OfflineOperation = OfflineOperationBase &
  (
    | { action: "insert" }
    | { action: "update" }
    | { action: "delete" }
  );

export type OfflineOperationInput =
  | {
      table: string;
      action: "insert";
      payload: Record<string, unknown>;
    }
  | {
      table: string;
      action: "update" | "delete";
      payload: Record<string, unknown>;
      recordId: string;
    };

export type EncryptedOfflineQueue = {
  version: 1;
  iv: string;
  ciphertext: string;
};

const DATABASE_NAME = "udk-offline-v1";
const DATABASE_VERSION = 1;
const STORE_NAME = "secure-state";
const QUEUE_KEY = "encrypted-queue";
const CRYPTO_KEY = "crypto-key";
const DEVICE_KEY = "device-id";
const SEQUENCE_KEY = "sequence";

let memoryQueue: OfflineOperation[] = [];
let memoryKey: CryptoKey | undefined;
let memoryDeviceId: string | undefined;
let memorySequence = 0;
let writeLock: Promise<void> = Promise.resolve();

function normalizeProjectUrl(value: string): string {
  try {
    return new URL(value).origin.toLowerCase();
  } catch {
    return value.trim().replace(/\/$/, "").toLowerCase();
  }
}

export function createOfflineQueueOwner(
  projectUrl: string,
  userId: string,
): OfflineQueueOwner {
  return {
    userId,
    projectUrl: normalizeProjectUrl(projectUrl),
  };
}

export function isOfflineCapableTable(table: string): table is OfflineCapableTable {
  return (OFFLINE_TABLES as readonly string[]).includes(table);
}

export function filterOfflineQueueForOwner(
  queue: OfflineOperation[],
  owner: OfflineQueueOwner,
): OfflineOperation[] {
  const projectUrl = normalizeProjectUrl(owner.projectUrl);
  return queue.filter(
    (operation) =>
      operation.ownerUserId === owner.userId &&
      normalizeProjectUrl(operation.ownerProjectUrl) === projectUrl,
  );
}

function belongsToOwner(operation: OfflineOperation, owner: OfflineQueueOwner): boolean {
  return filterOfflineQueueForOwner([operation], owner).length === 1;
}

export function parseOfflineQueue(value: string | null): OfflineOperation[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((item): item is OfflineOperation => {
      if (!item || typeof item !== "object") return false;
      const candidate = item as Partial<OfflineOperation>;
      return (
        typeof candidate.id === "string" &&
        typeof candidate.table === "string" &&
        isOfflineCapableTable(candidate.table) &&
        ["insert", "update", "delete"].includes(candidate.action ?? "") &&
        typeof candidate.recordId === "string" &&
        candidate.recordId.length > 0 &&
        typeof candidate.ownerUserId === "string" &&
        candidate.ownerUserId.length > 0 &&
        typeof candidate.ownerProjectUrl === "string" &&
        candidate.ownerProjectUrl.length > 0 &&
        typeof candidate.deviceId === "string" &&
        typeof candidate.sequence === "number" &&
        Number.isSafeInteger(candidate.sequence) &&
        candidate.sequence > 0 &&
        typeof candidate.createdAt === "string" &&
        typeof candidate.attempts === "number" &&
        Boolean(candidate.payload) &&
        typeof candidate.payload === "object"
      );
    });
  } catch {
    return [];
  }
}

export function serializeOfflineQueue(queue: OfflineOperation[]): string {
  return JSON.stringify(queue);
}

export function buildIdempotentInsertPayload(
  operation: Extract<OfflineOperation, { action: "insert" }>,
): Record<string, unknown> {
  return { ...operation.payload, id: operation.recordId };
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index] ?? 0);
  }
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

export async function encryptOfflineQueue(
  queue: OfflineOperation[],
  key: CryptoKey,
): Promise<EncryptedOfflineQueue> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = new TextEncoder().encode(serializeOfflineQueue(queue));
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext);

  return {
    version: 1,
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(new Uint8Array(encrypted)),
  };
}

export async function decryptOfflineQueue(
  envelope: EncryptedOfflineQueue,
  key: CryptoKey,
): Promise<OfflineOperation[]> {
  if (envelope.version !== 1) return [];
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64ToBytes(envelope.iv) },
    key,
    base64ToBytes(envelope.ciphertext),
  );
  return parseOfflineQueue(new TextDecoder().decode(decrypted));
}

function indexedDbAvailable(): boolean {
  return typeof window !== "undefined" && "indexedDB" in window && "crypto" in window;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Não foi possível abrir o armazenamento offline."));
  });
}

async function readValue<T>(key: string): Promise<T | undefined> {
  if (!indexedDbAvailable()) return undefined;
  const database = await openDatabase();
  try {
    return await new Promise<T | undefined>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readonly");
      const request = transaction.objectStore(STORE_NAME).get(key);
      request.onsuccess = () => resolve(request.result as T | undefined);
      request.onerror = () => reject(request.error ?? new Error("Falha ao ler o armazenamento offline."));
    });
  } finally {
    database.close();
  }
}

async function writeValue<T>(key: string, value: T): Promise<void> {
  if (!indexedDbAvailable()) return;
  const database = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      transaction.objectStore(STORE_NAME).put(value, key);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error("Falha ao gravar o armazenamento offline."));
      transaction.onabort = () => reject(transaction.error ?? new Error("Gravação offline cancelada."));
    });
  } finally {
    database.close();
  }
}

async function getEncryptionKey(): Promise<CryptoKey> {
  if (!indexedDbAvailable()) {
    memoryKey ??= await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
    return memoryKey;
  }

  const existing = await readValue<CryptoKey>(CRYPTO_KEY);
  if (existing) return existing;
  const generated = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
  await writeValue(CRYPTO_KEY, generated);
  return generated;
}

async function getDeviceId(): Promise<string> {
  if (!indexedDbAvailable()) {
    memoryDeviceId ??= crypto.randomUUID();
    return memoryDeviceId;
  }
  const existing = await readValue<string>(DEVICE_KEY);
  if (existing) return existing;
  const generated = crypto.randomUUID();
  await writeValue(DEVICE_KEY, generated);
  return generated;
}

async function nextSequence(): Promise<number> {
  if (!indexedDbAvailable()) {
    memorySequence += 1;
    return memorySequence;
  }
  const current = (await readValue<number>(SEQUENCE_KEY)) ?? 0;
  const next = current + 1;
  await writeValue(SEQUENCE_KEY, next);
  return next;
}

async function readRawQueue(): Promise<OfflineOperation[]> {
  if (typeof window === "undefined") return [];
  if (!indexedDbAvailable()) return memoryQueue;

  try {
    const envelope = await readValue<EncryptedOfflineQueue>(QUEUE_KEY);
    if (!envelope) return [];
    return await decryptOfflineQueue(envelope, await getEncryptionKey());
  } catch {
    return [];
  }
}

async function saveRawQueue(queue: OfflineOperation[]): Promise<void> {
  if (typeof window === "undefined") return;

  if (!indexedDbAvailable()) {
    memoryQueue = queue;
  } else {
    const encrypted = await encryptOfflineQueue(queue, await getEncryptionKey());
    await writeValue(QUEUE_KEY, encrypted);
  }

  window.dispatchEvent(new CustomEvent("udk:offline-queue"));
}

export async function getOfflineQueue(owner: OfflineQueueOwner): Promise<OfflineOperation[]> {
  return filterOfflineQueueForOwner(await readRawQueue(), owner);
}

function withWriteLock<T>(operation: () => Promise<T>): Promise<T> {
  const result = writeLock.then(operation, operation);
  writeLock = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

export async function enqueueOfflineOperation(
  owner: OfflineQueueOwner,
  operation: OfflineOperationInput,
): Promise<OfflineOperation> {
  if (!isOfflineCapableTable(operation.table)) {
    throw new Error(`O módulo ${operation.table} não pode armazenar dados offline.`);
  }

  const table = operation.table;
  return withWriteLock(async () => {
    const recordId = operation.action === "insert" ? crypto.randomUUID() : operation.recordId;
    const queued: OfflineOperation = {
      ...operation,
      table,
      recordId,
      id: crypto.randomUUID(),
      ownerUserId: owner.userId,
      ownerProjectUrl: normalizeProjectUrl(owner.projectUrl),
      deviceId: await getDeviceId(),
      sequence: await nextSequence(),
      createdAt: new Date().toISOString(),
      attempts: 0,
    };

    const queue = await readRawQueue();
    const withoutSupersededUpdates =
      queued.action === "update"
        ? queue.filter(
            (existing) =>
              !(
                belongsToOwner(existing, owner) &&
                existing.table === queued.table &&
                existing.action === "update" &&
                existing.recordId === queued.recordId
              ),
          )
        : queue;

    await saveRawQueue([...withoutSupersededUpdates, queued]);
    return queued;
  });
}

async function executeOperation(client: SupabaseClient, operation: OfflineOperation): Promise<void> {
  if (operation.action === "insert") {
    const { error } = await client
      .from(operation.table)
      .upsert(buildIdempotentInsertPayload(operation), { onConflict: "id" });
    if (error) throw error;
    return;
  }

  if (operation.action === "update") {
    const { error } = await client.from(operation.table).update(operation.payload).eq("id", operation.recordId);
    if (error) throw error;
    return;
  }

  const { error } = await client
    .from(operation.table)
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", operation.recordId);
  if (error) throw error;
}

export async function flushOfflineQueue(
  client: SupabaseClient,
  owner: OfflineQueueOwner,
): Promise<{ completed: number; remaining: number }> {
  return withWriteLock(async () => {
    const initialQueue = await readRawQueue();
    const ownerQueue = filterOfflineQueueForOwner(initialQueue, owner).sort(
      (left, right) =>
        left.createdAt.localeCompare(right.createdAt) ||
        left.deviceId.localeCompare(right.deviceId) ||
        left.sequence - right.sequence,
    );
    const snapshotIds = new Set(ownerQueue.map((operation) => operation.id));
    const failures: OfflineOperation[] = [];
    let completed = 0;

    for (const operation of ownerQueue) {
      try {
        await executeOperation(client, operation);
        completed += 1;
      } catch {
        failures.push({ ...operation, attempts: operation.attempts + 1 });
      }
    }

    const currentQueue = await readRawQueue();
    const operationsFromOtherOwners = currentQueue.filter((operation) => !belongsToOwner(operation, owner));
    const newlyQueuedForOwner = currentQueue.filter(
      (operation) => belongsToOwner(operation, owner) && !snapshotIds.has(operation.id),
    );
    const merged = [...operationsFromOtherOwners, ...failures, ...newlyQueuedForOwner];
    const unique = Array.from(new Map(merged.map((operation) => [operation.id, operation])).values());
    await saveRawQueue(unique);

    return { completed, remaining: failures.length + newlyQueuedForOwner.length };
  });
}
