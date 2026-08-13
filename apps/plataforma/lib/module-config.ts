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
  /**
   * Restringe as opções ao que pertence ao valor escolhido em outro campo do
   * formulário. Sessão só faz sentido dentro da etapa selecionada, e o banco
   * cobra isso com uma chave estrangeira composta.
   */
  dependsOn?: { field: string; column: string };
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
  /**
   * Campos que não podem ser preenchidos junto com este. O banco cobra alguns
   * desses pares com CHECK — um kart é de um piloto ou de uma equipe, nunca
   * dos dois — e sem aviso o formulário só devolve a recusa depois de salvar.
   */
  exclusiveWith?: string[];
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
  createOnly?: boolean;
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

// Sessão pertence a uma etapa: results e kart_assignments têm chave estrangeira
// composta (stage_id, session_id) -> sessions(stage_id, id). Sem o filtro, o
// formulário deixa escolher uma sessão de outra etapa e o insert falha com 409.
const sessionOfStage = (required = false): ModuleField => ({
  key: "session_id",
  label: "Sessão",
  kind: "relation",
  required,
  relation: {
    table: "sessions",
    labelColumn: "name",
    dependsOn: { field: "stage_id", column: "stage_id" },
  },
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
      { key: "proof_path", label: "Comprovante", kind: "file", storageBucket: "payment-proofs", accept: "image/jpeg,image/png,application/pdf" },
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
      sessionOfStage(),
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
    key: "entradas-resultado",
    label: "Entradas de resultado",
    description: "Classificação de cada piloto na sessão: posição, voltas, tempo, pole e volta mais rápida.",
    table: "result_entries",
    singular: "entrada",
    titleColumn: "position",
    orderBy: "position",
    fields: [
      relation("result_id", "Resultado", "results", "title"),
      relation("driver_id", "Piloto", "drivers", "sport_name"),
      { key: "position", label: "Posição", kind: "number", required: true },
      { key: "kart_number", label: "Número do kart", kind: "number" },
      { key: "laps", label: "Voltas completadas", kind: "number", required: true },
      { key: "total_time_ms", label: "Tempo total (ms)", kind: "number" },
      { key: "best_lap_ms", label: "Melhor volta (ms)", kind: "number" },
      { key: "penalty_ms", label: "Penalidade (ms)", kind: "number" },
      { key: "pole", label: "Pole position", kind: "checkbox" },
      { key: "fastest_lap", label: "Volta mais rápida", kind: "checkbox" },
      {
        key: "status",
        label: "Situação",
        kind: "select",
        required: true,
        options: statusOptions("classified", "not_classified", "disqualified", "did_not_start", "did_not_finish"),
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
      { key: "original_path", label: "Arquivo original", kind: "file", storageBucket: "timing-imports", accept: "application/pdf,text/csv" },
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
  {
    key: "responsaveis",
    label: "Responsáveis legais",
    description: "Vínculos de responsáveis com pilotos menores e homologação administrativa.",
    table: "guardian_links",
    singular: "vínculo",
    titleColumn: "relationship",
    orderBy: "created_at",
    ascending: false,
    fields: [
      relation("guardian_id", "Responsável", "profiles", "full_name"),
      relation("driver_id", "Piloto", "drivers", "sport_name"),
      { key: "relationship", label: "Parentesco / vínculo", kind: "text", required: true },
      { key: "status", label: "Situação", kind: "select", required: true, options: statusOptions("pending", "approved", "rejected", "revoked") },
      relation("approved_by", "Aprovado por", "profiles", "full_name", false),
      { key: "approved_at", label: "Data da aprovação", kind: "datetime" },
    ],
  },
  {
    key: "termos",
    label: "Termos e regulamentos",
    description: "Versões oficiais, vigência, obrigatoriedade e publicação.",
    table: "terms",
    singular: "termo",
    titleColumn: "title",
    orderBy: "created_at",
    ascending: false,
    fields: [
      relation("season_id", "Temporada", "seasons", "name"),
      { key: "kind", label: "Tipo", kind: "select", required: true, options: statusOptions("regulation", "responsibility", "image_authorization", "privacy", "guardian_authorization", "payment_policy", "other") },
      { key: "title", label: "Título", kind: "text", required: true },
      { key: "version", label: "Versão", kind: "number", required: true },
      { key: "content", label: "Conteúdo", kind: "textarea", required: true },
      { key: "required", label: "Obrigatório", kind: "checkbox" },
      { key: "status", label: "Situação", kind: "select", required: true, options: statusOptions("draft", "review", "published", "superseded", "archived") },
      { key: "effective_at", label: "Vigência", kind: "datetime" },
    ],
  },
  {
    key: "aceites",
    label: "Aceites",
    description: "Evidência de aceite por usuário, piloto ou responsável legal.",
    table: "term_acceptances",
    singular: "aceite",
    titleColumn: "accepted_at",
    orderBy: "accepted_at",
    ascending: false,
    createOnly: true,
    fields: [
      relation("term_id", "Termo", "terms", "title"),
      relation("user_id", "Signatário", "profiles", "full_name"),
      relation("driver_id", "Piloto representado", "drivers", "sport_name", false),
      { key: "accepted_at", label: "Aceito em", kind: "datetime", required: true },
      { key: "signature_path", label: "Assinatura", kind: "file", storageBucket: "signatures", accept: "image/jpeg,image/png,application/pdf" },
      { key: "metadata", label: "Metadados", kind: "json" },
    ],
  },
  {
    key: "mudancas-categoria",
    label: "Mudanças de categoria",
    description: "Solicitação, política de pontos, etapa de vigência e decisão.",
    table: "category_change_requests",
    singular: "mudança",
    titleColumn: "status",
    orderBy: "created_at",
    ascending: false,
    fields: [
      relation("season_id", "Temporada", "seasons", "name"),
      relation("driver_id", "Piloto", "drivers", "sport_name"),
      relation("from_category_id", "Categoria atual", "categories", "name", false),
      relation("to_category_id", "Nova categoria", "categories", "name"),
      relation("effective_stage_id", "Etapa de vigência", "stages", "title", false),
      { key: "points_policy", label: "Política de pontos", kind: "select", required: true, options: statusOptions("transfer", "zero", "convert", "maintain") },
      { key: "reason", label: "Justificativa", kind: "textarea", required: true },
      { key: "status", label: "Situação", kind: "select", required: true, options: statusOptions("draft", "submitted", "analysis", "approved", "rejected", "cancelled", "applied") },
    ],
  },
  {
    key: "sessoes",
    label: "Sessões",
    description: "Treinos, classificação, Super Pole, corrida e Endurance.",
    table: "sessions",
    singular: "sessão",
    titleColumn: "name",
    orderBy: "starts_at",
    fields: [
      relation("stage_id", "Etapa", "stages", "title"),
      relation("category_id", "Categoria", "categories", "name", false),
      { key: "name", label: "Nome", kind: "text", required: true },
      { key: "kind", label: "Tipo", kind: "select", required: true, options: statusOptions("practice", "qualifying", "super_pole", "race", "endurance") },
      { key: "starts_at", label: "Início", kind: "datetime" },
      { key: "status", label: "Situação", kind: "select", required: true, options: statusOptions("scheduled", "open", "live", "provisional", "homologated", "cancelled") },
    ],
  },
  {
    key: "checkin",
    label: "Check-in",
    description: "Presença, atraso, ausência, bloqueio e observações operacionais.",
    table: "checkins",
    singular: "check-in",
    titleColumn: "status",
    orderBy: "updated_at",
    ascending: false,
    fields: [
      relation("stage_id", "Etapa", "stages", "title"),
      relation("driver_id", "Piloto", "drivers", "sport_name"),
      { key: "status", label: "Situação", kind: "select", required: true, options: statusOptions("expected", "present", "late", "absent", "excused", "blocked") },
      { key: "checked_in_at", label: "Horário", kind: "datetime" },
      relation("checked_in_by", "Registrado por", "profiles", "full_name", false),
      { key: "notes", label: "Observações", kind: "textarea" },
    ],
  },
  {
    key: "karts",
    label: "Karts e sorteio",
    description: "Kart por piloto ou equipe, confirmação, alteração e devolução.",
    table: "kart_assignments",
    singular: "atribuição",
    titleColumn: "kart_number",
    orderBy: "kart_number",
    fields: [
      relation("stage_id", "Etapa", "stages", "title"),
      sessionOfStage(),
      { ...relation("driver_id", "Piloto", "drivers", "sport_name", false), exclusiveWith: ["team_id"] },
      { ...relation("team_id", "Equipe", "endurance_teams", "name", false), exclusiveWith: ["driver_id"] },
      { key: "kart_number", label: "Número do kart", kind: "number", required: true },
      { key: "status", label: "Situação", kind: "select", required: true, options: statusOptions("assigned", "confirmed", "changed", "returned", "cancelled") },
      { key: "notes", label: "Observações", kind: "textarea" },
    ],
  },
  {
    key: "pontuacao",
    label: "Regras de pontuação",
    description: "Tabela por formato, bônus, versão e ativação.",
    table: "points_rules",
    singular: "regra",
    titleColumn: "event_format",
    orderBy: "version",
    ascending: false,
    fields: [
      relation("season_id", "Temporada", "seasons", "name"),
      relation("category_id", "Categoria", "categories", "name", false),
      { key: "event_format", label: "Formato", kind: "select", required: true, options: statusOptions("regular", "endurance", "special") },
      { key: "position_points", label: "Pontos por posição", kind: "json", required: true },
      { key: "pole_points", label: "Bônus pole", kind: "number" },
      { key: "fastest_lap_points", label: "Bônus melhor volta", kind: "number" },
      { key: "active", label: "Ativa", kind: "checkbox" },
      { key: "version", label: "Versão", kind: "number", required: true },
    ],
  },
  {
    key: "voltas",
    label: "Voltas",
    description: "Volta a volta, tempo, velocidade, posição e validade.",
    table: "laps",
    singular: "volta",
    titleColumn: "lap_number",
    orderBy: "lap_number",
    fields: [
      relation("result_id", "Resultado", "results", "title"),
      relation("result_entry_id", "Entrada", "result_entries", "position"),
      relation("driver_id", "Piloto", "drivers", "sport_name"),
      { key: "lap_number", label: "Volta", kind: "number", required: true },
      { key: "lap_time_ms", label: "Tempo (ms)", kind: "number" },
      { key: "speed_kph", label: "Velocidade", kind: "number" },
      { key: "position", label: "Posição", kind: "number" },
      { key: "valid", label: "Válida", kind: "checkbox" },
      { key: "invalid_reason", label: "Motivo da invalidação", kind: "text" },
    ],
  },
  {
    key: "evidencias",
    label: "Evidências",
    description: "Fotos, vídeos, relatórios, testemunhos e documentos disciplinares.",
    table: "evidence",
    singular: "evidência",
    titleColumn: "evidence_type",
    orderBy: "created_at",
    ascending: false,
    fields: [
      relation("incident_id", "Ocorrência", "incidents", "incident_type"),
      { key: "evidence_type", label: "Tipo", kind: "select", required: true, options: statusOptions("photo", "video", "report", "witness", "document", "timing") },
      { key: "file_path", label: "Arquivo", kind: "file", storageBucket: "disciplinary-evidence", accept: "image/jpeg,image/png,application/pdf,video/mp4,video/webm" },
      { key: "statement", label: "Relato", kind: "textarea" },
      { key: "visibility", label: "Visibilidade", kind: "select", required: true, options: statusOptions("private", "involved", "committee", "public", "restricted") },
      { key: "content_hash", label: "Hash", kind: "text" },
    ],
  },
  {
    key: "membros-endurance",
    label: "Membros de equipes",
    description: "Capitão, titulares, reservas, convites e aprovação.",
    table: "endurance_members",
    singular: "membro",
    titleColumn: "member_role",
    orderBy: "created_at",
    fields: [
      relation("team_id", "Equipe", "endurance_teams", "name"),
      relation("driver_id", "Piloto", "drivers", "sport_name"),
      { key: "member_role", label: "Função", kind: "select", required: true, options: statusOptions("captain", "starter", "reserve") },
      { key: "status", label: "Situação", kind: "select", required: true, options: statusOptions("invited", "accepted", "declined", "approved") },
    ],
  },
  {
    key: "campanhas",
    label: "Campanhas de patrocinadores",
    description: "Aprovação, cupons, ativações, conteúdo e métricas.",
    table: "sponsor_campaigns",
    singular: "campanha",
    titleColumn: "title",
    orderBy: "created_at",
    ascending: false,
    fields: [
      relation("championship_id", "Campeonato", "championships", "name"),
      relation("sponsor_id", "Patrocinador", "sponsors", "name"),
      { key: "title", label: "Título", kind: "text", required: true },
      { key: "kind", label: "Tipo", kind: "select", required: true, options: statusOptions("promotion", "coupon", "banner", "lead_campaign", "event_activation", "content") },
      { key: "status", label: "Situação", kind: "select", required: true, options: statusOptions("draft", "approval", "adjustments", "approved", "scheduled", "published", "ended", "cancelled") },
      { key: "starts_at", label: "Início", kind: "datetime" },
      { key: "ends_at", label: "Fim", kind: "datetime" },
      { key: "coupon_code", label: "Cupom", kind: "text" },
      { key: "target_url", label: "Destino", kind: "text" },
      { key: "content", label: "Conteúdo", kind: "json" },
      { key: "metrics", label: "Métricas", kind: "json" },
    ],
  },
  {
    key: "versoes-conteudo",
    label: "Versões de conteúdo",
    description: "Histórico estruturado para revisão, restauração e publicação.",
    table: "cms_versions",
    singular: "versão",
    titleColumn: "version",
    orderBy: "version",
    ascending: false,
    fields: [
      relation("page_id", "Página", "cms_pages", "title"),
      { key: "version", label: "Versão", kind: "number", required: true },
      { key: "content", label: "Conteúdo", kind: "json", required: true },
      { key: "status", label: "Situação", kind: "select", required: true, options: statusOptions("draft", "review", "approved", "published", "archived") },
      relation("created_by", "Criado por", "profiles", "full_name", false),
    ],
  },
  {
    key: "usuarios-patrocinador",
    label: "Usuários de patrocinadores",
    description: "Vínculos, funções e situação dos acessos empresariais.",
    table: "sponsor_users",
    singular: "usuário de patrocinador",
    titleColumn: "member_role",
    orderBy: "created_at",
    ascending: false,
    fields: [
      relation("sponsor_id", "Patrocinador", "sponsors", "name"),
      relation("user_id", "Usuário", "profiles", "full_name"),
      { key: "member_role", label: "Função", kind: "select", required: true, options: statusOptions("owner", "manager", "analyst", "viewer") },
      { key: "status", label: "Situação", kind: "select", required: true, options: statusOptions("invited", "active", "suspended", "revoked") },
    ],
  },
  {
    key: "permissoes",
    label: "Permissões granulares",
    description: "Escopo por papel, categoria, etapa, sessão, módulo e ação.",
    table: "role_permissions",
    singular: "permissão",
    titleColumn: "module",
    orderBy: "created_at",
    ascending: false,
    fields: [
      relation("user_role_id", "Papel", "user_roles", "role"),
      relation("category_id", "Categoria", "categories", "name", false),
      relation("stage_id", "Etapa", "stages", "title", false),
      sessionOfStage(),
      { key: "module", label: "Módulo", kind: "text", required: true },
      { key: "action", label: "Ação", kind: "select", required: true, options: statusOptions("read", "create", "update", "delete", "approve", "publish", "homologate", "export", "manage") },
      { key: "allowed", label: "Permitida", kind: "checkbox" },
      { key: "expires_at", label: "Expiração", kind: "datetime" },
    ],
  },
];

export const moduleConfigByKey = new Map(moduleConfigs.map((module) => [module.key, module]));

export function getModuleConfig(key: string): ModuleConfig | undefined {
  return moduleConfigByKey.get(key);
}
