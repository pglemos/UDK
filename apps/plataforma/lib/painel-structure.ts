/**
 * Estrutura única do painel: áreas do menu, abas de cada área, papéis e o que cada papel
 * vê e edita. Menu, rotas, permissões e a matriz de papéis leem daqui.
 *
 * Rota: /painel/<área>/<aba>. A primeira aba de cada área abre em /painel/<área>.
 * As chaves de módulo (module) continuam sendo as usadas em role_permissions.module.
 */

export type Role =
  | "admin"
  | "organization"
  | "judge"
  | "marshal"
  | "finance"
  | "editor"
  | "sponsor"
  | "driver"
  | "guardian";

export const roleOrder: Role[] = [
  "admin",
  "organization",
  "judge",
  "marshal",
  "finance",
  "editor",
  "sponsor",
  "driver",
  "guardian",
];

export const roleLabels: Record<Role, string> = {
  admin: "Administrador",
  organization: "Organização",
  judge: "Comissão julgadora",
  marshal: "Direção de prova",
  finance: "Financeiro",
  editor: "Editor do site",
  sponsor: "Patrocinador",
  driver: "Piloto",
  guardian: "Responsável legal",
};

export const roleDescriptions: Record<Role, string> = {
  admin: "Acesso total, inclusive dar e tirar acesso de administradores.",
  organization: "Comissão organizadora: opera todo o campeonato e gerencia a equipe, exceto administradores.",
  judge: "Analisa lances, aplica penalidades e homologa resultados (Art. 4º e 23).",
  marshal: "Conduz a etapa: credenciamento, sorteio de karts e registro de ocorrências.",
  finance: "Confere pagamentos de inscrição e de etapa e lança créditos.",
  editor: "Publica notícias e cuida dos patrocinadores no site.",
  sponsor: "Vê as próprias campanhas e os acessos da sua marca.",
  driver: "Vê os próprios dados, inscrições, resultados e pode abrir recurso.",
  guardian: "Acompanha e autoriza a participação do piloto menor de idade.",
};

/** Papéis da equipe (operam o campeonato) × papéis de participantes. */
export const staffRoles: Role[] = ["admin", "organization", "judge", "marshal", "finance", "editor"];

export type PanelTab = { module: string; slug: string; label: string };
export type PanelSection = {
  key: string;
  label: string;
  icon: string;
  description: string;
  tabs: PanelTab[];
};

export const panelSections: PanelSection[] = [
  {
    key: "inicio",
    label: "Início",
    icon: "home",
    description: "Primeiros passos, pendências e a próxima etapa.",
    tabs: [{ module: "dashboard", slug: "", label: "Visão geral" }],
  },
  {
    key: "pilotos",
    label: "Pilotos",
    icon: "users",
    description: "Cadastro, inscrições, documentos e categoria de cada piloto.",
    tabs: [
      { module: "pilotos", slug: "", label: "Cadastro" },
      { module: "inscricoes", slug: "inscricoes", label: "Inscrições" },
      { module: "documentos", slug: "documentos", label: "Documentos" },
      { module: "mudancas-categoria", slug: "categoria", label: "Mudança de categoria" },
      { module: "responsaveis", slug: "responsaveis", label: "Responsáveis" },
    ],
  },
  {
    key: "etapas",
    label: "Etapas",
    icon: "calendar",
    description: "Calendário, corridas, presença e sorteio de karts.",
    tabs: [
      { module: "calendario", slug: "", label: "Calendário" },
      { module: "checkin", slug: "credenciamento", label: "Credenciamento" },
      { module: "karts", slug: "karts", label: "Karts" },
    ],
  },
  {
    key: "resultados",
    label: "Resultados",
    icon: "flag",
    description: "Resultados oficiais, posições, volta a volta e importações da cronometragem.",
    tabs: [
      { module: "resultados", slug: "", label: "Resultados" },
      { module: "entradas-resultado", slug: "posicoes", label: "Posições" },
      { module: "voltas", slug: "voltas", label: "Voltas" },
      { module: "importacoes", slug: "importacoes", label: "Importações" },
    ],
  },
  {
    key: "classificacao",
    label: "Classificação",
    icon: "trophy",
    description: "Classificação vigente e regras de pontuação.",
    tabs: [
      { module: "classificacao", slug: "", label: "Classificação" },
      { module: "pontuacao", slug: "pontuacao", label: "Regras de pontuação" },
    ],
  },
  {
    key: "disciplina",
    label: "Disciplina",
    icon: "gavel",
    description: "Penalidades, ocorrências de pista, evidências e recursos.",
    tabs: [
      { module: "julgamentos", slug: "", label: "Penalidades" },
      { module: "ocorrencias", slug: "ocorrencias", label: "Ocorrências" },
      { module: "evidencias", slug: "evidencias", label: "Evidências" },
      { module: "recursos", slug: "recursos", label: "Recursos" },
    ],
  },
  {
    key: "financeiro",
    label: "Financeiro",
    icon: "money",
    description: "Pagamentos de inscrição e de etapa e créditos dos pilotos.",
    tabs: [
      { module: "financeiro", slug: "", label: "Pagamentos" },
      { module: "creditos", slug: "creditos", label: "Créditos" },
    ],
  },
  {
    key: "site",
    label: "Site",
    icon: "site",
    description: "Notícias, patrocinadores, campanhas e avisos.",
    tabs: [
      { module: "conteudo", slug: "", label: "Notícias" },
      { module: "patrocinadores", slug: "patrocinadores", label: "Patrocinadores" },
      { module: "usuarios-patrocinador", slug: "acesso-patrocinadores", label: "Acesso de patrocinadores" },
      { module: "campanhas", slug: "campanhas", label: "Campanhas" },
      { module: "notificacoes", slug: "avisos", label: "Avisos" },
    ],
  },
  {
    key: "configuracoes",
    label: "Configurações",
    icon: "settings",
    description: "Campeonato, temporada, categorias, regulamento e exportação de dados.",
    tabs: [
      { module: "campeonato", slug: "", label: "Campeonato e temporada" },
      { module: "configuracoes", slug: "categorias", label: "Categorias" },
      { module: "termos", slug: "regulamento", label: "Regulamento e termos" },
      { module: "relatorios", slug: "exportar", label: "Exportar dados" },
    ],
  },
  {
    key: "acessos",
    label: "Equipe e acessos",
    icon: "shield",
    description: "Quem acessa o painel, com qual papel e até quando.",
    tabs: [
      { module: "equipe", slug: "", label: "Pessoas" },
      { module: "papeis", slug: "papeis", label: "Papéis e permissões" },
    ],
  },
];

