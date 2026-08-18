-- LapTime Bridge: rastreabilidade de origem, idempotência e auditoria.
-- Integra resultados cronometrados pelo sistema LapTime do Kartódromo de Betim
-- com o campeonato UDK. Nenhum resultado é publicado automaticamente: tudo
-- chega como DRAFT e passa pelo fluxo de homologação do painel.

-- =============================================================================
-- 1. results: origem externa + id da corrida no LapTime (idempotência)
-- =============================================================================
alter table public.results
  add column if not exists source_system text,
  add column if not exists external_racing_id bigint,
  add column if not exists external_imported_at timestamptz;

-- Garante que cada corrida do LapTime gere no máximo um resultado ativo por
-- combinação (stage, category, session). O bridge atualiza (não duplica).
create unique index if not exists results_laptime_external_unique_idx
  on public.results (external_racing_id, stage_id, coalesce(category_id, '00000000-0000-0000-0000-000000000000'::uuid), coalesce(session_id, '00000000-0000-0000-0000-000000000000'::uuid))
  where source_system = 'laptime' and deleted_at is null;

-- =============================================================================
-- 2. result_entries: vínculo com o competidor original do LapTime
-- =============================================================================
alter table public.result_entries
  add column if not exists external_competitor_id bigint;

create unique index if not exists result_entries_result_external_competitor_idx
  on public.result_entries (result_id, external_competitor_id)
  where external_competitor_id is not null and deleted_at is null;

-- =============================================================================
-- 3. import_batches: nova origem 'laptime' (bridge automatizado)
-- =============================================================================
alter table public.import_batches
  drop constraint if exists import_batches_source_check;

alter table public.import_batches
  add constraint import_batches_source_check
  check (source in ('email', 'forwarded_email', 'manual_pdf', 'manual_csv', 'laptime'));