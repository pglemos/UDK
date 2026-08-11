import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchWithTimeout, PUBLIC_DATA_TIMEOUT_MS } from "./public-supabase";

describe("public Supabase timeout", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("keeps public fallback pages from waiting on a stalled request", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn((_input: RequestInfo | URL, init?: RequestInit) => (
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true });
      })
    )));

    const request = fetchWithTimeout("https://example.supabase.co/rest/v1/public_portal_drivers");
    const rejected = expect(request).rejects.toMatchObject({ name: "AbortError" });

    await vi.advanceTimersByTimeAsync(PUBLIC_DATA_TIMEOUT_MS);

    await rejected;
  });
});
