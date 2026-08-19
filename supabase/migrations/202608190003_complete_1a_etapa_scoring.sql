-- Retificacao completa da 1a etapa UDK 2026 (18/08/2026).
-- Fontes: resultado oficial LapTime, Super Pole, volta a volta e regulamento UDK.
-- A versao 1 permanece imutavel; a versao 2 registra a decisao esportiva retificada.

-- =============================================================================
-- 1. Pontuacao completa: melhor parada e penalidades em pontos
-- =============================================================================
alter table public.points_rules
  add column if not exists best_pit_points numeric(8,2) not null default 0;

alter table public.result_entries
  add column if not exists best_pit boolean not null default false,
  add column if not exists penalty_points numeric(8,2) not null default 0,
  add column if not exists timing_adjustment_laps integer not null default 0,
  add column if not exists sporting_note text;

alter table public.result_entries
  drop constraint if exists result_entries_penalty_points_nonnegative_check;
alter table public.result_entries
  add constraint result_entries_penalty_points_nonnegative_check
  check (penalty_points >= 0);

alter table public.result_entries
  drop constraint if exists result_entries_timing_adjustment_laps_check;
alter table public.result_entries
  add constraint result_entries_timing_adjustment_laps_check
  check (timing_adjustment_laps >= 0);

update public.points_rules rule
set
  best_pit_points = case when rule.event_format = 'endurance' then 10 else 0 end,
  updated_at = now()
from public.seasons season
join public.championships championship on championship.id = season.championship_id
where rule.season_id = season.id
  and championship.slug = 'udk'
  and season.year = 2026
  and rule.active
  and rule.deleted_at is null
  and rule.event_format in ('regular', 'endurance');

create or replace function public.apply_result_entry_points()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_rule public.points_rules%rowtype;
  base_points numeric(8,2);
begin
  selected_rule := public.resolve_result_points_rule(new.result_id);

  if selected_rule.id is null then
    raise exception 'active points rule not found for result %', new.result_id;
  end if;

  base_points := case
    when new.status = 'classified'
      then coalesce((selected_rule.position_points ->> new.position::text)::numeric, 0)
    else 0
  end;

  new.points :=
    base_points
    + case when new.pole then selected_rule.pole_points else 0 end
    + case when new.fastest_lap then selected_rule.fastest_lap_points else 0 end
    + case when new.best_pit then selected_rule.best_pit_points else 0 end
    - coalesce(new.penalty_points, 0);
  new.updated_at := now();
  return new;
end
$$;

revoke execute on function public.apply_result_entry_points() from public, anon, authenticated;

drop trigger if exists result_entries_auto_points on public.result_entries;
create trigger result_entries_auto_points
before insert or update of result_id, position, pole, fastest_lap, best_pit, penalty_points, status
on public.result_entries
for each row execute function public.apply_result_entry_points();

