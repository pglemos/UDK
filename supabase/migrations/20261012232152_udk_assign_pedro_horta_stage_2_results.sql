-- The stage 2 timing import used Pedro Henrique's unclassified name as a
-- separate Rápidos driver. The registered UDK driver is Pedro Horta (Insanos).
do $migration$
declare
  v_season_id uuid;
  v_rapidos_id uuid;
  v_insanos_id uuid;
  v_source_id uuid;
  v_source_category_id uuid;
  v_source_status text;
  v_source_public_profile boolean;
  v_target_id uuid;
  v_target_category_id uuid;
  v_target_status text;
  v_source_entries integer;
  v_source_points numeric;
  v_source_payload_valid boolean;
  v_target_entries integer;
  v_target_points numeric;
  v_moved integer;
begin
  -- Local fixtures omit the imported roster this production correction needs.
  if not exists (
    select 1
    from public.seasons season
    join public.championships championship on championship.id = season.championship_id
    where championship.slug = 'udk'
      and season.year = 2026
      and season.deleted_at is null
      and championship.deleted_at is null
      and exists (
        select 1
        from public.drivers driver
        where driver.season_id = season.id
          and driver.slug = 'pedro-henrique'
          and driver.deleted_at is null
      )
      and exists (
        select 1
        from public.drivers driver
        where driver.season_id = season.id
          and driver.slug = 'pedro-horta'
          and driver.deleted_at is null
      )
  ) then
    return;
  end if;

  select season.id
  into strict v_season_id
  from public.seasons season
  join public.championships championship on championship.id = season.championship_id
  where championship.slug = 'udk'
    and season.year = 2026
    and season.deleted_at is null
    and championship.deleted_at is null;

  select category.id into strict v_rapidos_id
  from public.categories category
  where category.season_id = v_season_id
    and category.slug = 'rapidos'
    and category.deleted_at is null;

  select category.id into strict v_insanos_id
  from public.categories category
  where category.season_id = v_season_id
    and category.slug = 'insanos'
    and category.deleted_at is null;

  select driver.id, driver.category_id, driver.status, driver.public_profile
  into strict v_source_id, v_source_category_id, v_source_status, v_source_public_profile
  from public.drivers driver
  where driver.season_id = v_season_id
    and driver.slug = 'pedro-henrique'
    and driver.deleted_at is null;

  select driver.id, driver.category_id, driver.status
  into strict v_target_id, v_target_category_id, v_target_status
  from public.drivers driver
  where driver.season_id = v_season_id
    and driver.slug = 'pedro-horta'
    and driver.deleted_at is null;

  select
    count(*)::integer,
    coalesce(sum(entry.points), 0),
    coalesce(bool_and(
      result.category_id is null
      and (
        (result.external_racing_id = 2026090801 and entry.position = 11 and entry.points = 32)
        or (result.external_racing_id = 2026090802 and entry.position = 17 and entry.points = 26)
      )
    ), false)
  into v_source_entries, v_source_points, v_source_payload_valid
  from public.result_entries entry
  join public.results result on result.id = entry.result_id
  join public.stages stage on stage.id = result.stage_id
  where entry.driver_id = v_source_id
    and entry.deleted_at is null
    and result.deleted_at is null
    and stage.deleted_at is null
    and stage.season_id = v_season_id
    and result.status in ('homologated', 'published', 'rectified');

  select count(*)::integer, coalesce(sum(entry.points), 0)
  into v_target_entries, v_target_points
  from public.result_entries entry
  join public.results result on result.id = entry.result_id
  where entry.driver_id = v_target_id
    and entry.deleted_at is null
    and result.deleted_at is null
    and result.external_racing_id in (2026090801, 2026090802);

  if v_source_status = 'archived'
    and not v_source_public_profile
    and v_source_entries = 0
    and v_target_entries = 2
    and v_target_points = 58 then
    null;
  else
    if v_source_status <> 'approved'
      or v_source_category_id <> v_rapidos_id
      or v_target_status <> 'approved'
      or v_target_category_id <> v_insanos_id
      or v_source_entries <> 2
      or v_source_points <> 58
      or not v_source_payload_valid
      or v_target_entries <> 0 then
      raise exception 'Pedro Horta result reassignment preconditions failed';
    end if;

    update public.result_entries entry
    set driver_id = v_target_id
    from public.results result
    where result.id = entry.result_id
      and result.external_racing_id in (2026090801, 2026090802)
      and result.deleted_at is null
      and entry.driver_id = v_source_id
      and entry.deleted_at is null;
    get diagnostics v_moved = row_count;

    if v_moved <> 2 then
      raise exception 'Expected to move 2 published stage 2 entries, moved %', v_moved;
    end if;

    update public.drivers
    set status = 'archived', public_profile = false, updated_at = now()
    where id = v_source_id;

    perform set_config('udk.migration_context', 'standings_rebuild', true);
    perform public.recalculate_standings(v_season_id, v_rapidos_id);
    perform public.recalculate_standings(v_season_id, v_insanos_id);
  end if;

  select count(*)::integer, coalesce(sum(entry.points), 0)
  into v_target_entries, v_target_points
  from public.result_entries entry
  join public.results result on result.id = entry.result_id
  where entry.driver_id = v_target_id
    and entry.deleted_at is null
    and result.deleted_at is null
    and result.external_racing_id in (2026090801, 2026090802);

  if v_target_entries <> 2 or v_target_points <> 58 then
    raise exception 'Pedro Horta stage 2 result validation failed';
  end if;

  if not exists (
    select 1
    from public.public_portal_standings standing
    where standing.id = v_target_id
      and standing.category_slug = 'insanos'
      and standing.points = 58
  ) or exists (
    select 1
    from public.public_portal_standings standing
    where standing.id = v_source_id
  ) then
    raise exception 'Public standings validation failed for Pedro Horta';
  end if;
end
$migration$;
