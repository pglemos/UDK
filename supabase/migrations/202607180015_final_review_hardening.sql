-- Final review hardening: archived roles cannot authorize and public results
-- cannot expose rows through archived championship hierarchies.

create or replace function public.has_active_role(
  p_roles text[],
  p_championship_id uuid default null,
  p_season_id uuid default null
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.deleted_at is null
      and ur.role = any(p_roles)
      and (ur.expires_at is null or ur.expires_at > now())
      and (
        ur.role = 'admin'
        or (
          (
            ur.championship_id is null
            or ur.championship_id = p_championship_id
            or ur.championship_id = (
              select season.championship_id
              from public.seasons season
              where season.id = p_season_id
                and season.deleted_at is null
            )
          )
          and (ur.season_id is null or ur.season_id = p_season_id)
        )
      )
  )
$$;

create or replace function public.has_any_active_role(p_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.deleted_at is null
      and ur.role = any(p_roles)
      and (ur.expires_at is null or ur.expires_at > now())
  )
$$;

create or replace function public.can_module_action(
  p_module text,
  p_action text,
  p_category_id uuid default null,
  p_stage_id uuid default null,
  p_session_id uuid default null
)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  requested_season_id uuid;
  requested_championship_id uuid;
begin
  if p_session_id is not null then
    select stage.season_id
    into requested_season_id
    from public.sessions session_row
    join public.stages stage on stage.id = session_row.stage_id
    where session_row.id = p_session_id
      and session_row.deleted_at is null
      and stage.deleted_at is null;
  elsif p_stage_id is not null then
    select stage.season_id
    into requested_season_id
    from public.stages stage
    where stage.id = p_stage_id
      and stage.deleted_at is null;
  elsif p_category_id is not null then
    select category.season_id
    into requested_season_id
    from public.categories category
    where category.id = p_category_id
      and category.deleted_at is null;
  end if;

  if requested_season_id is not null then
    select season.championship_id
    into requested_championship_id
    from public.seasons season
    join public.championships championship on championship.id = season.championship_id
    where season.id = requested_season_id
      and season.deleted_at is null
      and championship.deleted_at is null;
  end if;

  return exists (
    select 1
    from public.user_roles role_row
    where role_row.user_id = auth.uid()
      and role_row.deleted_at is null
      and (role_row.expires_at is null or role_row.expires_at > now())
      and (
        role_row.role = 'admin'
        or (
          (role_row.season_id is null or role_row.season_id = requested_season_id)
          and (role_row.championship_id is null or role_row.championship_id = requested_championship_id)
          and (
            (role_row.season_id is null and role_row.championship_id is null)
            or requested_season_id is not null
          )
          and not exists (
            select 1
            from public.role_permissions denied
            where denied.user_role_id = role_row.id
              and denied.deleted_at is null
              and denied.module = p_module
              and denied.action in (p_action, 'manage')
              and denied.allowed = false
              and (denied.expires_at is null or denied.expires_at > now())
              and (denied.category_id is null or denied.category_id = p_category_id)
              and (denied.stage_id is null or denied.stage_id = p_stage_id)
              and (denied.session_id is null or denied.session_id = p_session_id)
          )
          and (
            not exists (
              select 1
              from public.role_permissions configured
              where configured.user_role_id = role_row.id
                and configured.deleted_at is null
            )
            or exists (
              select 1
              from public.role_permissions granted
              where granted.user_role_id = role_row.id
                and granted.deleted_at is null
                and granted.module = p_module
                and granted.action in (p_action, 'manage')
                and granted.allowed = true
                and (granted.expires_at is null or granted.expires_at > now())
                and (granted.category_id is null or granted.category_id = p_category_id)
                and (granted.stage_id is null or granted.stage_id = p_stage_id)
                and (granted.session_id is null or granted.session_id = p_session_id)
            )
          )
        )
      )
  );
end
$$;

create or replace function public.can_view_profile(p_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    p_profile_id = auth.uid()
    or public.is_admin()
    or exists (
      select 1
      from public.drivers driver
      join public.seasons season on season.id = driver.season_id
      join public.championships championship on championship.id = season.championship_id
      where driver.profile_id = p_profile_id
        and driver.deleted_at is null
        and season.deleted_at is null
        and championship.deleted_at is null
        and public.has_active_role(
          array['organization','judge','marshal','finance','editor'],
          championship.id,
          driver.season_id
        )
    )
    or exists (
      select 1
      from public.user_roles target_role
      left join public.seasons target_season on target_season.id = target_role.season_id
      left join public.championships target_championship
        on target_championship.id = coalesce(target_role.championship_id, target_season.championship_id)
      where target_role.user_id = p_profile_id
        and target_role.deleted_at is null
        and (target_role.expires_at is null or target_role.expires_at > now())
        and (target_season.id is null or target_season.deleted_at is null)
        and (target_championship.id is null or target_championship.deleted_at is null)
        and public.has_active_role(
          array['organization'],
          target_championship.id,
          target_role.season_id
        )
    )
$$;

create or replace view public.public_results as
with latest_results as (
  select distinct on (
    result.stage_id,
    coalesce(result.category_id, '00000000-0000-0000-0000-000000000000'::uuid)
  )
    result.id,
    result.title,
    result.status,
    result.version,
    result.fastest_lap_ms,
    result.published_at,
    result.stage_id,
    result.category_id
  from public.results result
  where result.deleted_at is null
    and result.status in ('provisional','homologated','published','rectified')
  order by
    result.stage_id,
    coalesce(result.category_id, '00000000-0000-0000-0000-000000000000'::uuid),
    result.version desc,
    result.updated_at desc
)
select
  result.id,
  result.title,
  result.status,
  result.version,
  result.fastest_lap_ms,
  result.published_at,
  stage.title as stage_title,
  stage.track,
  stage.starts_at,
  category.name as category
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
left join public.categories category
  on category.id = result.category_id
 and category.deleted_at is null
where result.category_id is null or category.id is not null;

alter view public.public_results set (security_invoker = true);
grant select on public.public_results to anon, authenticated;

revoke execute on function public.has_active_role(text[], uuid, uuid) from public, anon;
revoke execute on function public.has_any_active_role(text[]) from public, anon;
revoke execute on function public.can_module_action(text, text, uuid, uuid, uuid) from public, anon;
revoke execute on function public.can_view_profile(uuid) from public, anon;
grant execute on function public.has_active_role(text[], uuid, uuid) to authenticated;
grant execute on function public.has_any_active_role(text[]) to authenticated;
grant execute on function public.can_module_action(text, text, uuid, uuid, uuid) to authenticated;
grant execute on function public.can_view_profile(uuid) to authenticated;
