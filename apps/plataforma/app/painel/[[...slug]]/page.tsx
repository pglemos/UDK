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
import { getOfflineQueue } from "../../../lib/offline-queue";
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [online, setOnline] = useState(true);
  const [offlineCount, setOfflineCount] = useState(0);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    setOnline(navigator.onLine);
    setOfflineCount(getOfflineQueue().length);

    const onlineHandler = () => setOnline(true);
    const offlineHandler = () => setOnline(false);
    const queueHandler = () => setOfflineCount(getOfflineQueue().length);
    window.addEventListener("online", onlineHandler);
    window.addEventListener("offline", offlineHandler);
    window.addEventListener("udk:offline-queue", queueHandler);

    return () => {
      window.removeEventListener("online", onlineHandler);
      window.removeEventListener("offline", offlineHandler);
      window.removeEventListener("udk:offline-queue", queueHandler);
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
        activeClient.from("user_roles").select("role").eq("user_id", authenticatedUser.id),
      ]);

      if (!active) return;

      if (profileResult.error) setAuthError(profileResult.error.message);
      if (rolesResult.error) setAuthError(rolesResult.error.message);

      const profile = profileResult.data;
      setDisplayName(profile?.sport_name || profile?.full_name || authenticatedUser.email || "Usuário UDK");
      const loadedRoles = (rolesResult.data ?? [])
        .map((item) => item.role as Role)
        .filter((role) => role in roleAccess);
      setRoles(loadedRoles.length > 0 ? loadedRoles : ["driver"]);
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

  const allowedKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const role of roles) {
      for (const key of roleAccess[role]) keys.add(key);
    }
    return keys;
  }, [roles]);

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
  const authorized = activeKey === "dashboard" || allowedKeys.has(activeKey);
  const canMutate = roles.some((role) => writableModulesByRole[role].includes(activeKey));
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
            <small>{roleLabels[roles[0] ?? "driver"]}</small>
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

          {authError ? <div className="alert alert-warning">{authError}</div> : null}

          {!authorized ? (
            <div className="access-denied">
              <ShieldAlert />
              <h2>Acesso não autorizado</h2>
              <p>Seu papel atual não possui permissão para abrir este módulo.</p>
              <Link href="/painel">Voltar ao painel</Link>
            </div>
          ) : activeKey === "dashboard" ? (
            <Dashboard client={client} />
          ) : activeKey === "relatorios" ? (
            <ReportsPanel client={client} />
          ) : config ? (
            <ModuleCrud client={client} config={effectiveConfig ?? config} />
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