create or replace function public.recalculate_result_points(p_result_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_rule public.points_rules%rowtype;
  result_season_id uuid;
  updated_count integer;
begin
  select stage.season_id
  into result_season_id
  from public.results result
  join public.stages stage on stage.id = result.stage_id and stage.deleted_at is null
  where result.id = p_result_id and result.deleted_at is null;

  if result_season_id is null then raise exception 'result not found'; end if;
  if not public.can_judge_season(result_season_id) then raise exception 'permission denied'; end if;

  selected_rule := public.resolve_result_points_rule(p_result_id);
  if selected_rule.id is null then raise exception 'active points rule not found'; end if;

  update public.result_entries entry
  set
    points =
      case
        when entry.status = 'classified'
          then coalesce((selected_rule.position_points ->> entry.position::text)::numeric, 0)
        else 0
      end
      + case when entry.pole then selected_rule.pole_points else 0 end
      + case when entry.fastest_lap then selected_rule.fastest_lap_points else 0 end
      + case when entry.best_pit then selected_rule.best_pit_points else 0 end
      - coalesce(entry.penalty_points, 0),
    updated_at = now()
  where entry.result_id = p_result_id and entry.deleted_at is null;

  get diagnostics updated_count = row_count;
  return updated_count;
end
$$;

grant execute on function public.recalculate_result_points(uuid) to authenticated;

-- =============================================================================
-- 2. Permite versoes retificadas do mesmo Racing LapTime
-- =============================================================================
drop index if exists public.results_laptime_external_unique_idx;
create unique index results_laptime_external_unique_idx
  on public.results (
    external_racing_id,
    stage_id,
    coalesce(category_id, '00000000-0000-0000-0000-000000000000'::uuid),
    coalesce(session_id, '00000000-0000-0000-0000-000000000000'::uuid),
    version
  )
  where source_system = 'laptime' and deleted_at is null;

-- =============================================================================
-- 3. Cria os dois resultados v2 a partir da v1 publicada
-- =============================================================================
insert into public.results (
  stage_id, category_id, session_id, title, status, version,
  fastest_lap_ms, published_at, source_system, external_racing_id, external_imported_at
)
select
  original.stage_id,
  original.category_id,
  original.session_id,
  original.title || ' - retificado',
  'rectified',
  2,
  original.fastest_lap_ms,
  now(),
  original.source_system,
  original.external_racing_id,
  now()
from public.results original
join public.stages stage on stage.id = original.stage_id and stage.deleted_at is null
join public.seasons season on season.id = stage.season_id and season.deleted_at is null
join public.championships championship on championship.id = season.championship_id
where championship.slug = 'udk'
  and season.year = 2026
  and (stage.starts_at at time zone 'America/Sao_Paulo')::date = date '2026-08-18'
  and original.source_system = 'laptime'
  and original.external_racing_id in (2026081801, 2026081802)
  and original.version = 1
  and original.deleted_at is null
  and not exists (
    select 1 from public.results existing
    where existing.stage_id = original.stage_id
      and existing.category_id is not distinct from original.category_id
      and existing.session_id is not distinct from original.session_id
      and existing.version = 2
      and existing.deleted_at is null
  );

with originals as (
  select original_result.external_racing_id, original_entry.*
  from public.result_entries original_entry
  join public.results original_result
    on original_result.id = original_entry.result_id
   and original_result.version = 1
   and original_result.source_system = 'laptime'
   and original_result.external_racing_id in (2026081801, 2026081802)
   and original_result.deleted_at is null
  where original_entry.deleted_at is null
), rectified as (
  select id, external_racing_id
  from public.results
  where version = 2
    and status = 'rectified'
    and source_system = 'laptime'
    and external_racing_id in (2026081801, 2026081802)
    and deleted_at is null
)
insert into public.result_entries (
  result_id, driver_id, position, kart_number, laps, total_time_ms, best_lap_ms,
  penalty_ms, pole, fastest_lap, status, external_competitor_id,
  best_pit, penalty_points, timing_adjustment_laps, sporting_note
)
select
  rectified.id,
  original.driver_id,
  original.position,
  original.kart_number,
  original.laps,
  original.total_time_ms,
  original.best_lap_ms,
  original.penalty_ms,
  original.pole,
  original.fastest_lap,
  original.status,
  original.external_competitor_id,
  false,
  0,
  0,
  null
from originals original
join rectified on rectified.external_racing_id = original.external_racing_id
where not exists (
  select 1 from public.result_entries existing
  where existing.result_id = rectified.id
    and existing.driver_id = original.driver_id
    and existing.deleted_at is null
);

-- =============================================================================
-- 4. Bonus oficiais da etapa
-- =============================================================================
-- Pole geral da Super Pole: Andre Felisberto, 1:07.775 (+1).
update public.result_entries entry
set pole = (driver.slug = 'andre-felisberto')
from public.results result, public.drivers driver
where entry.result_id = result.id
  and driver.id = entry.driver_id
  and result.version = 2
  and result.status = 'rectified'
  and result.source_system = 'laptime'
  and result.external_racing_id in (2026081801, 2026081802)
  and entry.deleted_at is null;

-- Melhor volta geral: Arthur, 1:04.976 (+1).
update public.result_entries entry
set fastest_lap = (driver.slug = 'arthur-henrique')
from public.results result, public.drivers driver
where entry.result_id = result.id
  and driver.id = entry.driver_id
  and result.version = 2
  and result.status = 'rectified'
  and result.source_system = 'laptime'
  and result.external_racing_id in (2026081801, 2026081802)
  and entry.deleted_at is null;

-- Melhor parada valida: Lucas Rabelo, TV 05:00.007, somente 7 ms acima do minimo (+10).
update public.result_entries entry
set
  best_pit = true,
  sporting_note = concat_ws(' | ', nullif(entry.sporting_note, ''),
    'Melhor parada Endurance: TV 05:00.007, 7 ms acima do minimo (+10 pontos).')
from public.results result, public.drivers driver
where entry.result_id = result.id
  and driver.id = entry.driver_id
  and result.version = 2
  and result.status = 'rectified'
  and result.external_racing_id = 2026081801
  and driver.slug = 'lucas-rabelo'
  and entry.deleted_at is null;

-- =============================================================================
-- 5. Retificacao de cronometragem de Pedro Guilherme
-- =============================================================================
-- O TV 02:16.868 da volta reportada como 18 reuniu duas voltas pelo sensor/transponder.
-- Nao se inventam tempos individuais. O dado bruto permanece no volta a volta da v1.
update public.result_entries entry
set
  laps = 47,
  timing_adjustment_laps = 1,
  sporting_note = concat_ws(' | ', nullif(entry.sporting_note, ''),
    'Retificacao de cronometragem: TV 02:16.868 reuniu duas voltas; total oficial 47 voltas. Tempos individuais preservados sem estimativa.')
from public.results result, public.drivers driver
where entry.result_id = result.id
  and driver.id = entry.driver_id
  and result.version = 2
  and result.status = 'rectified'
  and result.external_racing_id = 2026081802
  and driver.slug = 'pedro-guilherme'
  and entry.deleted_at is null;

-- =============================================================================
-- 6. Bandeira preta/branca: +5 segundos e -10 pontos
-- =============================================================================
with flagged(driver_slug) as (
  values
    ('francisco-biuchi'::text),
    ('vitor-hugo'),
    ('rodrigo-boris'),
    ('pablo-fonseca'),
    ('wesley-cardoso'),
    ('fernando-godoy'),
    ('braulio-bonoto'),
    ('toninho-da-prata')
)
update public.result_entries entry
set
  penalty_ms = coalesce(entry.penalty_ms, 0) + 5000,
  penalty_points = 10,
  sporting_note = concat_ws(' | ', nullif(entry.sporting_note, ''),
    'Primeira bandeira preta/branca: +5 s e -10 pontos.')
from public.results result, public.drivers driver, flagged
where entry.result_id = result.id
  and driver.id = entry.driver_id
  and flagged.driver_slug = driver.slug
  and result.version = 2
  and result.status = 'rectified'
  and result.external_racing_id in (2026081801, 2026081802)
  and entry.deleted_at is null;

-- A penalidade de +5 s altera a ordem entre Bráulio e Lucca, ambos com 46 voltas.
-- Recalcula TODA a ordem dos classificados por voltas e tempo ajustado, evitando
-- tratar a posicao bruta LapTime como imutavel apos uma decisao desportiva.
update public.result_entries entry
set position = entry.position + 2000
from public.results result
where entry.result_id = result.id
  and result.version = 2
  and result.status = 'rectified'
  and result.external_racing_id in (2026081801, 2026081802)
  and entry.status = 'classified'
  and entry.deleted_at is null;

with ranked as (
  select
    entry.id,
    row_number() over (
      partition by entry.result_id
      order by entry.laps desc, (coalesce(entry.total_time_ms, 0) + coalesce(entry.penalty_ms, 0)) asc, entry.driver_id
    )::integer as new_position
  from public.result_entries entry
  join public.results result on result.id = entry.result_id
  where result.version = 2
    and result.status = 'rectified'
    and result.external_racing_id in (2026081801, 2026081802)
    and entry.status = 'classified'
    and entry.deleted_at is null
)
update public.result_entries entry
set position = ranked.new_position
from ranked
where entry.id = ranked.id;

-- =============================================================================
-- 7. Auditoria disciplinar. As -7 voltas de parada ja estao no resultado bruto.
-- =============================================================================
with stage_scope as (
  select stage.id as stage_id, season.id as season_id
  from public.stages stage
  join public.seasons season on season.id = stage.season_id and season.deleted_at is null
  join public.championships championship on championship.id = season.championship_id
  where championship.slug = 'udk'
    and season.year = 2026
    and (stage.starts_at at time zone 'America/Sao_Paulo')::date = date '2026-08-18'
    and stage.deleted_at is null
  limit 1
), flagged(driver_slug) as (
  values
    ('francisco-biuchi'::text), ('vitor-hugo'), ('rodrigo-boris'), ('pablo-fonseca'),
    ('wesley-cardoso'), ('fernando-godoy'), ('braulio-bonoto'), ('toninho-da-prata')
)
insert into public.penalties (stage_id, driver_id, code, summary, effect, status, public_visibility)
select
  scope.stage_id,
  driver.id,
  'BW-01',
  'Primeira bandeira preta/branca registrada no relatorio oficial da 1a etapa.',
  '+5 segundos no resultado e -10 pontos no campeonato.',
  'homologated',
  'full'
from stage_scope scope
join public.drivers driver on driver.season_id = scope.season_id
join flagged on flagged.driver_slug = driver.slug
where driver.deleted_at is null
  and not exists (
    select 1 from public.penalties existing
    where existing.stage_id = scope.stage_id
      and existing.driver_id = driver.id
      and existing.code = 'BW-01'
      and existing.deleted_at is null
  );

with stage_scope as (
  select stage.id as stage_id, season.id as season_id
  from public.stages stage
  join public.seasons season on season.id = stage.season_id and season.deleted_at is null
  join public.championships championship on championship.id = season.championship_id
  where championship.slug = 'udk'
    and season.year = 2026
    and (stage.starts_at at time zone 'America/Sao_Paulo')::date = date '2026-08-18'
    and stage.deleted_at is null
  limit 1
), pit(driver_slug, code, summary) as (
  values
    ('francisco-biuchi'::text, 'PIT-INVALID', 'Parada invalida 04:59.221; -7 voltas ja aplicadas pelo LapTime.'),
    ('vitor-hugo', 'PIT-INVALID', 'Parada invalida 04:59.335; -7 voltas ja aplicadas pelo LapTime.'),
    ('rodrigo-boris', 'PIT-INVALID', 'Parada invalida 04:59.796; -7 voltas ja aplicadas pelo LapTime.'),
    ('pablo-fonseca', 'PIT-INVALID', 'Parada invalida 04:59.720; -7 voltas ja aplicadas pelo LapTime.'),
    ('wesley-cardoso', 'PIT-INVALID', 'Parada invalida 04:59.959; -7 voltas ja aplicadas pelo LapTime.'),
    ('fernando-godoy', 'PIT-INVALID', 'Parada invalida 04:06.087; -7 voltas ja aplicadas pelo LapTime.'),
    ('braulio-bonoto', 'PIT-MISSING', 'Parada obrigatoria nao realizada; -7 voltas ja aplicadas pelo LapTime.')
)
insert into public.penalties (stage_id, driver_id, code, summary, effect, status, public_visibility)
select
  scope.stage_id, driver.id, pit.code, pit.summary,
  '-7 voltas, ja refletidas no resultado oficial LapTime.',
  'homologated', 'full'
from stage_scope scope
join public.drivers driver on driver.season_id = scope.season_id
join pit on pit.driver_slug = driver.slug
where driver.deleted_at is null
  and not exists (
    select 1 from public.penalties existing
    where existing.stage_id = scope.stage_id
      and existing.driver_id = driver.id
      and existing.code = pit.code
      and existing.deleted_at is null
  );

-- =============================================================================
-- 8. Copia o volta a volta bruto para a versao 2
-- =============================================================================
with original_laps as (
  select
    original_result.external_racing_id,
    lap.driver_id, lap.lap_number, lap.lap_time_ms, lap.elapsed_time_ms,
    lap.speed_kph, lap.position, lap.valid, lap.invalid_reason
  from public.laps lap
  join public.results original_result
    on original_result.id = lap.result_id
   and original_result.version = 1
   and original_result.source_system = 'laptime'
   and original_result.external_racing_id in (2026081801, 2026081802)
   and original_result.deleted_at is null
  where lap.deleted_at is null
), rectified_entries as (
  select
    result.external_racing_id, result.id as result_id,
    entry.id as result_entry_id, entry.driver_id
  from public.results result
  join public.result_entries entry on entry.result_id = result.id and entry.deleted_at is null
  where result.version = 2
    and result.status = 'rectified'
    and result.external_racing_id in (2026081801, 2026081802)
    and result.deleted_at is null
)
insert into public.laps (
  result_id, result_entry_id, driver_id, lap_number, lap_time_ms,
  elapsed_time_ms, speed_kph, position, valid, invalid_reason
)
select
  rectified.result_id, rectified.result_entry_id, original.driver_id,
  original.lap_number, original.lap_time_ms, original.elapsed_time_ms,
  original.speed_kph, original.position, original.valid, original.invalid_reason
from original_laps original
join rectified_entries rectified
  on rectified.external_racing_id = original.external_racing_id
 and rectified.driver_id = original.driver_id
where not exists (
  select 1 from public.laps existing
  where existing.result_entry_id = rectified.result_entry_id
    and existing.lap_number = original.lap_number
    and existing.deleted_at is null
);

-- =============================================================================
-- 9. Portal publico: mantem as colunas antigas e acrescenta a decomposicao esportiva
-- =============================================================================
create or replace view public.public_portal_result_entries
with (security_invoker = true)
as
select
  entry.id,
  entry.result_id,
  entry.position,
  entry.kart_number,
  entry.laps,
  entry.total_time_ms,
  entry.best_lap_ms,
  entry.penalty_ms,
  entry.points,
  entry.pole,
  entry.fastest_lap,
  entry.status,
  entry.created_at,
  driver.slug as driver_slug,
  driver.sport_name as driver_name,
  driver.number as driver_number,
  stage.title as stage_title,
  entry.best_pit,
  entry.penalty_points,
  entry.timing_adjustment_laps,
  entry.sporting_note
from public.result_entries entry
join public.results result
  on result.id = entry.result_id
 and result.deleted_at is null
 and result.status = any (array['provisional'::text, 'homologated'::text, 'published'::text, 'rectified'::text])
join public.drivers driver
  on driver.id = entry.driver_id
 and driver.deleted_at is null
 and driver.public_profile
join public.stages stage
  on stage.id = result.stage_id
 and stage.deleted_at is null
where entry.deleted_at is null;

grant select on public.public_portal_result_entries to anon, authenticated;

-- =============================================================================
-- 10. Regulamento operacional publicado: inclui Melhor Parada e preta/branca
-- =============================================================================
update public.terms term
set status = 'superseded', updated_at = now()
from public.seasons season
join public.championships championship on championship.id = season.championship_id
where term.season_id = season.id
  and season.year = 2026
  and championship.slug = 'udk'
  and term.kind = 'regulation'
  and term.status = 'published'
  and term.deleted_at is null;

with season_scope as (
  select season.id
  from public.seasons season
  join public.championships championship on championship.id = season.championship_id
  where season.year = 2026 and championship.slug = 'udk'
), next_version as (
  select season_scope.id as season_id, coalesce(max(term.version), 0) + 1 as version
  from season_scope
  left join public.terms term on term.season_id = season_scope.id and term.kind = 'regulation'
  group by season_scope.id
)
insert into public.terms (season_id, kind, title, version, content, required, status, effective_at)
select
  next_version.season_id,
  'regulation',
  'Regulamento esportivo UDK 2026 — 2º semestre',
  next_version.version,
  $regulation$
01. FORMATO E PONTUACAO
A temporada possui 08 resultados pontuaveis: 06 corridas regulares e 02 Endurances. A classificacao final considera os 06 melhores resultados, com ate 02 descartes.

02. CORRIDA REGULAR
P1 50; P2 45; P3 42; P4 40; P5 38; P6 37; e queda progressiva ate P42 1.

03. ENDURANCE
P1 150; P2 145; P3 142; P4 140; P5 138. A partir do P6, cai 01 ponto por posicao.

04. BONUS
Pole Position geral da tomada de tempo: +1 ponto. Melhor volta geral da corrida: +1 ponto. No Endurance, a Melhor Parada recebe +10 pontos. Melhor Parada e o menor TV valido igual ou superior a 05:00.000.

05. BANDEIRA PRETA/BRANCA
Na primeira advertencia registrada, aplica-se +05 segundos ao resultado e -10 pontos no campeonato.
$regulation$,
  true, 'published', now()
from next_version;

-- =============================================================================
-- 11. Nova versao da classificacao usando somente a versao mais recente de cada prova
-- =============================================================================
with season_scope as (
  select season.id as season_id, category.id as category_id
  from public.seasons season
  join public.championships championship on championship.id = season.championship_id
  join public.categories category on category.season_id = season.id
  where championship.slug = 'udk'
    and season.year = 2026
    and category.slug in ('insanos', 'rapidos')
), version_scope as (
  select
    scope.season_id, scope.category_id,
    coalesce(max(standing.version), 0) + 1 as next_version
  from season_scope scope
  left join public.standings standing
    on standing.season_id = scope.season_id
   and standing.category_id = scope.category_id
   and standing.deleted_at is null
  group by scope.season_id, scope.category_id
), latest_results as (
  select distinct on (
    stage.season_id, result.category_id, result.stage_id,
    coalesce(result.session_id, '00000000-0000-0000-0000-000000000000'::uuid)
  )
    stage.season_id, result.category_id, result.id as result_id,
    result.stage_id, result.session_id, result.version, stage.starts_at
  from public.results result
  join public.stages stage on stage.id = result.stage_id and stage.deleted_at is null
  left join public.sessions session_row on session_row.id = result.session_id and session_row.deleted_at is null
  join season_scope scope on scope.season_id = stage.season_id and scope.category_id = result.category_id
  where result.status in ('homologated', 'published', 'rectified')
    and result.deleted_at is null
    and (
      session_row.kind in ('race', 'endurance')
      or (result.session_id is null and stage.format in ('regular', 'endurance'))
    )
  order by
    stage.season_id, result.category_id, result.stage_id,
    coalesce(result.session_id, '00000000-0000-0000-0000-000000000000'::uuid),
    result.version desc, result.updated_at desc
), scoring_events as (
  select
    latest_results.*,
    row_number() over (
      partition by season_id, category_id
      order by starts_at, stage_id,
        coalesce(session_id, '00000000-0000-0000-0000-000000000000'::uuid), result_id
    )::integer as event_order,
    count(*) over (partition by season_id, category_id)::integer as event_count
  from latest_results
), eligible_drivers as (
  select driver.season_id, driver.category_id, driver.id as driver_id
  from public.drivers driver
  join season_scope scope on scope.season_id = driver.season_id and scope.category_id = driver.category_id
  where driver.status = 'approved' and driver.deleted_at is null
), event_matrix as (
  select
    driver.season_id, driver.category_id, driver.driver_id,
    event.result_id, event.event_order, event.event_count,
    coalesce(entry.points, 0)::numeric(8,2) as event_points,
    entry.position, coalesce(entry.pole, false) as pole
  from eligible_drivers driver
  join scoring_events event on event.season_id = driver.season_id and event.category_id = driver.category_id
  left join public.result_entries entry
    on entry.result_id = event.result_id
   and entry.driver_id = driver.driver_id
   and entry.deleted_at is null
   and entry.status <> 'disqualified'
), ranked_worst as (
  select
    event_matrix.*,
    row_number() over (
      partition by season_id, category_id, driver_id
      order by event_points asc, event_order asc, result_id
    )::integer as worst_rank
  from event_matrix
), aggregated as (
  select
    season_id, category_id, driver_id,
    sum(event_points)::numeric(8,2) as gross_points,
    sum(event_points) filter (
      where worst_rank > least(2, greatest(0, event_count - 6))
    )::numeric(8,2) as net_points,
    count(*) filter (where position = 1)::integer as wins,
    count(*) filter (where position <= 3)::integer as podiums,
    count(*) filter (where pole)::integer as poles
  from ranked_worst
  group by season_id, category_id, driver_id
), ranked as (
  select
    aggregated.*,
    row_number() over (
      partition by season_id, category_id
      order by net_points desc, wins desc, podiums desc, poles desc, gross_points desc, driver_id
    )::integer as calculated_position
  from aggregated
)
insert into public.standings (
  season_id, category_id, driver_id, points, gross_points,
  wins, podiums, poles, position, version, status
)
select
  ranked.season_id, ranked.category_id, ranked.driver_id,
  ranked.net_points, ranked.gross_points,
  ranked.wins, ranked.podiums, ranked.poles,
  ranked.calculated_position, version_scope.next_version, 'rectified'
from ranked
join version_scope
  on version_scope.season_id = ranked.season_id
 and version_scope.category_id = ranked.category_id;
