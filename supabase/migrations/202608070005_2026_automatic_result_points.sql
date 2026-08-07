-- Make the official 2026 scoring rule the operational source of truth.
-- Entry points are recalculated whenever sporting inputs change. The existing
-- "Calcular pontos" RPC remains available as an explicit safety/recalculation action.

create or replace function public.resolve_result_points_rule(p_result_id uuid)
returns public.points_rules
language sql
stable
security definer
set search_path = public
as $$
  select rule
  from public.results result
  join public.stages stage
    on stage.id = result.stage_id
   and stage.deleted_at is null
  join public.points_rules rule
    on rule.season_id = stage.season_id
   and rule.event_format = stage.format
   and rule.active
   and rule.deleted_at is null
   and (rule.category_id = result.category_id or rule.category_id is null)
  where result.id = p_result_id
    and result.deleted_at is null
  order by (rule.category_id is not null) desc, rule.version desc
  limit 1
$$;

revoke execute on function public.resolve_result_points_rule(uuid) from public, anon;
grant execute on function public.resolve_result_points_rule(uuid) to authenticated;

create or replace function public.apply_result_entry_points()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_rule public.points_rules%rowtype;
begin
  selected_rule := public.resolve_result_points_rule(new.result_id);

  if selected_rule.id is null then
    raise exception 'active points rule not found for result %', new.result_id;
  end if;

  new.points :=
    coalesce((selected_rule.position_points ->> new.position::text)::numeric, 0)
    + case when new.pole then selected_rule.pole_points else 0 end
    + case when new.fastest_lap then selected_rule.fastest_lap_points else 0 end;
  new.updated_at := now();

  return new;
end
$$;

revoke execute on function public.apply_result_entry_points() from public, anon, authenticated;

drop trigger if exists result_entries_auto_points on public.result_entries;
create trigger result_entries_auto_points
before insert or update of result_id, position, pole, fastest_lap
on public.result_entries
for each row
execute function public.apply_result_entry_points();

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
  join public.stages stage
    on stage.id = result.stage_id
   and stage.deleted_at is null
  where result.id = p_result_id
    and result.deleted_at is null;

  if result_season_id is null then
    raise exception 'result not found';
  end if;

  if not public.can_judge_season(result_season_id) then
    raise exception 'permission denied';
  end if;

  selected_rule := public.resolve_result_points_rule(p_result_id);
  if selected_rule.id is null then
    raise exception 'active points rule not found';
  end if;

  update public.result_entries entry
  set
    points =
      coalesce((selected_rule.position_points ->> entry.position::text)::numeric, 0)
      + case when entry.pole then selected_rule.pole_points else 0 end
      + case when entry.fastest_lap then selected_rule.fastest_lap_points else 0 end,
    updated_at = now()
  where entry.result_id = p_result_id
    and entry.deleted_at is null;

  get diagnostics updated_count = row_count;
  return updated_count;
end
$$;

grant execute on function public.recalculate_result_points(uuid) to authenticated;

-- Recalculate any existing UDK 2026 entries once during migration. Updating the
-- sporting position to itself intentionally invokes the trigger above.
update public.result_entries entry
set position = entry.position
from public.results result
join public.stages stage on stage.id = result.stage_id
join public.seasons season on season.id = stage.season_id
join public.championships championship on championship.id = season.championship_id
where entry.result_id = result.id
  and entry.deleted_at is null
  and result.deleted_at is null
  and stage.deleted_at is null
  and season.deleted_at is null
  and championship.deleted_at is null
  and championship.slug = 'udk'
  and season.year = 2026;
