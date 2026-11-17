import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import { roleOrder, type Role } from "../../../../lib/painel-structure";

/**
 * Equipe e acessos do painel. Toda chamada exige o token da sessão de quem está no painel
 * e confere no banco se essa pessoa é administrador ou da organização. A chave de serviço
 * só existe aqui no servidor; nunca vai para o navegador.
 *
 * GET    → pessoas com algum papel (nome, e-mail, último acesso, papéis)
 * POST   → { email, name?, role, expiresAt? } convida (se não tiver conta) e dá o papel
 * PATCH  → { roleId, expiresAt } muda a validade de um papel
 * DELETE → { roleId } retira um papel
 */

export const dynamic = "force-dynamic";

type Caller = { user: User; isAdmin: boolean; isOrganization: boolean };

function adminClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

async function authorize(request: Request, admin: SupabaseClient): Promise<Caller | Response> {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "Sessão não encontrada. Entre de novo no painel." }, 401);
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return json({ error: "Sessão expirada. Entre de novo no painel." }, 401);
  const { data: roles, error: rolesError } = await admin
    .from("user_roles")
    .select("role,expires_at")
    .eq("user_id", data.user.id)
    .is("deleted_at", null);
  if (rolesError) return json({ error: "Não foi possível conferir o seu acesso." }, 500);
  const now = Date.now();
  const active = (roles ?? []).filter((row) => !row.expires_at || new Date(row.expires_at).getTime() > now);
  const isAdmin = active.some((row) => row.role === "admin");
  const isOrganization = active.some((row) => row.role === "organization");
  if (!isAdmin && !isOrganization) return json({ error: "Só administradores e a organização gerenciam acessos." }, 403);
  return { user: data.user, isAdmin, isOrganization };
}

async function findUserByEmail(admin: SupabaseClient, email: string): Promise<User | null> {
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const found = data.users.find((user) => user.email?.toLowerCase() === email);
    if (found) return found;
    if (data.users.length < 200) return null;
  }
  return null;
}

async function championshipId(admin: SupabaseClient): Promise<string | null> {
  const { data } = await admin.from("championships").select("id").eq("slug", "udk").is("deleted_at", null).maybeSingle();
  return data?.id ? String(data.id) : null;
}

export async function GET(request: Request) {
  const admin = adminClient();
  if (!admin) return json({ error: "Gestão de acessos indisponível: falta configurar o servidor." }, 503);
  const caller = await authorize(request, admin);
  if (caller instanceof Response) return caller;

  const { data: roles, error } = await admin
    .from("user_roles")
    .select("id,user_id,role,expires_at,created_at")
    .is("deleted_at", null)
    .order("created_at", { ascending: true });
  if (error) return json({ error: "Não foi possível listar os acessos." }, 500);

  const ids = Array.from(new Set((roles ?? []).map((row) => String(row.user_id))));
  const [{ data: profiles }, users] = await Promise.all([
    admin.from("profiles").select("id,full_name,sport_name").in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]),
    Promise.all(ids.map((id) => admin.auth.admin.getUserById(id).then((result) => result.data.user))),
  ]);

  const people = ids.map((id) => {
    const profile = profiles?.find((row) => row.id === id);
    const account = users.find((user) => user?.id === id);
    return {
      id,
      name: profile?.sport_name || profile?.full_name || account?.user_metadata?.full_name || account?.email || "Sem nome",
      email: account?.email ?? "",
      lastSignInAt: account?.last_sign_in_at ?? null,
      invitedPending: Boolean(account && !account.last_sign_in_at && account.invited_at),
      roles: (roles ?? [])
        .filter((row) => String(row.user_id) === id)
        .map((row) => ({ id: String(row.id), role: row.role as Role, expiresAt: row.expires_at, createdAt: row.created_at }))
        .sort((a, b) => roleOrder.indexOf(a.role) - roleOrder.indexOf(b.role)),
    };
  });
  return json({ people, me: caller.user.id, isAdmin: caller.isAdmin });
}

