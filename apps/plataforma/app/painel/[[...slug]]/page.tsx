"use client";

import { use, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  CalendarDays,
  ChevronRight,
  CircleDollarSign,
  Cloud,
  CloudOff,
  Flag,
  Gavel,
  Globe,
  House,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  Trophy,
  Users,
  X,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { OfficialLogo } from "../../../components/race/official-logo";
import { getSupabaseProjectUrl, supabase } from "../../../lib/supabase";
import { getModuleConfig } from "../../../lib/module-config";
import { createOfflineQueueOwner, getOfflineQueue } from "../../../lib/offline-queue";
import {
  computeAllowedModules,
  computeWritableModules,
  type RoleGrant,
  type RolePermission,
} from "../../../lib/access-control";
import {
  panelSections,
  resolveRoute,
  roleAccess,
  roleLabels,
  writableModulesByRole,
  type PanelSection,
  type Role,
} from "../../../lib/painel-structure";
import { ModuleCrud } from "../../../components/module-crud";
import { PilotCrud } from "../../../components/pilot-crud";
import { Dashboard } from "../../../components/dashboard";
import { ReportsPanel } from "../../../components/reports-panel";
import { KartsPanel } from "../../../components/painel/karts-panel";
import { CheckinPanel } from "../../../components/painel/checkin-panel";
import { SponsorsPanel } from "../../../components/painel/sponsors-panel";
import { StandingsPanel } from "../../../components/painel/standings-panel";
import { PointsRulesPanel } from "../../../components/painel/points-rules-panel";
import { LapsPanel } from "../../../components/painel/laps-panel";
import { PositionsMatrix } from "../../../components/painel/positions-matrix";
import { ResultsPanel } from "../../../components/painel/results-panel";
import { NewsPanel } from "../../../components/painel/news-panel";
import { ChampionshipSettings } from "../../../components/painel/championship-settings";
import { TeamAccessPanel } from "../../../components/painel/team-access-panel";
import { RolesMatrix } from "../../../components/painel/roles-matrix";

const sectionIcons: Record<string, LucideIcon> = {
  home: House,
  users: Users,
  calendar: CalendarDays,
  flag: Flag,
  trophy: Trophy,
  gavel: Gavel,
  money: CircleDollarSign,
  site: Globe,
  settings: Settings,
  shield: ShieldCheck,
};

type ModuleCount = { total: number; tom: "quiet" | "normal" | "warning" | "danger" };

/** Subtítulo das abas que não têm cadastro genérico por trás. */
const customTabDescriptions: Record<string, string> = {
  calendario: "Datas, formato e traçado de cada etapa da temporada.",
  karts: "Melhor volta e ritmo de cada kart, por campeonato ou por corrida.",
  resultados: "Cada tomada de tempo e corrida, com resultado oficial e volta a volta em PDF.",
  "entradas-resultado": "Pontos de cada piloto em cada corrida, pela chegada geral.",
  classificacao: "Classificação vigente de cada categoria, com descartes.",
  pontuacao: "Pontos por posição e bônus de cada formato, conforme o regulamento.",
  conteudo: "Notícias publicadas no site, com capa e texto.",
  patrocinadores: "Logos, links e quais marcas aparecem no site.",
  campeonato: "Nome, cor, temporada e situação do campeonato.",
  configuracoes: "Categorias da temporada e o que vale para cada uma.",
  termos: "Regulamento e termos em vigor, e quem já aceitou.",
  relatorios: "Baixe os dados do campeonato em planilha (CSV).",
  equipe: "Quem acessa o painel e com qual papel.",
  papeis: "O que cada papel pode ver e alterar em cada área.",
};

const countClass: Record<ModuleCount["tom"], string> = {
  quiet: "count count-quiet",
  normal: "count",
  warning: "count count-warning",
  danger: "count count-danger",
};

function initials(value: string): string {
  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function sectionHref(section: PanelSection): string {
  return section.key === "inicio" ? "/painel" : `/painel/${section.key}`;
}

export default function OperationsPage({ params }: { params: Promise<{ slug?: string[] }> }) {
  const resolvedParams = use(params);
  const route = resolveRoute(resolvedParams.slug);
  const activeModule = route?.tab.module ?? "";
  const router = useRouter();
  const client = useMemo(() => supabase(), []);
  const projectUrl = useMemo(() => getSupabaseProjectUrl(), []);
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User>();
  const [displayName, setDisplayName] = useState("Usuário UDK");
  const [roles, setRoles] = useState<Role[]>([]);
  const [roleGrants, setRoleGrants] = useState<RoleGrant[]>([]);
  const [permissions, setPermissions] = useState<RolePermission[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [online, setOnline] = useState(true);
  const [offlineCount, setOfflineCount] = useState(0);
  const [moduleCounts, setModuleCounts] = useState<Record<string, ModuleCount>>({});
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    if (!sidebarOpen) return;
    const navigation = document.getElementById("operations-navigation");
    const content = document.querySelector<HTMLElement>(".operations-main");
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    if (content) content.inert = true;
    navigation?.querySelector<HTMLElement>(".mobile-close")?.focus();

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSidebarOpen(false);
      if (event.key !== "Tab") return;
      const controls = navigation?.querySelectorAll<HTMLElement>("a[href], button");
      const first = controls?.[0];
      const last = controls?.[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = previousOverflow;
      if (content) content.inert = false;
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, [sidebarOpen]);

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
        router.replace("/login");
        return;
      }

      const authenticatedUser = sessionData.session.user;
      setUser(authenticatedUser);

      const [profileResult, rolesResult] = await Promise.all([
        activeClient.from("profiles").select("full_name,sport_name").eq("id", authenticatedUser.id).maybeSingle(),
        activeClient.from("user_roles").select("id,role,expires_at").eq("user_id", authenticatedUser.id).is("deleted_at", null),
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
        setAuthError("Esta conta ainda não tem acesso ao painel. Peça à organização do campeonato para liberar o seu acesso.");
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
        setAuthError(
          permissionError ? `Não foi possível validar as permissões: ${permissionError.message}` : "Sessão encerrada.",
        );
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
      if (event === "SIGNED_OUT") router.replace("/login");
    });
    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, [client, router]);

  const allowedKeys = useMemo(() => computeAllowedModules(roleAccess, roleGrants, permissions), [permissions, roleGrants]);
  const writableKeys = useMemo(
    () => computeWritableModules(writableModulesByRole, roleGrants, permissions),
    [permissions, roleGrants],
  );
  const offlineOwner = useMemo(
    () => (client && user && projectUrl ? createOfflineQueueOwner(projectUrl, user.id) : undefined),
    [client, projectUrl, user],
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

  // Pendências por área: âmbar e vermelho pedem ação; cinza é só volume.
  useEffect(() => {
    if (!client || !user) return;
    let active = true;
    const contar = async (tabela: string, coluna?: string, valores?: string[]): Promise<number> => {
      let consulta = client.from(tabela).select("id", { count: "exact", head: true }).is("deleted_at", null);
      if (coluna && valores) consulta = consulta.in(coluna, valores);
      const { count } = await consulta;
      return count ?? 0;
    };
    void Promise.all([
      // mesmo critério da lista de pilotos: todo cadastro que não foi arquivado
      client
        .from("drivers")
        .select("id", { count: "exact", head: true })
        .is("deleted_at", null)
        .neq("status", "archived")
        .then(({ count }) => count ?? 0),
      contar("registrations", "status", ["submitted", "analysis", "documents_pending", "payment_pending"]),
      contar("documents", "status", ["pending"]),
      contar("payments", "status", ["pending", "under_review"]),
      contar("results", "status", ["provisional"]),
      contar("appeals", "status", ["open", "filed"]),
    ])
      .then(([pilotos, inscricoes, documentos, pagamentos, resultados, recursos]) => {
        if (!active) return;
        setModuleCounts({
          pilotos: { total: pilotos, tom: "quiet" },
          inscricoes: { total: inscricoes, tom: "warning" },
          documentos: { total: documentos, tom: "warning" },
          financeiro: { total: pagamentos, tom: "warning" },
          resultados: { total: resultados, tom: "danger" },
          recursos: { total: recursos, tom: "danger" },
        });
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [client, user]);

  const visibleSections = useMemo(
    () =>
      panelSections
        .map((section) => ({ ...section, tabs: section.tabs.filter((tab) => allowedKeys.has(tab.module)) }))
        .filter((section) => section.tabs.length > 0),
    [allowedKeys],
  );

  function sectionCount(section: PanelSection): ModuleCount | null {
    // área com pendência mostra a soma das pendências; Pilotos mostra o total de cadastros
    const counts = section.tabs.map((tab) => moduleCounts[tab.module]).filter(Boolean) as ModuleCount[];
    const urgent = counts.filter((count) => count.tom !== "quiet" && count.total > 0);
    if (urgent.length) {
      const tom = urgent.some((count) => count.tom === "danger") ? "danger" : "warning";
      return { total: urgent.reduce((sum, count) => sum + count.total, 0), tom };
    }
    return counts.find((count) => count.tom === "quiet" && count.total > 0) ?? null;
  }

  const activeSection = route ? visibleSections.find((section) => section.key === route.section.key) : undefined;
  const authorized = Boolean(route && allowedKeys.has(activeModule));
  const canMutate = writableKeys.has(activeModule);
  const config = getModuleConfig(activeModule);
  const effectiveConfig = config ? { ...config, readOnly: config.readOnly || !canMutate } : undefined;

  function crud(module: string): ReactNode {
    const moduleConfig = getModuleConfig(module);
    if (!moduleConfig || !offlineOwner || !client) return null;
    return (
      <ModuleCrud
        client={client}
        owner={offlineOwner}
        config={{ ...moduleConfig, readOnly: moduleConfig.readOnly || !writableKeys.has(module) }}
      />
    );
  }

  function embedded(module: string, title: string, description: string): ReactNode {
    if (!allowedKeys.has(module)) return null;
    const body = crud(module);
    if (!body) return null;
    return (
      <section className="embedded-module" aria-labelledby={`embedded-${module}`}>
        <header>
          <h2 id={`embedded-${module}`}>{title}</h2>
          <p>{description}</p>
        </header>
        {body}
      </section>
    );
  }

  function renderModule(): ReactNode {
    if (!client) return null;
    switch (activeModule) {
      case "dashboard":
        return <Dashboard client={client} allowedKeys={allowedKeys} />;
      case "pilotos":
        return <PilotCrud client={client} readOnly={!canMutate} />;
      case "calendario":
        return (
          <>
            {crud("calendario")}
            {embedded("sessoes", "Corridas de cada etapa", "Corridas, tomadas de tempo e horário de largada.")}
          </>
        );
      case "checkin":
        return <CheckinPanel client={client} readOnly={!canMutate} />;
      case "karts":
        return <KartsPanel client={client} />;
      case "voltas":
        return <LapsPanel client={client} />;
      case "resultados":
        return <ResultsPanel client={client} editor={canMutate ? crud("resultados") : null} />;
      case "entradas-resultado":
        return <PositionsMatrix client={client} editor={canMutate ? crud("entradas-resultado") : null} />;
      case "classificacao":
        return <StandingsPanel client={client} />;
      case "pontuacao":
        return <PointsRulesPanel client={client} editor={canMutate ? crud("pontuacao") : null} />;
      case "conteudo":
        return (
          <>
            <NewsPanel client={client} readOnly={!canMutate} />
            {embedded("versoes-conteudo", "Histórico de versões", "Revisões salvas das notícias publicadas.")}
          </>
        );
      case "patrocinadores":
        return <SponsorsPanel client={client} readOnly={!canMutate} />;
      case "campeonato":
        return <ChampionshipSettings client={client} readOnly={!canMutate} />;
      case "termos":
        return (
          <>
            {crud("termos")}
            {embedded("aceites", "Aceites dos pilotos", "Quem aceitou cada versão do regulamento e dos termos.")}
          </>
        );
      case "relatorios":
        return <ReportsPanel client={client} />;
      case "equipe":
        return <TeamAccessPanel client={client} currentUserId={user?.id ?? ""} isAdmin={roles.includes("admin")} />;
      case "papeis":
        return <RolesMatrix />;
      default:
        return config && offlineOwner ? (
          <ModuleCrud client={client} owner={offlineOwner} config={effectiveConfig ?? config} />
        ) : null;
    }
  }

  async function signOut() {
    if (client) await client.auth.signOut();
    router.replace("/login");
  }

  // atalhos do painel: "/" vai para a busca da tela, "N" abre o cadastro novo
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey || event.defaultPrevented) return;
      const target = event.target as HTMLElement | null;
      if (target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) return;
      if (document.querySelector("dialog[open], .modal-backdrop, .pilot-editor")) return;
      const content = document.querySelector(".content");
      if (!content) return;
      if (event.key === "/") {
        const search = content.querySelector<HTMLInputElement>(".search-box input");
        if (!search) return;
        event.preventDefault();
        search.focus();
      } else if (event.key === "n" || event.key === "N") {
        const create = content.querySelector<HTMLButtonElement>('[aria-keyshortcuts="N"]:not(:disabled)');
        if (!create) return;
        event.preventDefault();
        create.click();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  if (!ready) {
    return (
      <main className="loading-screen">
        <OfficialLogo variant="dark" width={140} />
        <div className="loading-line">
          <span />
        </div>
        <p>Carregando sua conta...</p>
      </main>
    );
  }

  if (!client || !user) {
    return (
      <main className="configuration-screen">
        <OfficialLogo variant="dark" width={140} />
        <h1>Acesso indisponível</h1>
        <p>{authError}</p>
        <Link href="/login">Voltar para o acesso</Link>
      </main>
    );
  }

  // a primeira aba leva o nome da seção; as demais, o nome da própria aba
  const heading = !route
    ? "Página não encontrada"
    : route.section.key === "inicio"
      ? "Início"
      : route.tab.slug
        ? route.tab.label
        : route.section.label;
  const description = route
    ? (customTabDescriptions[route.tab.module] ??
      (route.section.tabs.length > 1 ? getModuleConfig(route.tab.module)?.description : undefined) ??
      route.section.description)
    : "Este endereço não existe mais no painel.";

  return (
    <div className="shell">
      {sidebarOpen ? (
        <button className="mobile-overlay" aria-label="Fechar menu" onClick={() => setSidebarOpen(false)} />
      ) : null}
      <aside id="operations-navigation" className={sidebarOpen ? "sidebar sidebar-open" : "sidebar"}>
        <div className="sidebar-brand">
          <Link href="/" aria-label="Voltar ao portal UDK">
            <OfficialLogo variant="negative" width={128} />
          </Link>
          <button className="mobile-close" type="button" aria-label="Fechar navegação" onClick={() => setSidebarOpen(false)}>
            <X />
          </button>
        </div>

        <div className="context">
          <b>UDK • Temporada 2026</b>
        </div>

        <nav className="sidebar-navigation" aria-label="Áreas do painel">
          <div className="nav-group">
            {visibleSections.map((section) => {
              const Icon = sectionIcons[section.icon] ?? Settings;
              const count = sectionCount(section);
              return (
                <Link
                  className={route?.section.key === section.key ? "active" : ""}
                  aria-current={route?.section.key === section.key ? "page" : undefined}
                  href={sectionHref(section)}
                  key={section.key}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon size={18} />
                  {section.label}
                  {count ? (
                    <span className={countClass[count.tom]} title={count.tom === "quiet" ? `${count.total} no total` : `${count.total} aguardando ação`}>
                      {count.total}
                    </span>
                  ) : (
                    <ChevronRight size={15} />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="sidebar-user">
          <span className="avatar">{initials(displayName) || "UD"}</span>
          <div>
            <b>{displayName}</b>
            <small>{roles[0] ? roleLabels[roles[0]] : "Sem papel ativo"}</small>
          </div>
          <button type="button" title="Sair" aria-label="Sair" onClick={() => void signOut()}>
            <LogOut size={17} />
          </button>
        </div>
      </aside>

      <main className="operations-main">
        <header className="operations-header">
          <button
            className="mobile-menu"
            type="button"
            aria-label="Abrir navegação"
            aria-expanded={sidebarOpen}
            aria-controls="operations-navigation"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu />
          </button>
          <div>
            <small>Ultras do Kart</small>
            <b>{heading}</b>
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

        <section className="content" data-module={activeModule || "nao-encontrado"}>
          <div className="page-heading">
            <div>
              <h1>{heading}</h1>
              <p>{description}</p>
            </div>
            <div className="role-chips">
              {roles.map((role) => (
                <span key={role}>{roleLabels[role]}</span>
              ))}
            </div>
          </div>

          {activeSection && activeSection.tabs.length > 1 ? (
            <nav className="pv-tabs" aria-label={`Seções de ${activeSection.label}`}>
              {activeSection.tabs.map((tab) => {
                const href = tab.slug ? `/painel/${activeSection.key}/${tab.slug}` : sectionHref(activeSection);
                const current = tab.module === activeModule;
                const count = moduleCounts[tab.module];
                return (
                  <Link key={tab.module} href={href} className={current ? "is-active" : undefined} aria-current={current ? "page" : undefined}>
                    {tab.label}
                    {count && count.total > 0 && count.tom !== "quiet" ? (
                      <span className={countClass[count.tom]}>{count.total}</span>
                    ) : null}
                  </Link>
                );
              })}
            </nav>
          ) : null}

          {authError ? (
            <div className="alert alert-warning" role="alert">
              {authError}
            </div>
          ) : null}

          {!route ? (
            <div className="access-denied">
              <Settings />
              <h2>Página não encontrada</h2>
              <p>O painel foi reorganizado em áreas. Use o menu ao lado para chegar ao que precisa.</p>
              <Link href="/painel">Ir para o início</Link>
            </div>
          ) : !authorized ? (
            <div className="access-denied">
              <ShieldCheck />
              <h2>Sem acesso a esta área</h2>
              <p>O seu papel não inclui esta parte do painel. Fale com a organização se precisar dela.</p>
              <Link href="/painel">Voltar ao início</Link>
            </div>
          ) : (
            renderModule()
          )}
        </section>
      </main>
    </div>
  );
}
