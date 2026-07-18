"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  Bell,
  BookOpenText,
  CalendarDays,
  ChevronRight,
  CircleDollarSign,
  ClipboardCheck,
  Cloud,
  CloudOff,
  FileCheck2,
  FileInput,
  FileSpreadsheet,
  Flag,
  Gauge,
  Gavel,
  HandCoins,
  LayoutGrid,
  LogOut,
  Menu,
  Settings,
  ShieldAlert,
  Sparkles,
  Timer,
  Trophy,
  Users,
  UsersRound,
  X,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../../../lib/supabase";
import { getModuleConfig } from "../../../lib/module-config";
import { createOfflineQueueOwner, getOfflineQueue } from "../../../lib/offline-queue";
import { computeAllowedModules, computeWritableModules, type RoleGrant, type RolePermission } from "../../../lib/access-control";
import { ModuleCrud } from "../../../components/module-crud";
import { Dashboard } from "../../../components/dashboard";
import { ReportsPanel } from "../../../components/reports-panel";

type Role =
  | "admin"
  | "organization"
  | "judge"
  | "marshal"
  | "finance"
  | "editor"
  | "sponsor"
  | "driver"
  | "guardian";

type NavigationItem = {
  key: string;
  label: string;
  icon: LucideIcon;
};

type NavigationGroup = {
  label: string;
  items: NavigationItem[];
};

const navigationGroups: NavigationGroup[] = [
  {
    label: "Visão geral",
    items: [{ key: "dashboard", label: "Painel", icon: Gauge }],
  },
  {
    label: "Campeonato",
    items: [
      { key: "pilotos", label: "Pilotos", icon: Users },
      { key: "inscricoes", label: "Inscrições", icon: ClipboardCheck },
      { key: "documentos", label: "Documentos", icon: FileCheck2 },
      { key: "responsaveis", label: "Responsáveis", icon: UsersRound },
      { key: "termos", label: "Termos", icon: BookOpenText },
      { key: "aceites", label: "Aceites", icon: FileCheck2 },
      { key: "mudancas-categoria", label: "Mudanças de categoria", icon: ClipboardCheck },
      { key: "calendario", label: "Calendário", icon: CalendarDays },
      { key: "sessoes", label: "Sessões", icon: CalendarDays },
      { key: "checkin", label: "Check-in", icon: ClipboardCheck },
      { key: "karts", label: "Karts", icon: Flag },
      { key: "financeiro", label: "Financeiro", icon: CircleDollarSign },
      { key: "creditos", label: "Créditos", icon: HandCoins },
    ],
  },
  {
    label: "Esportivo",
    items: [
      { key: "resultados", label: "Resultados", icon: Flag },
      { key: "classificacao", label: "Classificação", icon: Trophy },
      { key: "pontuacao", label: "Pontuação", icon: Trophy },
      { key: "importacoes", label: "Importações", icon: FileInput },
      { key: "voltas", label: "Voltas", icon: Timer },
      { key: "ocorrencias", label: "Ocorrências", icon: ShieldAlert },
      { key: "evidencias", label: "Evidências", icon: ShieldAlert },
      { key: "julgamentos", label: "Penalidades", icon: Gavel },
      { key: "recursos", label: "Recursos", icon: BookOpenText },
    ],
  },
  {
    label: "Endurance",
    items: [
      { key: "endurance", label: "Equipes", icon: UsersRound },
      { key: "membros-endurance", label: "Membros", icon: Users },
      { key: "stints", label: "Stints", icon: Sparkles },
    ],
  },
  {
    label: "Comunicação",
    items: [
      { key: "conteudo", label: "Conteúdo", icon: LayoutGrid },
      { key: "versoes-conteudo", label: "Versões", icon: BookOpenText },
      { key: "patrocinadores", label: "Patrocinadores", icon: Sparkles },
      { key: "usuarios-patrocinador", label: "Usuários de patrocinadores", icon: UsersRound },
      { key: "campanhas", label: "Campanhas", icon: Sparkles },
      { key: "notificacoes", label: "Notificações", icon: Bell },
      { key: "relatorios", label: "Relatórios", icon: FileSpreadsheet },
      { key: "configuracoes", label: "Configurações", icon: Settings },
      { key: "permissoes", label: "Permissões", icon: Settings },
    ],
  },
];