/** Módulos que só aparecem dentro de outra tela (sem aba própria). */
export const embeddedModules = ["sessoes", "aceites", "versoes-conteudo", "permissoes"] as const;

export const allModuleKeys: string[] = [
  ...panelSections.flatMap((section) => section.tabs.map((tab) => tab.module)),
  ...embeddedModules,
];

export function moduleHref(module: string): string {
  for (const section of panelSections) {
    const tab = section.tabs.find((item) => item.module === module);
    if (!tab) continue;
    if (section.key === "inicio") return "/painel";
    return tab.slug ? `/painel/${section.key}/${tab.slug}` : `/painel/${section.key}`;
  }
  return "/painel";
}

export function resolveRoute(slug: string[] | undefined): { section: PanelSection; tab: PanelTab } | null {
  const [sectionKey = "inicio", tabSlug = ""] = slug ?? [];
  const section = panelSections.find((item) => item.key === sectionKey);
  if (!section || (slug?.length ?? 0) > 2) return null;
  const tab = section.tabs.find((item) => item.slug === tabSlug);
  return tab ? { section, tab } : null;
}

/** Quem vê cada módulo (leitura). Administrador e organização veem tudo. */
export const roleAccess: Record<Role, string[]> = {
  admin: allModuleKeys,
  organization: allModuleKeys,
  judge: [
    "dashboard", "pilotos", "calendario", "sessoes", "resultados", "entradas-resultado", "classificacao",
    "pontuacao", "importacoes", "voltas", "ocorrencias", "evidencias", "julgamentos", "recursos",
    "relatorios", "notificacoes",
  ],
  marshal: [
    "dashboard", "calendario", "sessoes", "pilotos", "checkin", "karts", "ocorrencias", "evidencias",
    "notificacoes",
  ],
  finance: ["dashboard", "pilotos", "inscricoes", "financeiro", "creditos", "relatorios", "notificacoes"],
  editor: [
    "dashboard", "conteudo", "versoes-conteudo", "patrocinadores", "usuarios-patrocinador", "campanhas",
    "notificacoes",
  ],
  sponsor: ["dashboard", "patrocinadores", "usuarios-patrocinador", "campanhas", "notificacoes"],
  driver: [
    "dashboard", "inscricoes", "documentos", "termos", "aceites", "mudancas-categoria", "financeiro",
    "creditos", "calendario", "sessoes", "checkin", "karts", "resultados", "entradas-resultado",
    "classificacao", "voltas", "recursos", "notificacoes",
  ],
  guardian: [
    "dashboard", "pilotos", "responsaveis", "inscricoes", "documentos", "termos", "aceites",
    "mudancas-categoria", "financeiro", "creditos", "calendario", "sessoes", "checkin", "karts",
    "resultados", "entradas-resultado", "classificacao", "voltas", "julgamentos", "recursos", "notificacoes",
  ],
};

/** Quem edita cada módulo. */
export const writableModulesByRole: Record<Role, string[]> = {
  admin: allModuleKeys,
  organization: allModuleKeys,
  judge: [
    "resultados", "entradas-resultado", "classificacao", "pontuacao", "importacoes", "voltas", "ocorrencias",
    "evidencias", "julgamentos", "recursos",
  ],
  marshal: ["sessoes", "checkin", "karts", "ocorrencias", "evidencias"],
  finance: ["financeiro", "creditos"],
  editor: ["conteudo", "versoes-conteudo", "patrocinadores", "usuarios-patrocinador", "campanhas", "notificacoes"],
  sponsor: [],
  driver: ["inscricoes", "documentos", "aceites", "mudancas-categoria", "recursos"],
  guardian: ["inscricoes", "documentos", "aceites", "mudancas-categoria", "recursos"],
};
