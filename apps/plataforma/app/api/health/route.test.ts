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
    expect(body).toHaveProperty("supabaseConfigured");
    expect(body).toHaveProperty("timestamp");
    expect(serialized).not.toContain("service_role");
    expect(serialized).not.toContain("anon_key");
    expect(serialized).not.toContain("password");
    expect(serialized).not.toContain("token");
  });
});
