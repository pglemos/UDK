export async function GET() {
  const now = new Date();
  return Response.json({
    status: "ok",
    now: now.toISOString(),
    app: "udk",
    release: "unified-2026-07-26",
    supabaseConfigured: Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    ),
    timestamp: now.toISOString(),
  });
}
