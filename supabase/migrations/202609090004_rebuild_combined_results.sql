-- UDK 2026: resultado oficial unico por prova, com classificacao geral conjunta.
-- As linhas anteriores permanecem no banco como auditoria e sao apenas ocultadas
-- do portal por soft delete.

set statement_timeout = '30s';

alter table public.points_rules
  add column if not exists best_pit_points numeric(8,2) not null default 0;

alter table public.result_entries
  add column if not exists best_pit boolean not null default false,
  add column if not exists penalty_points numeric(8,2) not null default 0,
  add column if not exists timing_adjustment_laps integer not null default 0,
  add column if not exists sporting_note text;

-- A tabela oficial da Endurance termina no P30. Depois disso a posicao segue
-- sendo exibida no resultado, mas nao gera pontos de chegada.
with season_scope as (
  select season.id as season_id
  from public.seasons season
  join public.championships championship on championship.id = season.championship_id
  where championship.slug = 'udk'
    and season.year = 2026
), regular_rule as (
  select
    rule.id,
    '{"1":50,"2":45,"3":42,"4":40,"5":38,"6":37,"7":36,"8":35,"9":34,"10":33,"11":32,"12":31,"13":30,"14":29,"15":28,"16":27,"17":26,"18":25,"19":24,"20":23,"21":22,"22":21,"23":20,"24":19,"25":18,"26":17,"27":16,"28":15,"29":14,"30":13,"31":12,"32":11,"33":10,"34":9,"35":8,"36":7,"37":6,"38":5,"39":4,"40":3,"41":2,"42":1}'::jsonb as position_points
  from public.points_rules rule
  join season_scope on season_scope.season_id = rule.season_id
  where rule.event_format = 'regular'
    and rule.category_id is null
    and rule.active
    and rule.deleted_at is null
  order by rule.version desc
  limit 1
), endurance_rule as (
  select
    rule.id,
    jsonb_object_agg(position::text, points order by position) as position_points
  from public.points_rules rule
  join season_scope on season_scope.season_id = rule.season_id
  cross join lateral (
    select
      position,
      case position
        when 1 then 150
        when 2 then 145
        when 3 then 142
        when 4 then 140
        when 5 then 138
        else 143 - position
      end as points
    from generate_series(1, 30) as positions(position)
  ) scoring
  where rule.event_format = 'endurance'
    and rule.category_id is null
    and rule.active
    and rule.deleted_at is null
  group by rule.id
  order by rule.id
  limit 1
)
update public.points_rules rule
set position_points = case
      when rule.id = regular_rule.id then regular_rule.position_points
      else endurance_rule.position_points
    end,
    pole_points = 1,
    fastest_lap_points = 1,
    best_pit_points = case when rule.event_format = 'endurance' then 10 else 0 end,
    updated_at = now()
from regular_rule, endurance_rule
where rule.id in (regular_rule.id, endurance_rule.id);

