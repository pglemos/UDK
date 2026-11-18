-- Art. 20 do regulamento 2026: descarte dos 2 piores resultados em corridas regulares,
-- de quaisquer etapas (não é progressivo e a Endurance não entra). Ausência em corrida
-- regular conta como descarte; ausência numa Endurance consome os descartes regulares.
-- Antes: least(2, nº de provas - 6), contando a Endurance — com 7 provas só 1 descarte.

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
      stage.starts_at,
      (session_row.kind = 'endurance' or (result.session_id is null and stage.format = 'endurance')) as is_endurance
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
      coalesce(event.is_endurance, false) as is_endurance,
      (entry.id is null) as absent,
      case when entry.status = 'disqualified' then 0 else coalesce(entry.points, 0) end::numeric(8,2) as event_points,
      entry.position,
      entry.status as entry_status,
      coalesce(entry.pole, false) as pole
    from eligible_drivers driver
    cross join scoring_events event
    left join public.result_entries entry
      on entry.result_id = event.result_id
     and entry.driver_id = driver.driver_id
     and entry.deleted_at is null
  ), ranked_worst as (
    select
      event_matrix.*,
      -- Art. 20: só corridas regulares entram no descarte; Endurance nunca é descartada
      case when is_endurance then null else row_number() over (
        partition by driver_id, is_endurance
        order by event_points asc, event_order asc, result_id
      ) end::integer as worst_rank,
      -- § 3º: ausência numa Endurance consome o direito aos descartes regulares
      bool_or(is_endurance and absent) over (partition by driver_id) as endurance_absence
    from event_matrix
  ), aggregated as (
    select
      driver_id,
      sum(event_points)::numeric(8,2) as gross_points,
      -- § 2º: descarta os 2 piores resultados em corridas regulares (de quaisquer etapas);
      -- ausência em corrida regular vale 0 e por isso é a primeira a ser descartada (§ 3º)
      coalesce(sum(event_points) filter (
        where is_endurance or worst_rank > case when endurance_absence then 0 else 2 end
      ), 0)::numeric(8,2) as net_points,
      count(*) filter (
        where entry_status = 'classified' and position = 1 and not absent
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

-- recalcula todas as categorias da temporada com a regra correta
do $recalc$
declare
  cat record;
begin
  for cat in
    select category.season_id, category.id
    from public.categories category
    where category.deleted_at is null
  loop
    perform set_config('udk.migration_context', 'standings_rebuild', true);
    perform public.recalculate_standings(cat.season_id, cat.id);
  end loop;
end
$recalc$;