export async function POST(request: Request) {
  const admin = adminClient();
  if (!admin) return json({ error: "Gestão de acessos indisponível: falta configurar o servidor." }, 503);
  const caller = await authorize(request, admin);
  if (caller instanceof Response) return caller;

  const body = (await request.json().catch(() => ({}))) as { email?: string; name?: string; role?: string; expiresAt?: string | null };
  const email = String(body.email ?? "").trim().toLowerCase();
  const role = String(body.role ?? "") as Role;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "Informe um e-mail válido." }, 400);
  if (!roleOrder.includes(role)) return json({ error: "Escolha um papel." }, 400);
  if (role === "admin" && !caller.isAdmin) return json({ error: "Só um administrador pode criar outro administrador." }, 403);
  const expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;
  if (expiresAt && (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() <= Date.now()))
    return json({ error: "A validade precisa ser uma data futura." }, 400);

  try {
    let account = await findUserByEmail(admin, email);
    let invited = false;
    if (!account) {
      const site = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;
      const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
        data: { full_name: String(body.name ?? "").trim() || undefined },
        redirectTo: `${site.replace(/\/$/, "")}/nova-senha`,
      });
      if (error || !data.user) return json({ error: `Não foi possível enviar o convite: ${error?.message ?? "erro desconhecido"}` }, 502);
      account = data.user;
      invited = true;
    }
    const name = String(body.name ?? "").trim();
    if (name) await admin.from("profiles").upsert({ id: account.id, full_name: name }, { onConflict: "id", ignoreDuplicates: true });

    const { data: existing } = await admin
      .from("user_roles")
      .select("id")
      .eq("user_id", account.id)
      .eq("role", role)
      .is("deleted_at", null)
      .maybeSingle();
    if (existing) return json({ error: "Essa pessoa já tem esse papel." }, 409);

    const { error: insertError } = await admin.from("user_roles").insert({
      user_id: account.id,
      role,
      championship_id: role === "admin" ? null : await championshipId(admin),
      expires_at: expiresAt ? expiresAt.toISOString() : null,
    });
    if (insertError) return json({ error: `Não foi possível dar o acesso: ${insertError.message}` }, 500);
    await admin.from("audit_events").insert({
      actor_id: caller.user.id,
      entity_type: "user_roles",
      entity_id: account.id,
      action: "grant",
      after_data: { role, email, expires_at: expiresAt?.toISOString() ?? null, invited },
    });
    return json({ ok: true, invited });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Falha ao dar o acesso." }, 500);
  }
}

async function loadRole(admin: SupabaseClient, roleId: string) {
  const { data } = await admin.from("user_roles").select("id,user_id,role,expires_at").eq("id", roleId).is("deleted_at", null).maybeSingle();
  return data;
}

export async function PATCH(request: Request) {
  const admin = adminClient();
  if (!admin) return json({ error: "Gestão de acessos indisponível." }, 503);
  const caller = await authorize(request, admin);
  if (caller instanceof Response) return caller;
  const body = (await request.json().catch(() => ({}))) as { roleId?: string; expiresAt?: string | null };
  const row = body.roleId ? await loadRole(admin, body.roleId) : null;
  if (!row) return json({ error: "Acesso não encontrado." }, 404);
  if (row.role === "admin" && !caller.isAdmin) return json({ error: "Só um administrador altera outro administrador." }, 403);
  const expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;
  if (expiresAt && (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() <= Date.now()))
    return json({ error: "A validade precisa ser uma data futura." }, 400);
  if (row.user_id === caller.user.id && row.role === "admin" && expiresAt)
    return json({ error: "Você não pode pôr prazo no seu próprio acesso de administrador." }, 400);
  const { error } = await admin
    .from("user_roles")
    .update({ expires_at: expiresAt ? expiresAt.toISOString() : null })
    .eq("id", row.id);
  if (error) return json({ error: error.message }, 500);
  await admin.from("audit_events").insert({
    actor_id: caller.user.id,
    entity_type: "user_roles",
    entity_id: row.user_id,
    action: "update",
    before_data: { role: row.role, expires_at: row.expires_at },
    after_data: { role: row.role, expires_at: expiresAt?.toISOString() ?? null },
  });
  return json({ ok: true });
}

export async function DELETE(request: Request) {
  const admin = adminClient();
  if (!admin) return json({ error: "Gestão de acessos indisponível." }, 503);
  const caller = await authorize(request, admin);
  if (caller instanceof Response) return caller;
  const body = (await request.json().catch(() => ({}))) as { roleId?: string };
  const row = body.roleId ? await loadRole(admin, body.roleId) : null;
  if (!row) return json({ error: "Acesso não encontrado." }, 404);
  if (row.role === "admin" && !caller.isAdmin) return json({ error: "Só um administrador remove outro administrador." }, 403);
  if (row.user_id === caller.user.id && row.role === "admin")
    return json({ error: "Você não pode remover o seu próprio acesso de administrador." }, 400);
  const { error } = await admin.from("user_roles").update({ deleted_at: new Date().toISOString() }).eq("id", row.id);
  if (error) return json({ error: error.message }, 500);
  await admin.from("audit_events").insert({
    actor_id: caller.user.id,
    entity_type: "user_roles",
    entity_id: row.user_id,
    action: "revoke",
    before_data: { role: row.role, expires_at: row.expires_at },
  });
  return json({ ok: true });
}