const allModuleKeys = navigationGroups.flatMap((group) => group.items.map((item) => item.key));

const roleAccess: Record<Role, string[]> = {
  admin: allModuleKeys,
  organization: allModuleKeys,
  judge: [
    "dashboard",
    "pilotos",
    "calendario",
    "sessoes",
    "resultados",
    "classificacao",
    "pontuacao",
    "importacoes",
    "voltas",
    "ocorrencias",
    "evidencias",
    "julgamentos",
    "recursos",
    "relatorios",
    "notificacoes",
  ],
  marshal: ["dashboard", "calendario", "sessoes", "pilotos", "checkin", "karts", "endurance", "membros-endurance", "stints", "ocorrencias", "evidencias", "notificacoes"],
  finance: ["dashboard", "inscricoes", "financeiro", "creditos", "relatorios", "notificacoes"],
  editor: ["dashboard", "conteudo", "versoes-conteudo", "patrocinadores", "usuarios-patrocinador", "campanhas", "notificacoes"],
  sponsor: ["dashboard", "patrocinadores", "usuarios-patrocinador", "campanhas", "notificacoes"],
  driver: [
    "dashboard",
    "inscricoes",
    "documentos",
    "termos",
    "aceites",
    "mudancas-categoria",
    "financeiro",
    "creditos",
    "calendario",
    "sessoes",
    "checkin",
    "karts",
    "resultados",
    "classificacao",
    "voltas",
    "recursos",
    "endurance",
    "notificacoes",
  ],
  guardian: [
    "dashboard",
    "pilotos",
    "responsaveis",
    "inscricoes",
    "documentos",
    "termos",
    "aceites",
    "mudancas-categoria",
    "financeiro",
    "creditos",
    "calendario",
    "sessoes",
    "checkin",
    "karts",
    "resultados",
    "classificacao",
    "voltas",
    "julgamentos",
    "recursos",
    "endurance",
    "notificacoes",
  ],
};

const writableModulesByRole: Record<Role, string[]> = {
  admin: allModuleKeys,
  organization: allModuleKeys,
  judge: ["resultados", "classificacao", "pontuacao", "importacoes", "voltas", "ocorrencias", "evidencias", "julgamentos", "recursos"],
  marshal: ["sessoes", "checkin", "karts", "endurance", "membros-endurance", "stints", "ocorrencias", "evidencias"],
  finance: ["financeiro", "creditos"],
  editor: ["conteudo", "versoes-conteudo", "patrocinadores", "usuarios-patrocinador", "campanhas", "notificacoes"],
  sponsor: [],
  driver: ["inscricoes", "documentos", "aceites", "mudancas-categoria", "recursos"],
  guardian: ["inscricoes", "documentos", "aceites", "mudancas-categoria", "recursos"],
};

const roleLabels: Record<Role, string> = {
  admin: "Administrador",
  organization: "Organização",
  judge: "Comissão julgadora",
  marshal: "Fiscal de pista",
  finance: "Financeiro",
  editor: "Editor",
  sponsor: "Patrocinador",
  driver: "Piloto",
  guardian: "Responsável legal",
};

