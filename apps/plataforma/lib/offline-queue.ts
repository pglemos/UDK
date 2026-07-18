import type { SupabaseClient } from "@supabase/supabase-js";

export type OfflineOperation = {
  id: string;
  table: string;
  action: "insert" | "update" | "delete";
  payload: Record<string, unknown>;
  recordId?: string;
  createdAt: string;
  attempts: number;
};

const STORAGE_KEY = "udk:offline-operations:v1";

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
        ["insert", "update", "delete"].includes(candidate.action ?? "") &&
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

export function getOfflineQueue(): OfflineOperation[] {
  if (typeof window === "undefined") return [];
  return parseOfflineQueue(window.localStorage.getItem(STORAGE_KEY));
}

export function saveOfflineQueue(queue: OfflineOperation[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, serializeOfflineQueue(queue));
  window.dispatchEvent(new CustomEvent("udk:offline-queue", { detail: queue.length }));
}

export function enqueueOfflineOperation(
  operation: Omit<OfflineOperation, "id" | "createdAt" | "attempts">,
): OfflineOperation {
  const queued: OfflineOperation = {
    ...operation,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    attempts: 0,
  };

  const queue = getOfflineQueue();

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

  saveOfflineQueue([...withoutSupersededUpdates, queued]);
  return queued;
}

async function executeOperation(
  client: SupabaseClient,
  operation: OfflineOperation,
): Promise<void> {
  if (operation.action === "insert") {
    const { error } = await client.from(operation.table).insert(operation.payload);
    if (error) throw error;
    return;
  }

  if (!operation.recordId) {
    throw new Error("Offline update or delete operation is missing recordId");
  }

  if (operation.action === "update") {
    const { error } = await client
      .from(operation.table)
      .update(operation.payload)
      .eq("id", operation.recordId);
    if (error) throw error;
    return;
  }

  const { error } = await client.from(operation.table).delete().eq("id", operation.recordId);
  if (error) throw error;
}

export async function flushOfflineQueue(
  client: SupabaseClient,
): Promise<{ completed: number; remaining: number }> {
  const queue = getOfflineQueue();
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

  saveOfflineQueue(remaining);
  return { completed, remaining: remaining.length };
}
