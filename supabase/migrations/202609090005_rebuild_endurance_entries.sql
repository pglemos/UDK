-- Completa a reconstrução da Endurance que foi parcialmente materializada
-- pela migration 004. As versões v2 por categoria permanecem preservadas como
-- auditoria; o portal publica somente o resultado geral abaixo.

set statement_timeout = '30s';

do $$
declare
  target_result_id uuid;
begin
  select result.id
  into target_result_id
  from public.results result
  where result.external_racing_id = 2026081801
    and result.category_id is null
    and result.version = 1
    and result.deleted_at is null
  order by result.updated_at desc, result.id desc
  limit 1;

  if target_result_id is null then
    raise exception 'combined Endurance result not found';
  end if;

  -- Esconde o rascunho incompleto e o volta a volta que apontava para ele.
  update public.laps lap
  set deleted_at = coalesce(lap.deleted_at, now())
  where lap.result_id = target_result_id
    and lap.deleted_at is null;

  update public.result_entries entry
  set deleted_at = coalesce(entry.deleted_at, now()),
      updated_at = now()
  where entry.result_id = target_result_id
    and entry.deleted_at is null;
end
$$;

-- As posições das versões v2 já refletem a classificação oficial por voltas e
-- tempo. Reordena novamente para manter a regra explícita e independente de
-- qualquer posição de categoria persistida na origem.
with source_rows as (
  select
    source_entry.*,
    row_number() over (
      order by
        (source_entry.status = 'classified') desc,
        source_entry.laps desc,
        (coalesce(source_entry.total_time_ms, 0) + coalesce(source_entry.penalty_ms, 0)) asc,
        source_result.id,
        source_entry.id
    )::integer as general_position
  from public.result_entries source_entry
  join public.results source_result
    on source_result.id = source_entry.result_id
  join public.stages source_stage
    on source_stage.id = source_result.stage_id
   and source_stage.deleted_at is null
  join public.seasons source_season
    on source_season.id = source_stage.season_id
   and source_season.deleted_at is null
  join public.championships source_championship
    on source_championship.id = source_season.championship_id
   and source_championship.deleted_at is null
  where source_championship.slug = 'udk'
    and source_season.year = 2026
    and (source_stage.starts_at at time zone 'America/Sao_Paulo')::date = date '2026-08-18'
    and source_result.external_racing_id in (2026081801, 2026081802)
    and source_result.version = 2
    and source_result.category_id is not null
), target as (
  select result.id as result_id
  from public.results result
  join public.stages stage
    on stage.id = result.stage_id
   and stage.deleted_at is null
  where result.external_racing_id = 2026081801
    and result.category_id is null
    and result.version = 1
    and result.deleted_at is null
), source_distinct as (
  select distinct on (source_rows.driver_id)
    source_rows.*
  from source_rows
  order by source_rows.driver_id, source_rows.id desc
)
insert into public.result_entries (
  result_id, driver_id, position, kart_number, laps, total_time_ms, best_lap_ms,
  penalty_ms, pole, fastest_lap, status, external_competitor_id,
  best_pit, penalty_points, timing_adjustment_laps, sporting_note
)
select
  target.result_id,
  source_rows.driver_id,
  source_rows.general_position,
  source_rows.kart_number,
  source_rows.laps,
  source_rows.total_time_ms,
  source_rows.best_lap_ms,
  source_rows.penalty_ms,
  source_rows.pole,
  source_rows.fastest_lap,
  source_rows.status,
  source_rows.external_competitor_id,
  source_rows.best_pit,
  source_rows.penalty_points,
  source_rows.timing_adjustment_laps,
  source_rows.sporting_note
from target
cross join source_distinct source_rows
where not exists (
  select 1
  from public.result_entries existing
  where existing.result_id = target.result_id
    and existing.driver_id = source_rows.driver_id
    and existing.deleted_at is null
);

-- Copia novamente todas as voltas das duas fontes v2 para as novas entradas
-- gerais, sem apagar as linhas antigas nem duplicar uma volta ativa.
with target as (
  select result.id as result_id
  from public.results result
  where result.external_racing_id = 2026081801
    and result.category_id is null
    and result.version = 1
    and result.deleted_at is null
), source_scope as (
  select distinct on (source_entry.driver_id)
    source_result.id as source_result_id,
    source_entry.id as source_entry_id,
    source_entry.driver_id,
    target.result_id
  from public.result_entries source_entry
  join public.results source_result
    on source_result.id = source_entry.result_id
  cross join target
  join public.stages source_stage
    on source_stage.id = source_result.stage_id
   and source_stage.deleted_at is null
  join public.seasons source_season
    on source_season.id = source_stage.season_id
   and source_season.deleted_at is null
  join public.championships source_championship
    on source_championship.id = source_season.championship_id
   and source_championship.deleted_at is null
  where source_championship.slug = 'udk'
    and source_season.year = 2026
    and (source_stage.starts_at at time zone 'America/Sao_Paulo')::date = date '2026-08-18'
    and source_result.external_racing_id in (2026081801, 2026081802)
    and source_result.version = 2
    and source_result.category_id is not null
  order by source_entry.driver_id, source_entry.id desc
), new_entries as (
  select
    source_scope.source_result_id,
    source_scope.source_entry_id,
    source_scope.driver_id,
    source_scope.result_id,
    entry.id as new_entry_id
  from source_scope
  join public.result_entries entry
    on entry.result_id = source_scope.result_id
   and entry.driver_id = source_scope.driver_id
   and entry.deleted_at is null
)
insert into public.laps (
  result_id, result_entry_id, driver_id, lap_number, lap_time_ms,
  elapsed_time_ms, speed_kph, position, valid, invalid_reason
)
select
  new_entries.result_id,
  new_entries.new_entry_id,
  lap.driver_id,
  lap.lap_number,
  lap.lap_time_ms,
  lap.elapsed_time_ms,
  lap.speed_kph,
  lap.position,
  lap.valid,
  lap.invalid_reason
from public.laps lap
join new_entries
  on new_entries.source_entry_id = lap.result_entry_id
 and new_entries.source_result_id = lap.result_id
where lap.deleted_at is null
  and not exists (
    select 1
    from public.laps existing
    where existing.result_entry_id = new_entries.new_entry_id
      and existing.lap_number = lap.lap_number
      and existing.deleted_at is null
  );

-- Publica a nova versão dos standings por categoria, mantendo as versões
-- anteriores para auditoria e aplicando os descartes já definidos na regra.
do $$
declare
  v_season_id uuid;
  v_category_id uuid;
  v_admin_id uuid;
begin
  select user_id
  into v_admin_id
  from public.user_roles
  where role = 'admin'
    and (expires_at is null or expires_at > now())
  limit 1;

  if v_admin_id is null then
    raise exception 'no active admin available for standings recalculation';
  end if;

  perform set_config('request.jwt.claim.sub', v_admin_id::text, true);

  select season.id
  into v_season_id
  from public.seasons season
  join public.championships championship
    on championship.id = season.championship_id
  where championship.slug = 'udk'
    and season.year = 2026;

  for v_category_id in
    select category.id
    from public.categories category
    where category.season_id = v_season_id
      and category.deleted_at is null
  loop
    perform public.recalculate_standings(v_season_id, v_category_id);
  end loop;
end
$$;
