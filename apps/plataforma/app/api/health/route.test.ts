import { describe, expect, it } from "vitest";
import { GET } from "./route";

describe("health endpoint", () => {
  it("reports unified application status without exposing credentials", async () => {
    const response = await GET();
    const body = await response.json() as Record<string, unknown>;
    const serialized = JSON.stringify(body).toLowerCase();

    expect(response.status).toBe(200);
    expect(body.status).toBe("ok");
    expect(body.app).toBe("udk");
    expect(body.release).toBe("unified-2026-07-26");
    expect(body).toHaveProperty("supabaseConfigured");
    expect(body).toHaveProperty("timestamp");
    expect(serialized).not.toContain("service_role");
    expect(serialized).not.toContain("anon_key");
    expect(serialized).not.toContain("password");
    expect(serialized).not.toContain("token");
  });

  it("exposes the server clock so the countdown can calibrate (A5)", async () => {
    const before = Date.now();
    const body = (await (await GET()).json()) as Record<string, unknown>;
    const after = Date.now();

    expect(typeof body.now).toBe("string");
    const now = new Date(body.now as string).getTime();
    expect(Number.isFinite(now)).toBe(true);
    expect(now).toBeGreaterThanOrEqual(before - 1_000);
    expect(now).toBeLessThanOrEqual(after + 1_000);
    expect(body.now).toBe(body.timestamp);
  });
});
