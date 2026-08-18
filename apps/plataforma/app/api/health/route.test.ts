import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

const originalVercelCommitSha = process.env.VERCEL_GIT_COMMIT_SHA;
const originalVercelDeploymentId = process.env.VERCEL_DEPLOYMENT_ID;
const originalSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const originalSupabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

afterEach(() => {
  if (originalVercelCommitSha === undefined) delete process.env.VERCEL_GIT_COMMIT_SHA;
  else process.env.VERCEL_GIT_COMMIT_SHA = originalVercelCommitSha;

  if (originalVercelDeploymentId === undefined) delete process.env.VERCEL_DEPLOYMENT_ID;
  else process.env.VERCEL_DEPLOYMENT_ID = originalVercelDeploymentId;

  if (originalSupabaseUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  else process.env.NEXT_PUBLIC_SUPABASE_URL = originalSupabaseUrl;

  if (originalSupabaseAnonKey === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  else process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalSupabaseAnonKey;

  vi.unstubAllGlobals();
});

describe("health endpoint", () => {
  it("reports unified application status without exposing credentials", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const response = await GET();
    const body = (await response.json()) as Record<string, unknown>;
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
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    process.env.VERCEL_GIT_COMMIT_SHA = "0123456789abcdef0123456789abcdef01234567";
    process.env.VERCEL_DEPLOYMENT_ID = "dpl_example";

    const body = (await (await GET()).json()) as Record<string, unknown>;

    expect(body.release).toBe("0123456789abcdef0123456789abcdef01234567");
    expect(body.deploymentId).toBe("dpl_example");
  });

  it("uses an explicit local marker when Vercel deployment metadata is unavailable", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    delete process.env.VERCEL_GIT_COMMIT_SHA;
    delete process.env.VERCEL_DEPLOYMENT_ID;

    const body = (await (await GET()).json()) as Record<string, unknown>;

    expect(body.release).toBe("local");
    expect(body.deploymentId).toBeNull();
  });

  it("exposes the server clock so the countdown can calibrate (A5)", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
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

  it("marks production health as degraded when configured Supabase is unreachable", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "public-test-key";
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    const response = await GET();
    const body = (await response.json()) as Record<string, unknown>;

    expect(response.status).toBe(503);
    expect(body.status).toBe("degraded");
    expect(body.supabaseConfigured).toBe(true);
    expect(body.supabaseReachable).toBe(false);
  });

  it("confirms configured Supabase only after a real public data probe succeeds", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "public-test-key";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("[]", { status: 200 })));

    const response = await GET();
    const body = (await response.json()) as Record<string, unknown>;

    expect(response.status).toBe(200);
    expect(body.status).toBe("ok");
    expect(body.supabaseConfigured).toBe(true);
    expect(body.supabaseReachable).toBe(true);
  });
});
