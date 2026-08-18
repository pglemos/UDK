import { afterEach, describe, expect, it } from "vitest";
import { GET } from "./route";

const originalVercelCommitSha = process.env.VERCEL_GIT_COMMIT_SHA;
const originalVercelDeploymentId = process.env.VERCEL_DEPLOYMENT_ID;

afterEach(() => {
  if (originalVercelCommitSha === undefined) delete process.env.VERCEL_GIT_COMMIT_SHA;
  else process.env.VERCEL_GIT_COMMIT_SHA = originalVercelCommitSha;

  if (originalVercelDeploymentId === undefined) delete process.env.VERCEL_DEPLOYMENT_ID;
  else process.env.VERCEL_DEPLOYMENT_ID = originalVercelDeploymentId;
});

describe("health endpoint", () => {
  it("reports unified application status without exposing credentials", async () => {
    const response = await GET();
    const body = await response.json() as Record<string, unknown>;
    const serialized = JSON.stringify(body).toLowerCase();

    expect(response.status).toBe(200);
    expect(body.status).toBe("ok");
    expect(body.app).toBe("udk");
    expect(body).toHaveProperty("release");
    expect(body).toHaveProperty("supabaseConfigured");
    expect(body).toHaveProperty("timestamp");
    expect(serialized).not.toContain("service_role");
    expect(serialized).not.toContain("anon_key");
    expect(serialized).not.toContain("password");
    expect(serialized).not.toContain("token");
  });

  it("reports the Git commit that actually produced the Vercel deployment", async () => {
    process.env.VERCEL_GIT_COMMIT_SHA = "0123456789abcdef0123456789abcdef01234567";
    process.env.VERCEL_DEPLOYMENT_ID = "dpl_example";

    const body = (await (await GET()).json()) as Record<string, unknown>;

    expect(body.release).toBe("0123456789abcdef0123456789abcdef01234567");
    expect(body.deploymentId).toBe("dpl_example");
  });

  it("uses an explicit local marker when Vercel deployment metadata is unavailable", async () => {
    delete process.env.VERCEL_GIT_COMMIT_SHA;
    delete process.env.VERCEL_DEPLOYMENT_ID;

    const body = (await (await GET()).json()) as Record<string, unknown>;

    expect(body.release).toBe("local");
    expect(body.deploymentId).toBeNull();
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
