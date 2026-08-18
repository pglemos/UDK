import { fetchWithTimeout } from "../../../lib/public-supabase";

async function probeSupabase(url: string, anonKey: string): Promise<boolean> {
  try {
    const endpoint = `${url.replace(/\/$/, "")}/rest/v1/public_portal_categories?select=slug&limit=1`;
    const response = await fetchWithTimeout(endpoint, {
      method: "GET",
      cache: "no-store",
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        Accept: "application/json",
      },
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function GET() {
  const now = new Date();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
  const supabaseReachable = supabaseConfigured
    ? await probeSupabase(supabaseUrl!, supabaseAnonKey!)
    : null;
  const healthy = !supabaseConfigured || supabaseReachable === true;

  return Response.json({
    status: healthy ? "ok" : "degraded",
    now: now.toISOString(),
    app: "udk",
    release: process.env.VERCEL_GIT_COMMIT_SHA ?? "local",
    deploymentId: process.env.VERCEL_DEPLOYMENT_ID ?? null,
    supabaseConfigured,
    supabaseReachable,
    timestamp: now.toISOString(),
  }, { status: healthy ? 200 : 503 });
}
