-- Follow-up fixes for constraints that must preserve the parent stage identifier.

alter table public.results
  drop constraint if exists results_stage_session_consistency_fkey;
alter table public.results
  add constraint results_stage_session_consistency_fkey
  foreign key (stage_id, session_id)
  references public.sessions (stage_id, id)
  on delete restrict;

alter table public.kart_assignments
  drop constraint if exists kart_assignments_stage_session_consistency_fkey;
alter table public.kart_assignments
  add constraint kart_assignments_stage_session_consistency_fkey
  foreign key (stage_id, session_id)
  references public.sessions (stage_id, id)
  on delete restrict;

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
      where driver.profile_id = p_profile_id
        and driver.deleted_at is null
        and public.has_active_role(
          array['organization','judge','marshal','finance','editor'],
          null,
          driver.season_id
        )
    )
    or exists (
      select 1
      from public.user_roles target_role
      where target_role.user_id = p_profile_id
        and (
          target_role.expires_at is null
          or target_role.expires_at > now()
        )
        and public.has_active_role(
          array['organization'],
          coalesce(
            target_role.championship_id,
            (select season.championship_id from public.seasons season where season.id = target_role.season_id)
          ),
          target_role.season_id
        )
    )
$$;

-- Every existing season receives a baseline points table. Category-specific versions
-- can still override these defaults.
insert into public.points_rules (
  season_id,
  event_format,
  position_points,
  pole_points,
  fastest_lap_points,
  version
)
select
  season.id,
  rule.event_format,
  rule.position_points,
  rule.pole_points,
  rule.fastest_lap_points,
  1
from public.seasons season
cross join (
  values
    ('regular'::text, '{"1":25,"2":20,"3":16,"4":13,"5":11,"6":10,"7":9,"8":8,"9":7,"10":6,"11":5,"12":4,"13":3,"14":2,"15":1}'::jsonb, 1::numeric, 1::numeric),
    ('endurance'::text, '{"1":40,"2":32,"3":26,"4":22,"5":18,"6":15,"7":12,"8":10,"9":8,"10":6}'::jsonb, 0::numeric, 1::numeric),
    ('special'::text, '{"1":30,"2":24,"3":19,"4":15,"5":12,"6":10,"7":8,"8":6,"9":4,"10":2}'::jsonb, 2::numeric, 1::numeric)
) as rule(event_format, position_points, pole_points, fastest_lap_points)
on conflict do nothing;
