import { createClient } from "@supabase/supabase-js";

export const PUBLIC_DATA_TIMEOUT_MS = 3_000;

export function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PUBLIC_DATA_TIMEOUT_MS);
  const externalSignal = init?.signal;
  const abortFromCaller = () => controller.abort();

  if (externalSignal) {
    if (externalSignal.aborted) controller.abort();
    else externalSignal.addEventListener("abort", abortFromCaller, { once: true });
  }

  return fetch(input, { ...init, signal: controller.signal }).finally(() => {
    clearTimeout(timer);
    externalSignal?.removeEventListener("abort", abortFromCaller);
  });
}

export function publicSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  return createClient(url, key, {
    auth: { persistSession: false },
    global: { fetch: fetchWithTimeout },
  });
}
