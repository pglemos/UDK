export async function GET() {
  return Response.json({
    status: "ok",
    app: "udk",
    supabaseConfigured: Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    ),
    timestamp: new Date().toISOString(),
  });
}