-- O recalculate precisa escolher o resultado combinado quando existir e, em
-- seguida, somar somente os entries do piloto na categoria solicitada.
create or replace function public.recalculate_standings(p_season_id uuid, p_category_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  next_version integer;
  inserted_count integer;
begin
  if not public.can_judge_season(p_season_id) then
    raise exception 'permission denied';
  end if;

  perform 1
  from public.categories category
  where category.id = p_category_id
    and category.season_id = p_season_id
  for update;

  if not found then
    raise exception 'category does not belong to season';
  end if;

  select coalesce(max(version), 0) + 1
  into next_version
  from public.standings
  where season_id = p_season_id
    and category_id = p_category_id;

  with latest_results as (
    select distinct on (
      result.stage_id,
      coalesce(result.session_id, '00000000-0000-0000-0000-000000000000'::uuid)
    )
      result.id as result_id,
      result.stage_id,
      result.session_id,
      result.version,
      stage.starts_at
    from public.results result
    join public.stages stage
      on stage.id = result.stage_id
     and stage.deleted_at is null
    left join public.sessions session_row
      on session_row.id = result.session_id
     and session_row.deleted_at is null
    where stage.season_id = p_season_id
      and (result.category_id is null or result.category_id = p_category_id)
      and result.status in ('homologated', 'published', 'rectified')
      and result.deleted_at is null
      and (
        session_row.kind in ('race', 'endurance')
        or (result.session_id is null and stage.format in ('regular', 'endurance'))
      )
    order by
      result.stage_id,
      coalesce(result.session_id, '00000000-0000-0000-0000-000000000000'::uuid),
      (result.category_id is null) desc,
      result.version desc,
      result.updated_at desc,
      result.id desc
  ), scoring_events as (
    select
      latest_results.*,
      row_number() over (
        order by starts_at,
          stage_id,
          coalesce(session_id, '00000000-0000-0000-0000-000000000000'::uuid),
          result_id
      )::integer as event_order,
      count(*) over ()::integer as event_count
    from latest_results
  ), eligible_drivers as (
    select driver.id as driver_id
    from public.drivers driver
    where driver.season_id = p_season_id
      and driver.category_id = p_category_id
      and driver.status = 'approved'
      and driver.deleted_at is null
  ), event_matrix as (
    select
      driver.driver_id,
      event.result_id,
      event.event_order,
      event.event_count,
      coalesce(entry.points, 0)::numeric(8,2) as event_points,
      entry.position,
      entry.status as entry_status,
      coalesce(entry.pole, false) as pole
    from eligible_drivers driver
    cross join scoring_events event
    left join public.result_entries entry
      on entry.result_id = event.result_id
     and entry.driver_id = driver.driver_id
     and entry.deleted_at is null
     and entry.status <> 'disqualified'
  ), ranked_worst as (
    select
      event_matrix.*,
      row_number() over (
        partition by driver_id
        order by event_points asc, event_order asc, result_id
      )::integer as worst_rank
    from event_matrix
  ), aggregated as (
    select
      driver_id,
      sum(event_points)::numeric(8,2) as gross_points,
      sum(event_points) filter (
        where worst_rank > least(2, greatest(0, event_count - 6))
      )::numeric(8,2) as net_points,
      count(*) filter (
        where entry_status = 'classified' and position = 1
      )::integer as wins,
      count(*) filter (
        where entry_status = 'classified' and position between 1 and 3
      )::integer as podiums,
      count(*) filter (
        where entry_status = 'classified' and pole
      )::integer as poles
    from ranked_worst
    group by driver_id
  ), ranked as (
    select
      aggregated.*,
      row_number() over (
        order by net_points desc, wins desc, podiums desc, poles desc, gross_points desc, driver_id
      )::integer as calculated_position
    from aggregated
  )
  insert into public.standings (
    season_id, category_id, driver_id, points, gross_points,
    wins, podiums, poles, position, version, status
  )
  select
    p_season_id, p_category_id, driver_id, net_points, gross_points,
    wins, podiums, poles, calculated_position, next_version, 'official'
  from ranked;

  get diagnostics inserted_count = row_count;
  return inserted_count;
end
$$;

grant execute on function public.recalculate_standings(uuid, uuid) to authenticated;

-- Os dois participantes presentes no LapTime, mas ausentes do cadastro
-- anterior, pertencem a Ultras Rápidos nesta temporada.
with season_scope as (
  select season.id as season_id, category.id as category_id
  from public.seasons season
  join public.championships championship on championship.id = season.championship_id
  join public.categories category on category.season_id = season.id
  where championship.slug = 'udk'
    and season.year = 2026
    and category.slug = 'rapidos'
), roster(slug, full_name, sport_name) as (
  values
    ('pedro-henrique', 'Pedro Henrique de Lima', 'Pedro Henrique'),
    ('bernardo-ferreira-duarte', 'Bernardo Ferreira Duarte', 'Bernardo Ferreira Duarte')
)
insert into public.drivers (
  season_id, category_id, slug, full_name, sport_name, number, status, public_profile
)
select
  season_scope.season_id,
  season_scope.category_id,
  roster.slug,
  roster.full_name,
  roster.sport_name,
  null,
  'approved',
  true
from season_scope
cross join roster
where not exists (
  select 1
  from public.drivers driver
  where driver.season_id = season_scope.season_id
    and driver.slug = roster.slug
    and driver.deleted_at is null
);

with season_scope as (
  select season.id as season_id, category.id as category_id
  from public.seasons season
  join public.championships championship on championship.id = season.championship_id
  join public.categories category on category.season_id = season.id
  where championship.slug = 'udk'
    and season.year = 2026
    and category.slug = 'rapidos'
), roster(slug, full_name, sport_name) as (
  values
    ('pedro-henrique', 'Pedro Henrique de Lima', 'Pedro Henrique'),
    ('bernardo-ferreira-duarte', 'Bernardo Ferreira Duarte', 'Bernardo Ferreira Duarte')
)
update public.drivers driver
set category_id = season_scope.category_id,
    full_name = roster.full_name,
    sport_name = roster.sport_name,
    status = 'approved',
    public_profile = true,
    updated_at = now()
from season_scope, roster
where driver.season_id = season_scope.season_id
  and driver.slug = roster.slug
  and driver.deleted_at is null;

-- Cria o escopo combinado para a Endurance e para as duas corridas da 2a etapa.
-- Se um rascunho geral já existir, ele é atualizado para a versão oficial em
-- vez de disputar a mesma chave única com um novo registro.
with payload(external_id, session_name, title, result_status, fastest_lap_ms, source_system, published_at) as (
  values
    (2026081801::bigint, 'Endurance 1h', 'Resultado oficial - 1a etapa - Endurance - Geral', 'rectified', 64976, 'laptime', timestamptz '2026-08-20 16:12:14-03'),
    (2026090801::bigint, 'Corrida 1 - Horário', 'Resultado oficial - 2a etapa - Corrida 1 - Geral', 'published', 51610, 'manual_pdf', timestamptz '2026-09-08 23:30:00-03'),
    (2026090802::bigint, 'Corrida 2 - Anti-horário', 'Resultado oficial - 2a etapa - Corrida 2 - Geral', 'published', 51235, 'manual_pdf', timestamptz '2026-09-08 23:30:00-03')
), target_payload as (
  select
    stage.id as stage_id,
    session_row.id as session_id,
    payload.*
  from public.stages stage
  join public.seasons season on season.id = stage.season_id
  join public.championships championship on championship.id = season.championship_id
  join payload on payload.session_name = case
    when stage.format = 'endurance' then 'Endurance 1h'
    else payload.session_name
  end
  join public.sessions session_row
    on session_row.stage_id = stage.id
   and session_row.name = payload.session_name
   and session_row.category_id is null
   and session_row.deleted_at is null
  where championship.slug = 'udk'
    and season.year = 2026
    and stage.deleted_at is null
    and (
      ((stage.starts_at at time zone 'America/Sao_Paulo')::date = date '2026-08-18' and stage.format = 'endurance')
      or ((stage.starts_at at time zone 'America/Sao_Paulo')::date = date '2026-09-08' and stage.format = 'regular')
    )
), updated as (
  update public.results result
  set
    title = target_payload.title,
    status = target_payload.result_status,
    fastest_lap_ms = target_payload.fastest_lap_ms,
    published_at = target_payload.published_at,
    source_system = target_payload.source_system,
    external_racing_id = target_payload.external_id,
    external_imported_at = now(),
    updated_at = now()
  from target_payload
  where result.stage_id = target_payload.stage_id
    and result.session_id = target_payload.session_id
    and result.category_id is null
    and result.version = 1
    and result.deleted_at is null
  returning result.id
)
insert into public.results (
  stage_id, category_id, session_id, title, status, version,
  fastest_lap_ms, published_at, source_system, external_racing_id, external_imported_at
)
select
  target_payload.stage_id,
  null,
  target_payload.session_id,
  target_payload.title,
  target_payload.result_status,
  1,
  target_payload.fastest_lap_ms,
  target_payload.published_at,
  target_payload.source_system,
  target_payload.external_id,
  now()
from target_payload
where not exists (
  select 1
  from public.results existing
  where existing.stage_id = target_payload.stage_id
    and existing.session_id = target_payload.session_id
    and existing.category_id is null
    and existing.version = 1
    and existing.deleted_at is null
);

-- Um rascunho combinado pode ter entries antigos. Arquiva-os antes de
-- materializar novamente os 39/33/33 entries oficiais; nada é apagado.
with target as (
  select result.id as result_id
  from public.results result
  join public.stages stage on stage.id = result.stage_id
  where result.category_id is null
    and result.version = 1
    and result.deleted_at is null
    and result.external_racing_id in (2026081801, 2026090801, 2026090802)
    and stage.deleted_at is null
)
update public.result_entries entry
set deleted_at = coalesce(entry.deleted_at, now()),
    updated_at = now()
from target
where entry.result_id = target.result_id
  and entry.deleted_at is null;

-- A Endurance vem dos entries retificados da etapa 1. A ordenacao primeiro
-- separa classificados de NC/DNF e depois usa voltas e tempo oficial.
with source_rows as (
  select
    source_entry.*,
    row_number() over (
      order by
        (source_entry.status = 'classified') desc,
        source_entry.laps desc,
        (coalesce(source_entry.total_time_ms, 0) + coalesce(source_entry.penalty_ms, 0)) asc,
        source_entry.id
    )::integer as general_position
  from public.result_entries source_entry
  join public.results source_result on source_result.id = source_entry.result_id
  join public.stages source_stage on source_stage.id = source_result.stage_id
  join public.seasons source_season on source_season.id = source_stage.season_id
  join public.championships source_championship on source_championship.id = source_season.championship_id
  where source_championship.slug = 'udk'
    and source_season.year = 2026
    and (source_stage.starts_at at time zone 'America/Sao_Paulo')::date = date '2026-08-18'
    and source_result.external_racing_id in (2026081801, 2026081802)
    and source_result.version = 2
    and source_result.category_id is not null
    and source_result.deleted_at is null
    and source_entry.deleted_at is null
), target as (
  select result.id
  from public.results result
  join public.stages stage on stage.id = result.stage_id
  where result.category_id is null
    and result.external_racing_id = 2026081801
    and result.deleted_at is null
    and stage.deleted_at is null
)
insert into public.result_entries (
  result_id, driver_id, position, kart_number, laps, total_time_ms, best_lap_ms,
  penalty_ms, pole, fastest_lap, status, external_competitor_id,
  best_pit, penalty_points, timing_adjustment_laps, sporting_note
)
select
  target.id,
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
cross join source_rows
where not exists (
  select 1
  from public.result_entries existing
  where existing.result_id = target.id
    and existing.driver_id = source_rows.driver_id
    and existing.deleted_at is null
);

-- Preserva o volta a volta da Endurance, agora apontando para o resultado
-- combinado que o portal publica.
with target as (
  select result.id as result_id
  from public.results result
  where result.category_id is null
    and result.external_racing_id = 2026081801
    and result.deleted_at is null
), source_scope as (
  select
    source_result.id as source_result_id,
    source_entry.id as source_entry_id,
    source_entry.driver_id,
    target.result_id
  from public.result_entries source_entry
  join public.results source_result on source_result.id = source_entry.result_id
  join target on true
  where source_result.external_racing_id in (2026081801, 2026081802)
    and source_result.version = 2
    and source_result.category_id is not null
    and source_result.deleted_at is null
    and source_entry.deleted_at is null
), new_entries as (
  select source_scope.*, entry.id as new_entry_id
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

-- Resultados gerais da 2a etapa, conforme os dois relatorios oficiais
-- ultras_corrida.pdf e ultras2_corrida.pdf. A categoria vem do cadastro do
-- piloto; ela nao reinicia a posicao nem a tabela de pontos.
with target as (
  select
    result.id as result_id,
    result.external_racing_id
  from public.results result
  where result.category_id is null
    and result.external_racing_id in (2026090801, 2026090802)
    and result.deleted_at is null
), payload(
  external_id, category_slug, driver_slug, position, kart_number, laps,
  total_time_ms, best_lap_ms, status, pole, fastest_lap, sporting_note
) as (
  values
    (2026090801::bigint, 'insanos', 'andre-felisberto', 1, 129, 18, 948349, 51619, 'classified', false, false, null),
    (2026090801, 'insanos', 'lucas-rabelo', 2, 119, 18, 949409, 51610, 'classified', false, true, null),
    (2026090801, 'insanos', 'fabio-filho', 3, 139, 18, 953736, 52141, 'classified', false, false, null),
    (2026090801, 'insanos', 'pablo-fonseca', 4, 142, 18, 957583, 52019, 'classified', false, false, null),
    (2026090801, 'insanos', 'alexandre-janotti', 5, 143, 18, 957941, 52016, 'classified', false, false, null),
    (2026090801, 'insanos', 'vitor-hugo', 6, 105, 18, 964434, 51937, 'classified', false, false, null),
    (2026090801, 'insanos', 'rafael-soares', 7, 137, 18, 964527, 51938, 'classified', false, false, null),
    (2026090801, 'insanos', 'marcelo-augusto', 8, 130, 18, 964714, 51767, 'classified', false, false, null),
    (2026090801, 'rapidos', 'raphael-werner', 9, 109, 18, 965102, 52001, 'classified', false, false, null),
    (2026090801, 'rapidos', 'arthur-henrique', 10, 104, 18, 966955, 51975, 'classified', false, false, null),
    (2026090801, 'rapidos', 'pedro-henrique', 11, 140, 18, 967384, 52263, 'classified', false, false, null),
    (2026090801, 'rapidos', 'marcos-felipe', 12, 116, 18, 967580, 52150, 'classified', false, false, null),
    (2026090801, 'rapidos', 'reinaldo-teles', 13, 155, 18, 967580, 51713, 'classified', false, false, null),
    (2026090801, 'rapidos', 'pedro-teles', 14, 158, 18, 968157, 52251, 'classified', false, false, null),
    (2026090801, 'insanos', 'agenor-jr', 15, 131, 18, 971109, 51971, 'classified', false, false, null),
    (2026090801, 'insanos', 'gegela', 16, 147, 18, 971178, 51969, 'classified', false, false, null),
    (2026090801, 'insanos', 'lucas-guimaraes', 17, 127, 18, 971214, 51782, 'classified', false, false, null),
    (2026090801, 'rapidos', 'braulio-bonoto', 18, 145, 18, 971416, 51924, 'classified', false, false, null),
    (2026090801, 'insanos', 'bernardo-thadeu', 19, 123, 18, 973476, 51904, 'classified', true, false, 'Penalizacao registrada no relatorio LapTime; ordem oficial publicada preservada.'),
    (2026090801, 'insanos', 'renato-oliveira', 20, 146, 18, 978034, 52476, 'classified', false, false, null),
    (2026090801, 'rapidos', 'bernardo-ferreira-duarte', 21, 117, 18, 979972, 52336, 'classified', false, false, null),
    (2026090801, 'rapidos', 'lucas-godoy', 22, 111, 18, 980758, 52663, 'classified', false, false, null),
    (2026090801, 'rapidos', 'marcelo-marques', 23, 133, 18, 980872, 52645, 'classified', false, false, null),
    (2026090801, 'rapidos', 'fernando-godoy', 24, 144, 18, 985595, 52787, 'classified', false, false, null),
    (2026090801, 'rapidos', 'rafael-morais', 25, 124, 18, 985688, 52777, 'classified', false, false, null),
    (2026090801, 'rapidos', 'newton', 26, 148, 18, 985796, 52825, 'classified', false, false, null),
    (2026090801, 'rapidos', 'maxmiiler-frantiscoly', 27, 122, 18, 986267, 52101, 'classified', false, false, null),
    (2026090801, 'rapidos', 'guilherme-faria', 28, 151, 18, 987456, 52915, 'classified', false, false, null),
    (2026090801, 'rapidos', 'gabriel-fernandes', 29, 162, 18, 990493, 52240, 'classified', false, false, null),
    (2026090801, 'rapidos', 'wesley-cardoso', 30, 120, 18, 997777, 53287, 'classified', false, false, null),
    (2026090801, 'rapidos', 'rafael-teodoro', 31, 138, 18, 998513, 53574, 'classified', false, false, null),
    (2026090801, 'rapidos', 'lucca-dambros', 32, 108, 17, 950438, 53340, 'classified', false, false, null),
    (2026090801, 'rapidos', 'lucas-gabriel-voieta-parreira', 33, 110, 17, 951823, 53169, 'classified', false, false, null),

    (2026090802, 'insanos', 'andre-felisberto', 1, 142, 19, 994318, 51478, 'classified', true, false, null),
    (2026090802, 'insanos', 'lucas-rabelo', 2, 139, 19, 994604, 51504, 'classified', false, false, null),
    (2026090802, 'rapidos', 'arthur-henrique', 3, 147, 19, 994778, 51235, 'classified', false, true, null),
    (2026090802, 'insanos', 'marcelo-augusto', 4, 162, 19, 996864, 51421, 'classified', false, false, null),
    (2026090802, 'insanos', 'bernardo-thadeu', 5, 148, 19, 1001701, 51514, 'classified', false, false, 'Penalizacao registrada no relatorio LapTime; ordem oficial publicada preservada.'),
    (2026090802, 'insanos', 'vitor-hugo', 6, 119, 19, 1001819, 51898, 'classified', false, false, null),
    (2026090802, 'insanos', 'gegela', 7, 143, 19, 1002226, 51979, 'classified', false, false, null),
    (2026090802, 'insanos', 'agenor-jr', 8, 104, 19, 1002380, 51838, 'classified', false, false, null),
    (2026090802, 'insanos', 'fabio-filho', 9, 144, 19, 1002493, 51715, 'classified', false, false, null),
    (2026090802, 'insanos', 'rafael-soares', 10, 158, 19, 1004952, 51780, 'classified', false, false, null),
    (2026090802, 'rapidos', 'bernardo-ferreira-duarte', 11, 129, 19, 1007570, 51800, 'classified', false, false, null),
    (2026090802, 'insanos', 'renato-oliveira', 12, 109, 19, 1009328, 51884, 'classified', false, false, null),
    (2026090802, 'rapidos', 'braulio-bonoto', 13, 137, 19, 1010567, 52034, 'classified', false, false, null),
    (2026090802, 'rapidos', 'marcos-felipe', 14, 110, 19, 1011557, 52290, 'classified', false, false, null),
    (2026090802, 'rapidos', 'pedro-teles', 15, 155, 19, 1011883, 52035, 'classified', false, false, null),
    (2026090802, 'insanos', 'alexandre-janotti', 16, 120, 19, 1012713, 52231, 'classified', false, false, null),
    (2026090802, 'rapidos', 'pedro-henrique', 17, 138, 19, 1018936, 52602, 'classified', false, false, null),
    (2026090802, 'insanos', 'pablo-fonseca', 18, 123, 19, 1019515, 51998, 'classified', false, false, null),
    (2026090802, 'insanos', 'lucas-guimaraes', 19, 136, 19, 1021963, 52238, 'classified', false, false, null),
    (2026090802, 'rapidos', 'fernando-godoy', 20, 145, 19, 1022323, 52138, 'classified', false, false, null),
    (2026090802, 'rapidos', 'maxmiiler-frantiscoly', 21, 105, 19, 1030598, 52195, 'classified', false, false, null),
    (2026090802, 'rapidos', 'gabriel-fernandes', 22, 130, 19, 1030794, 52565, 'classified', false, false, null),
    (2026090802, 'rapidos', 'wesley-cardoso', 23, 116, 19, 1031159, 52404, 'classified', false, false, null),
    (2026090802, 'rapidos', 'lucas-godoy', 24, 124, 19, 1031202, 53070, 'classified', false, false, null),
    (2026090802, 'rapidos', 'marcelo-marques', 25, 140, 19, 1031403, 52801, 'classified', false, false, null),
    (2026090802, 'rapidos', 'guilherme-faria', 26, 131, 19, 1031457, 52857, 'classified', false, false, null),
    (2026090802, 'rapidos', 'rafael-morais', 27, 151, 19, 1031525, 52856, 'classified', false, false, null),
    (2026090802, 'rapidos', 'reinaldo-teles', 28, 106, 19, 1031643, 52535, 'classified', false, false, null),
    (2026090802, 'rapidos', 'newton', 29, 108, 19, 1040188, 52888, 'classified', false, false, null),
    (2026090802, 'rapidos', 'raphael-werner', 30, 127, 19, 1046468, 52205, 'classified', false, false, null),
    (2026090802, 'rapidos', 'rafael-teodoro', 31, 133, 18, 997946, 53521, 'classified', false, false, null),
    (2026090802, 'rapidos', 'lucca-dambros', 32, 146, 18, 998473, 53491, 'classified', false, false, null),
    (2026090802, 'rapidos', 'lucas-gabriel-voieta-parreira', 33, 117, 1, 67009, 59498, 'nc', false, false, null)
)
insert into public.result_entries (
  result_id, driver_id, position, kart_number, laps, total_time_ms, best_lap_ms,
  penalty_ms, pole, fastest_lap, status, best_pit, penalty_points,
  timing_adjustment_laps, sporting_note
)
select
  target.result_id,
  driver.id,
  payload.position,
  payload.kart_number,
  payload.laps,
  payload.total_time_ms,
  payload.best_lap_ms,
  0,
  payload.pole,
  payload.fastest_lap,
  payload.status,
  false,
  0,
  0,
  payload.sporting_note
from payload
join target on target.external_racing_id = payload.external_id
join public.categories category
  on category.slug = payload.category_slug
join public.drivers driver
  on driver.season_id = category.season_id
 and driver.category_id = category.id
 and driver.slug = payload.driver_slug
 and driver.deleted_at is null
where not exists (
  select 1
  from public.result_entries existing
  where existing.result_id = target.result_id
    and existing.driver_id = driver.id
    and existing.deleted_at is null
);

-- Retira do portal apenas as versoes antigas por categoria. Nenhuma linha e
-- apagada fisicamente: resultados, entries e volta a volta ficam auditaveis.
update public.result_entries entry
set deleted_at = coalesce(entry.deleted_at, now()),
    updated_at = now()
from public.results result
join public.stages stage on stage.id = result.stage_id
join public.seasons season on season.id = stage.season_id
join public.championships championship on championship.id = season.championship_id
where entry.result_id = result.id
  and result.category_id is not null
  and result.deleted_at is null
  and result.external_racing_id in (2026081801, 2026081802, 2026090801, 2026090802, 2026090803, 2026090804)
  and championship.slug = 'udk'
  and season.year = 2026
  and entry.deleted_at is null;

update public.results result
set deleted_at = coalesce(result.deleted_at, now()),
    updated_at = now()
from public.stages stage
join public.seasons season on season.id = stage.season_id
join public.championships championship on championship.id = season.championship_id
where result.stage_id = stage.id
  and result.category_id is not null
  and result.deleted_at is null
  and result.external_racing_id in (2026081801, 2026081802, 2026090801, 2026090802, 2026090803, 2026090804)
  and championship.slug = 'udk'
  and season.year = 2026;

update public.stages stage
set status = 'homologated',
    updated_at = now()
where (stage.starts_at at time zone 'America/Sao_Paulo')::date in (date '2026-08-18', date '2026-09-08')
  and stage.deleted_at is null;

-- Versao publica unica por etapa/sessao. O resultado combinado (category_id
-- nulo) tem prioridade caso algum resultado legado ainda esteja ativo.
drop view if exists public.public_portal_results;
create view public.public_portal_results
with (security_invoker = true)
as
with latest_results as (
  select distinct on (
    result.stage_id,
    coalesce(result.session_id, '00000000-0000-0000-0000-000000000000'::uuid)
  )
    result.*
  from public.results result
  where result.deleted_at is null
    and result.status in ('provisional', 'homologated', 'published', 'rectified')
  order by
    result.stage_id,
    coalesce(result.session_id, '00000000-0000-0000-0000-000000000000'::uuid),
    (result.category_id is null) desc,
    result.version desc,
    result.updated_at desc,
    result.id desc
)
select
  result.id,
  result.title,
  result.status,
  result.version,
  result.fastest_lap_ms,
  result.published_at,
  result.stage_id,
  stage.slug as stage_slug,
  stage.title as stage_title,
  stage.track,
  stage.starts_at,
  session_row.name as session_name,
  session_row.kind as session_kind,
  category.name as category,
  category.slug as category_slug
from latest_results result
join public.stages stage
  on stage.id = result.stage_id
 and stage.deleted_at is null
join public.seasons season
  on season.id = stage.season_id
 and season.deleted_at is null
join public.championships championship
  on championship.id = season.championship_id
 and championship.deleted_at is null
left join public.sessions session_row
  on session_row.id = result.session_id
 and session_row.deleted_at is null
left join public.categories category
  on category.id = result.category_id
 and category.deleted_at is null;

drop view if exists public.public_portal_result_entries;
create view public.public_portal_result_entries
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
  entry.best_pit,
  entry.penalty_points,
  entry.timing_adjustment_laps,
  entry.sporting_note,
  entry.status,
  entry.created_at,
  result.title as result_title,
  session_row.name as session_name,
  driver.slug as driver_slug,
  driver.sport_name as driver_name,
  driver.number as driver_number,
  category.name as category,
  category.slug as category_slug,
  category.color as category_color,
  stage.title as stage_title
from public.result_entries entry
join public.results result
  on result.id = entry.result_id
 and result.deleted_at is null
 and result.status in ('provisional', 'homologated', 'published', 'rectified')
left join public.sessions session_row
  on session_row.id = result.session_id
 and session_row.deleted_at is null
join public.drivers driver
  on driver.id = entry.driver_id
 and driver.deleted_at is null
 and driver.public_profile
left join public.categories category
  on category.id = driver.category_id
 and category.deleted_at is null
join public.stages stage
  on stage.id = result.stage_id
 and stage.deleted_at is null
where entry.deleted_at is null;

grant select on public.public_portal_results, public.public_portal_result_entries
to anon, authenticated;

-- Recria snapshots oficiais por categoria usando os entries do resultado geral.
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
  join public.championships championship on championship.id = season.championship_id
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
