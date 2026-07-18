import type { SupabaseClient } from "@supabase/supabase-js";

const OFFLINE_TABLES = [
  "checkins",
  "kart_assignments",
  "stints",
  "incidents",
  "endurance_members",
] as const;

export type OfflineCapableTable = (typeof OFFLINE_TABLES)[number];

export type OfflineOperation = {
  id: string;
  table: OfflineCapableTable;
  action: "insert" | "update" | "delete";
  payload: Record<string, unknown>;
  recordId?: string;
  deviceId: string;
  sequence: number;
  createdAt: string;
  attempts: number;
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

export function isOfflineCapableTable(table: string): table is OfflineCapableTable {
  return (OFFLINE_TABLES as readonly string[]).includes(table);
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

export async function getOfflineQueue(): Promise<OfflineOperation[]> {
  if (typeof window === "undefined") return [];
  if (!indexedDbAvailable()) return memoryQueue;

  const envelope = await readValue<EncryptedOfflineQueue>(QUEUE_KEY);
  if (!envelope) return [];

  try {
    return await decryptOfflineQueue(envelope, await getEncryptionKey());
  } catch {
    return [];
  }
}

export async function saveOfflineQueue(queue: OfflineOperation[]): Promise<void> {
  if (typeof window === "undefined") return;

  if (!indexedDbAvailable()) {
    memoryQueue = queue;
  } else {
    const encrypted = await encryptOfflineQueue(queue, await getEncryptionKey());
    await writeValue(QUEUE_KEY, encrypted);
  }

  window.dispatchEvent(new CustomEvent("udk:offline-queue", { detail: queue.length }));
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
  operation: Omit<OfflineOperation, "id" | "deviceId" | "sequence" | "createdAt" | "attempts"> & {
    table: string;
  },
): Promise<OfflineOperation> {
  if (!isOfflineCapableTable(operation.table)) {
    throw new Error(`O módulo ${operation.table} não pode armazenar dados offline.`);
  }

  return withWriteLock(async () => {
    const queued: OfflineOperation = {
      ...operation,
      table: operation.table,
      id: crypto.randomUUID(),
      deviceId: await getDeviceId(),
      sequence: await nextSequence(),
      createdAt: new Date().toISOString(),
      attempts: 0,
    };

    const queue = await getOfflineQueue();
    const withoutSupersededUpdates =
      queued.action === "update" && queued.recordId
        ? queue.filter(
            (existing) =>
              !(
                existing.table === queued.table &&
                existing.action === "update" &&
                existing.recordId === queued.recordId
              ),
          )
        : queue;

    await saveOfflineQueue([...withoutSupersededUpdates, queued]);
    return queued;
  });
}

async function executeOperation(client: SupabaseClient, operation: OfflineOperation): Promise<void> {
  if (operation.action === "insert") {
    const { error } = await client.from(operation.table).insert(operation.payload);
    if (error) throw error;
    return;
  }

  if (!operation.recordId) {
    throw new Error("Offline update or delete operation is missing recordId");
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
): Promise<{ completed: number; remaining: number }> {
  return withWriteLock(async () => {
    const queue = (await getOfflineQueue()).sort(
      (left, right) =>
        left.createdAt.localeCompare(right.createdAt) ||
        left.deviceId.localeCompare(right.deviceId) ||
        left.sequence - right.sequence,
    );
    const remaining: OfflineOperation[] = [];
    let completed = 0;

    for (const operation of queue) {
      try {
        await executeOperation(client, operation);
        completed += 1;
      } catch {
        remaining.push({ ...operation, attempts: operation.attempts + 1 });
      }
    }

    await saveOfflineQueue(remaining);
    return { completed, remaining: remaining.length };
  });
}
