export type FieldKind =
  | "text"
  | "textarea"
  | "number"
  | "currency"
  | "datetime"
  | "date"
  | "select"
  | "relation"
  | "checkbox"
  | "json"
  | "file";

export type SelectOption = {
  label: string;
  value: string;
};

export type RelationConfig = {
  table: string;
  labelColumn: string;
  valueColumn?: string;
  filters?: Record<string, string | number | boolean>;
};

export type ModuleField = {
  key: string;
  label: string;
  kind: FieldKind;
  required?: boolean;
  readOnly?: boolean;
  placeholder?: string;
  options?: SelectOption[];
  relation?: RelationConfig;
  storageBucket?: string;
  accept?: string;
};

export type ModuleAction = {
  key: string;
  label: string;
  rpc: string;
  parameterMap: Record<string, string>;
  confirmation: string;
};

export type ModuleConfig = {
  key: string;
  label: string;
  description: string;
  table: string;
  singular: string;
  titleColumn: string;
  orderBy?: string;
  ascending?: boolean;
  fields: ModuleField[];
  readOnly?: boolean;
  actions?: ModuleAction[];
};

const statusOptions = (...values: string[]): SelectOption[] =>
  values.map((value) => ({
    value,
    label: value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()),
  }));

const relation = (
  key: string,
  label: string,
  table: string,
  labelColumn: string,
  required = true,
): ModuleField => ({
  key,
  label,
  kind: "relation",
  required,
  relation: { table, labelColumn },
});

