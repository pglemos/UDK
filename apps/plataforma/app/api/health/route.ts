export async function GET() {
  return Response.json({
    status: "ok",
    app: "udk",
    release: "unified-2026-07-26",
    supabaseConfigured: Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    ),
    timestamp: new Date().toISOString(),
  });
}