function initials(value: string): string {
  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default function OperationsPage({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const resolvedParams = use(params);
  const activeKey = resolvedParams.slug?.[0] ?? "dashboard";
  const router = useRouter();
  const client = useMemo(() => supabase(), []);
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User>();
  const [displayName, setDisplayName] = useState("Usuário UDK");
  const [roles, setRoles] = useState<Role[]>([]);
  const [roleGrants, setRoleGrants] = useState<RoleGrant[]>([]);
  const [permissions, setPermissions] = useState<RolePermission[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [online, setOnline] = useState(true);
  const [offlineCount, setOfflineCount] = useState(0);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    setOnline(navigator.onLine);
    const onlineHandler = () => setOnline(true);
    const offlineHandler = () => setOnline(false);
    window.addEventListener("online", onlineHandler);
    window.addEventListener("offline", offlineHandler);
    return () => {
      window.removeEventListener("online", onlineHandler);
      window.removeEventListener("offline", offlineHandler);
    };
  }, []);

  useEffect(() => {
    if (!client) {
      setAuthError("Supabase ainda não conectado. Cadastre as variáveis do projeto antes de acessar o painel.");
      setReady(true);
      return;
    }

    const activeClient = client;
    let active = true;

    async function loadIdentity() {
      const { data: sessionData, error: sessionError } = await activeClient.auth.getSession();
      if (!active) return;

      if (sessionError || !sessionData.session) {
        router.replace("/");
        return;
      }

      const authenticatedUser = sessionData.session.user;
      setUser(authenticatedUser);

      const [profileResult, rolesResult] = await Promise.all([
        activeClient.from("profiles").select("full_name,sport_name").eq("id", authenticatedUser.id).maybeSingle(),
        activeClient
          .from("user_roles")
          .select("id,role,expires_at")
          .eq("user_id", authenticatedUser.id),
      ]);

      if (!active) return;

      if (profileResult.error) setAuthError(profileResult.error.message);
      if (rolesResult.error) {
        setRoles([]);
        setRoleGrants([]);
        setPermissions([]);
        setAuthError(`Não foi possível carregar as permissões: ${rolesResult.error.message}`);
        setReady(true);
        return;
      }

      const profile = profileResult.data;
      setDisplayName(profile?.sport_name || profile?.full_name || authenticatedUser.email || "Usuário UDK");
      const now = Date.now();
      const loadedGrants = (rolesResult.data ?? [])
        .filter((item) => !item.expires_at || new Date(item.expires_at).getTime() > now)
        .filter((item) => item.role in roleAccess)
        .map((item) => ({ id: String(item.id), role: item.role as Role }));

      if (loadedGrants.length === 0) {
        setRoles([]);
        setRoleGrants([]);
        setPermissions([]);
        setAuthError("Esta conta não possui papel ativo. Solicite a vinculação à organização do campeonato.");
        setReady(true);
        return;
      }

      const { data: permissionRows, error: permissionError } = await activeClient
        .from("role_permissions")
        .select("user_role_id,module,action,allowed,expires_at")
        .in("user_role_id", loadedGrants.map((grant) => grant.id))
        .is("deleted_at", null);

      if (!active || permissionError) {
        setRoles([]);
        setRoleGrants([]);
        setPermissions([]);
        setAuthError(permissionError ? `Não foi possível validar permissões granulares: ${permissionError.message}` : "Sessão encerrada.");
        setReady(true);
        return;
      }

      setRoleGrants(loadedGrants);
      setRoles(Array.from(new Set(loadedGrants.map((grant) => grant.role as Role))));
      setPermissions((permissionRows ?? []) as RolePermission[]);
      setReady(true);
    }

    void loadIdentity();
    const { data: subscription } = activeClient.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") router.replace("/");
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, [client, router]);

  const allowedKeys = useMemo(
    () => computeAllowedModules(roleAccess, roleGrants, permissions),
    [permissions, roleGrants],
  );
  const writableKeys = useMemo(
    () => computeWritableModules(writableModulesByRole, roleGrants, permissions),
    [permissions, roleGrants],
  );
  const offlineOwner = useMemo(
    () => (client && user ? createOfflineQueueOwner(client, user.id) : undefined),
    [client, user],
  );

  useEffect(() => {
    if (!offlineOwner) {
      setOfflineCount(0);
      return;
    }
    let active = true;
    const refreshQueueCount = async () => {
      const queue = await getOfflineQueue(offlineOwner);
      if (active) setOfflineCount(queue.length);
    };
    void refreshQueueCount();
    window.addEventListener("udk:offline-queue", refreshQueueCount);
    return () => {
      active = false;
      window.removeEventListener("udk:offline-queue", refreshQueueCount);
    };
  }, [offlineOwner]);

  const visibleGroups = useMemo(
    () =>
      navigationGroups
        .map((group) => ({ ...group, items: group.items.filter((item) => allowedKeys.has(item.key)) }))
        .filter((group) => group.items.length > 0),
    [allowedKeys],
  );

  const activeNavigationItem = navigationGroups
    .flatMap((group) => group.items)
    .find((item) => item.key === activeKey);
  const config = getModuleConfig(activeKey);
  const authorized = allowedKeys.has(activeKey);
  const canMutate = writableKeys.has(activeKey);
  const effectiveConfig = config ? { ...config, readOnly: config.readOnly || !canMutate } : undefined;

  async function signOut() {
    if (client) await client.auth.signOut();
    router.replace("/");
  }

  if (!ready) {
    return (
      <main className="loading-screen">
        <img src="/udk.svg" alt="UDK" />
        <div className="loading-line"><span /></div>
        <p>Validando conta e permissões...</p>
      </main>
    );
  }

  if (!client || !user) {
    return (
      <main className="configuration-screen">
        <img src="/udk.svg" alt="UDK" />
        <span className="eyebrow">Configuração necessária</span>
        <h1>Conecte o Supabase</h1>
        <p>{authError}</p>
        <Link href="/">Voltar para o acesso</Link>
      </main>
    );
  }

  return (
    <div className="shell">
      {sidebarOpen ? <button className="mobile-overlay" aria-label="Fechar menu" onClick={() => setSidebarOpen(false)} /> : null}
      <aside className={sidebarOpen ? "sidebar sidebar-open" : "sidebar"}>
        <div className="sidebar-brand">
          <img src="/udk.svg" alt="UDK" />
          <button className="mobile-close" type="button" onClick={() => setSidebarOpen(false)}>
            <X />
          </button>
        </div>

        <div className="context">
          <small>Contexto ativo</small>
          <b>UDK • Temporada 2026</b>
          <span>Operação oficial</span>
        </div>

        <nav className="sidebar-navigation">
          {visibleGroups.map((group) => (
            <div className="nav-group" key={group.label}>
              <span>{group.label}</span>
              {group.items.map((item) => {
                const Icon = item.icon;
                const href = item.key === "dashboard" ? "/painel" : `/painel/${item.key}`;
                return (
                  <Link
                    className={activeKey === item.key ? "active" : ""}
                    href={href}
                    key={item.key}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon size={18} />
                    {item.label}
                    <ChevronRight size={15} />
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="sidebar-user">
          <span className="avatar">{initials(displayName) || "UD"}</span>
          <div>
            <b>{displayName}</b>
            <small>{roles[0] ? roleLabels[roles[0]] : "Sem papel ativo"}</small>
          </div>
          <button type="button" title="Sair" onClick={() => void signOut()}>
            <LogOut size={17} />
          </button>
        </div>
      </aside>

      <main className="operations-main">
        <header className="operations-header">
          <button className="mobile-menu" type="button" onClick={() => setSidebarOpen(true)}>
            <Menu />
          </button>
          <div>
            <small>Ultras do Kart</small>
            <b>{activeNavigationItem?.label ?? "Operação"}</b>
          </div>
          <div className="header-status">
            <span className={online ? "connection-online" : "connection-offline"}>
              {online ? <Cloud size={17} /> : <CloudOff size={17} />}
              {online ? "Online" : "Offline"}
            </span>
            {offlineCount > 0 ? <span className="queue-count">{offlineCount} pendente(s)</span> : null}
            <span className="avatar header-avatar">{initials(displayName) || "UD"}</span>
          </div>
        </header>

        <section className="content">
          <div className="page-heading">
            <div>
              <span className="eyebrow">Temporada 2026</span>
              <h1>{activeNavigationItem?.label ?? "Operação"}</h1>
              <p>
                {activeKey === "dashboard"
                  ? "Visão consolidada do campeonato, prazos e pendências críticas."
                  : activeKey === "relatorios"
                    ? "Exportações respeitam o escopo e as permissões do usuário autenticado."
                    : config?.description ?? "Módulo operacional do campeonato UDK."}
              </p>
            </div>
            <div className="role-chips">
              {roles.map((role) => <span key={role}>{roleLabels[role]}</span>)}
            </div>
          </div>

          {authError ? <div className="alert alert-warning" role="alert">{authError}</div> : null}

          {!authorized ? (
            <div className="access-denied">
              <ShieldAlert />
              <h2>Acesso não autorizado</h2>
              <p>Seu papel atual não possui permissão para abrir este módulo.</p>
              <Link href="/painel">Voltar ao painel</Link>
            </div>
          ) : activeKey === "dashboard" ? (
            <Dashboard client={client} allowedKeys={allowedKeys} />
          ) : activeKey === "relatorios" ? (
            <ReportsPanel client={client} />
          ) : config && offlineOwner ? (
            <ModuleCrud client={client} owner={offlineOwner} config={effectiveConfig ?? config} />
          ) : (
            <div className="access-denied">
              <Settings />
              <h2>Módulo não encontrado</h2>
              <p>A rota informada não pertence à plataforma UDK.</p>
              <Link href="/painel">Voltar ao painel</Link>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