export const moduleConfigs: ModuleConfig[] = [
  {
    key: "pilotos",
    label: "Pilotos",
    description: "Cadastro esportivo, categoria, número e homologação pública.",
    table: "drivers",
    singular: "piloto",
    titleColumn: "sport_name",
    orderBy: "sport_name",
    fields: [
      relation("season_id", "Temporada", "seasons", "name"),
      relation("category_id", "Categoria", "categories", "name", false),
      { key: "full_name", label: "Nome completo", kind: "text", required: true },
      { key: "sport_name", label: "Nome esportivo", kind: "text", required: true },
      { key: "slug", label: "Slug público", kind: "text", required: true },
      { key: "number", label: "Número", kind: "number", required: true },
      {
        key: "status",
        label: "Situação",
        kind: "select",
        required: true,
        options: statusOptions("pending", "approved", "suspended", "archived"),
      },
      { key: "public_profile", label: "Perfil público", kind: "checkbox" },
    ],
  },
  {
    key: "inscricoes",
    label: "Inscrições",
    description: "Temporada, etapas, categoria solicitada e homologação.",
    table: "registrations",
    singular: "inscrição",
    titleColumn: "protocol",
    orderBy: "created_at",
    ascending: false,
    fields: [
      relation("driver_id", "Piloto", "drivers", "sport_name"),
      relation("stage_id", "Etapa", "stages", "title", false),
      {
        key: "kind",
        label: "Tipo",
        kind: "select",
        required: true,
        options: statusOptions("season", "regular", "endurance"),
      },
      relation("requested_category_id", "Categoria solicitada", "categories", "name", false),
      relation("approved_category_id", "Categoria aprovada", "categories", "name", false),
      {
        key: "status",
        label: "Situação",
        kind: "select",
        required: true,
        options: statusOptions(
          "draft",
          "submitted",
          "documents_pending",
          "payment_pending",
          "analysis",
          "approved",
          "rejected",
          "cancelled",
          "homologated",
        ),
      },
      { key: "amount_cents", label: "Valor", kind: "currency", required: true },
    ],
  },
  {
    key: "documentos",
    label: "Documentos",
    description: "Arquivos privados, validade, análise e solicitação de correção.",
    table: "documents",
    singular: "documento",
    titleColumn: "document_type",
    orderBy: "created_at",
    ascending: false,
    fields: [
      relation("driver_id", "Piloto", "drivers", "sport_name"),
      {
        key: "document_type",
        label: "Tipo",
        kind: "select",
        required: true,
        options: statusOptions(
          "identity",
          "profile_photo",
          "responsibility_term",
          "image_authorization",
          "guardian_document",
          "guardian_authorization",
          "other",
        ),
      },
      {
        key: "file_path",
        label: "Arquivo",
        kind: "file",
        required: true,
        storageBucket: "private-documents",
        accept: "image/jpeg,image/png,application/pdf",
      },
      {
        key: "status",
        label: "Situação",
        kind: "select",
        required: true,
        options: statusOptions(
          "submitted",
          "analysis",
          "approved",
          "rejected",
          "correction_requested",
          "archived",
        ),
      },
      { key: "rejection_reason", label: "Motivo / orientação", kind: "textarea" },
      { key: "valid_until", label: "Validade", kind: "date" },
    ],
  },
  {
    key: "financeiro",
    label: "Financeiro",
    description: "Cobranças PIX, comprovantes, análise, aprovação e reembolso.",
    table: "payments",
    singular: "pagamento",
    titleColumn: "status",
    orderBy: "created_at",
    ascending: false,
    fields: [
      relation("registration_id", "Inscrição", "registrations", "protocol"),
      { key: "amount_cents", label: "Valor", kind: "currency", required: true },
      {
        key: "status",
        label: "Situação",
        kind: "select",
        required: true,
        options: statusOptions(
          "pending",
          "proof_sent",
          "analysis",
          "approved",
          "rejected",
          "refunded",
          "cancelled",
        ),
      },
      { key: "proof_path", label: "Caminho do comprovante", kind: "text" },
    ],
  },
  {
    key: "creditos",
    label: "Créditos",
    description: "Carteira interna, origem, validade e saldo disponível.",
    table: "credits",
    singular: "crédito",
    titleColumn: "origin",
    orderBy: "created_at",
    ascending: false,
    fields: [
      relation("driver_id", "Piloto", "drivers", "sport_name"),
      { key: "amount_cents", label: "Valor original", kind: "currency", required: true },
      { key: "remaining_cents", label: "Saldo", kind: "currency", required: true },
      {
        key: "origin",
        label: "Origem",
        kind: "select",
        required: true,
        options: statusOptions(
          "cancellation",
          "refund",
          "overpayment",
          "courtesy",
          "award",
          "adjustment",
          "transfer",
        ),
      },
      {
        key: "status",
        label: "Situação",
        kind: "select",
        required: true,
        options: statusOptions("available", "reserved", "used", "expired", "cancelled", "transferred"),
      },
      { key: "expires_at", label: "Expiração", kind: "datetime" },
      { key: "notes", label: "Observações", kind: "textarea" },
    ],
  },
  {
    key: "calendario",
    label: "Calendário",
    description: "Etapas, formato, traçado, data e situação operacional.",
    table: "stages",
    singular: "etapa",
    titleColumn: "title",
    orderBy: "starts_at",
    fields: [
      relation("season_id", "Temporada", "seasons", "name"),
      { key: "title", label: "Título", kind: "text", required: true },
      {
        key: "format",
        label: "Formato",
        kind: "select",
        required: true,
        options: statusOptions("regular", "endurance", "special"),
      },
      { key: "track", label: "Traçado", kind: "text", required: true },
      { key: "starts_at", label: "Início", kind: "datetime", required: true },
      {
        key: "status",
        label: "Situação",
        kind: "select",
        required: true,
        options: statusOptions(
          "scheduled",
          "registration",
          "live",
          "provisional",
          "homologated",
          "cancelled",
        ),
      },
    ],
  },
  {
    key: "resultados",
    label: "Resultados",
    description: "Sessões, versões, homologação, melhor volta e publicação.",
    table: "results",
    singular: "resultado",
    titleColumn: "title",
    orderBy: "created_at",
    ascending: false,
    fields: [
      relation("stage_id", "Etapa", "stages", "title"),
      relation("category_id", "Categoria", "categories", "name", false),
      { key: "title", label: "Título", kind: "text", required: true },
      {
        key: "status",
        label: "Situação",
        kind: "select",
        required: true,
        options: statusOptions("draft", "analysis", "provisional", "homologated", "published", "rectified"),
      },
      { key: "version", label: "Versão", kind: "number", required: true },
      { key: "fastest_lap_ms", label: "Melhor volta (ms)", kind: "number" },
      { key: "published_at", label: "Publicação", kind: "datetime" },
    ],
    actions: [
      {
        key: "points",
        label: "Calcular pontos",
        rpc: "recalculate_result_points",
        parameterMap: { p_result_id: "id" },
        confirmation: "Recalcular os pontos de todas as posições deste resultado?",
      },
    ],
  },
  {
    key: "classificacao",
    label: "Classificação",
    description: "Versões oficiais, pontos, vitórias, pódios e posições.",
    table: "standings",
    singular: "posição",
    titleColumn: "position",
    orderBy: "position",
    readOnly: true,
    fields: [
      relation("season_id", "Temporada", "seasons", "name"),
      relation("category_id", "Categoria", "categories", "name"),
      relation("driver_id", "Piloto", "drivers", "sport_name"),
      { key: "position", label: "Posição", kind: "number" },
      { key: "points", label: "Pontos", kind: "number" },
      { key: "gross_points", label: "Pontos brutos", kind: "number" },
      { key: "wins", label: "Vitórias", kind: "number" },
      { key: "podiums", label: "Pódios", kind: "number" },
      { key: "version", label: "Versão", kind: "number" },
      { key: "status", label: "Situação", kind: "text" },
    ],
  },
  {
    key: "importacoes",
    label: "Importações",
    description: "Arquivos de cronometragem, origem, hash e diagnóstico.",
    table: "import_batches",
    singular: "importação",
    titleColumn: "original_filename",
    orderBy: "created_at",
    ascending: false,
    fields: [
      relation("stage_id", "Etapa", "stages", "title"),
      relation("result_id", "Resultado", "results", "title", false),
      {
        key: "source",
        label: "Origem",
        kind: "select",
        required: true,
        options: statusOptions("email", "forwarded_email", "manual_pdf", "manual_csv"),
      },
      { key: "original_filename", label: "Arquivo", kind: "text" },
      { key: "original_path", label: "Caminho privado", kind: "text" },
      { key: "content_hash", label: "Hash", kind: "text" },
      {
        key: "status",
        label: "Situação",
        kind: "select",
        required: true,
        options: statusOptions("received", "processing", "review", "imported", "duplicate", "failed", "rejected"),
      },
      { key: "confidence", label: "Confiança (%)", kind: "number" },
      { key: "diagnostics", label: "Diagnóstico", kind: "json" },
    ],
  },
  {
    key: "ocorrencias",
    label: "Ocorrências",
    description: "Registro de pista, gravidade, volta, cláusula e encaminhamento.",
    table: "incidents",
    singular: "ocorrência",
    titleColumn: "incident_type",
    orderBy: "occurred_at",
    ascending: false,
    fields: [
      relation("stage_id", "Etapa", "stages", "title"),
      relation("driver_id", "Piloto", "drivers", "sport_name", false),
      relation("team_id", "Equipe", "endurance_teams", "name", false),
      { key: "incident_type", label: "Tipo", kind: "text", required: true },
      {
        key: "severity",
        label: "Gravidade",
        kind: "select",
        required: true,
        options: statusOptions("low", "medium", "high", "critical"),
      },
      { key: "description", label: "Descrição", kind: "textarea", required: true },
      { key: "occurred_at", label: "Momento", kind: "datetime", required: true },
      { key: "lap_number", label: "Volta", kind: "number" },
      { key: "regulation_clause", label: "Cláusula", kind: "text" },
      {
        key: "status",
        label: "Situação",
        kind: "select",
        required: true,
        options: statusOptions(
          "draft",
          "registered",
          "triage",
          "analysis",
          "awaiting_evidence",
          "judgment",
          "archived",
          "converted",
          "closed",
        ),
      },
    ],
  },
  {
    key: "julgamentos",
    label: "Penalidades",
    description: "Decisão, efeito esportivo, visibilidade e recursos.",
    table: "penalties",
    singular: "penalidade",
    titleColumn: "code",
    orderBy: "created_at",
    ascending: false,
    fields: [
      relation("stage_id", "Etapa", "stages", "title"),
      relation("driver_id", "Piloto", "drivers", "sport_name", false),
      { key: "code", label: "Código", kind: "text", required: true },
      { key: "summary", label: "Resumo", kind: "textarea", required: true },
      { key: "effect", label: "Efeito", kind: "text", required: true },
      {
        key: "status",
        label: "Situação",
        kind: "select",
        required: true,
        options: statusOptions("draft", "provisional", "homologated", "appealed", "annulled", "closed"),
      },
      {
        key: "public_visibility",
        label: "Visibilidade",
        kind: "select",
        required: true,
        options: statusOptions("private", "effect", "summary", "full"),
      },
    ],
  },
  {
    key: "recursos",
    label: "Recursos",
    description: "Protocolo, manifestação, análise e decisão final.",
    table: "appeals",
    singular: "recurso",
    titleColumn: "protocol",
    orderBy: "created_at",
    ascending: false,
    fields: [
      relation("penalty_id", "Penalidade", "penalties", "code"),
      relation("driver_id", "Piloto", "drivers", "sport_name"),
      { key: "statement", label: "Manifestação", kind: "textarea", required: true },
      {
        key: "status",
        label: "Situação",
        kind: "select",
        required: true,
        options: statusOptions("filed", "triage", "analysis", "awaiting_evidence", "granted", "denied", "closed"),
      },
    ],
  },
  {
    key: "endurance",
    label: "Equipes Endurance",
    description: "Equipes, categoria, número e homologação.",
    table: "endurance_teams",
    singular: "equipe",
    titleColumn: "name",
    orderBy: "name",
    fields: [
      relation("stage_id", "Etapa", "stages", "title"),
      relation("category_id", "Categoria", "categories", "name", false),
      { key: "name", label: "Nome", kind: "text", required: true },
      { key: "number", label: "Número", kind: "number" },
      {
        key: "status",
        label: "Situação",
        kind: "select",
        required: true,
        options: statusOptions("forming", "analysis", "homologated", "rejected", "cancelled", "disqualified"),
      },
    ],
  },
  {
    key: "stints",
    label: "Stints",
    description: "Sequência, piloto, entrada, saída, voltas e validação.",
    table: "stints",
    singular: "stint",
    titleColumn: "sequence",
    orderBy: "sequence",
    fields: [
      relation("team_id", "Equipe", "endurance_teams", "name"),
      relation("driver_id", "Piloto", "drivers", "sport_name"),
      { key: "sequence", label: "Sequência", kind: "number", required: true },
      { key: "started_at", label: "Entrada", kind: "datetime" },
      { key: "ended_at", label: "Saída", kind: "datetime" },
      { key: "laps", label: "Voltas", kind: "number" },
      {
        key: "status",
        label: "Situação",
        kind: "select",
        required: true,
        options: statusOptions("planned", "requested", "confirmed", "running", "closed", "corrected", "invalid"),
      },
    ],
  },
  {
    key: "conteudo",
    label: "Conteúdo",
    description: "Páginas estruturadas, revisão, agendamento e publicação.",
    table: "cms_pages",
    singular: "página",
    titleColumn: "title",
    orderBy: "updated_at",
    ascending: false,
    fields: [
      relation("championship_id", "Campeonato", "championships", "name"),
      { key: "slug", label: "Slug", kind: "text", required: true },
      { key: "title", label: "Título", kind: "text", required: true },
      { key: "content", label: "Blocos JSON", kind: "json", required: true },
      {
        key: "status",
        label: "Situação",
        kind: "select",
        required: true,
        options: statusOptions("draft", "review", "approved", "scheduled", "published", "archived"),
      },
      { key: "published_at", label: "Publicação", kind: "datetime" },
    ],
  },
  {
    key: "patrocinadores",
    label: "Patrocinadores",
    description: "Marca, categoria comercial, links e ativação pública.",
    table: "sponsors",
    singular: "patrocinador",
    titleColumn: "name",
    orderBy: "name",
    fields: [
      relation("championship_id", "Campeonato", "championships", "name"),
      { key: "name", label: "Nome", kind: "text", required: true },
      { key: "slug", label: "Slug", kind: "text", required: true },
      { key: "logo_url", label: "Logo", kind: "text" },
      { key: "website_url", label: "Site", kind: "text" },
      { key: "tier", label: "Categoria comercial", kind: "text", required: true },
      { key: "status", label: "Situação", kind: "text", required: true },
    ],
  },
  {
    key: "notificacoes",
    label: "Notificações",
    description: "Avisos críticos e mensagens internas por usuário.",
    table: "notifications",
    singular: "notificação",
    titleColumn: "title",
    orderBy: "created_at",
    ascending: false,
    fields: [
      relation("user_id", "Usuário", "profiles", "full_name"),
      { key: "title", label: "Título", kind: "text", required: true },
      { key: "body", label: "Mensagem", kind: "textarea", required: true },
      { key: "kind", label: "Tipo", kind: "text", required: true },
    ],
  },
  {
    key: "configuracoes",
    label: "Categorias",
    description: "Categorias e identidade esportiva da temporada.",
    table: "categories",
    singular: "categoria",
    titleColumn: "name",
    orderBy: "name",
    fields: [
      relation("season_id", "Temporada", "seasons", "name"),
      { key: "slug", label: "Slug", kind: "text", required: true },
      { key: "name", label: "Nome", kind: "text", required: true },
      { key: "color", label: "Cor", kind: "text", required: true },
      { key: "status", label: "Situação", kind: "text", required: true },
    ],
  },
];

export const moduleConfigByKey = new Map(moduleConfigs.map((module) => [module.key, module]));

export function getModuleConfig(key: string): ModuleConfig | undefined {
  return moduleConfigByKey.get(key);
}
