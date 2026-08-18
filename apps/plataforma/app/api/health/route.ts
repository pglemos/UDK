export async function GET() {
  const now = new Date();

  return Response.json({
    status: "ok",
    now: now.toISOString(),
    app: "udk",
    release: process.env.VERCEL_GIT_COMMIT_SHA ?? "local",
    deploymentId: process.env.VERCEL_DEPLOYMENT_ID ?? null,
    supabaseConfigured: Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    ),
    timestamp: now.toISOString(),
  });
}
