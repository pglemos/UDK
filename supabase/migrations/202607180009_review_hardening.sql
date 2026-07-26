-- Security and integrity hardening from the final review.

create or replace function public.can_participate_as_driver(p_driver_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.drivers driver
    where driver.id = p_driver_id
      and driver.deleted_at is null
      and (
        driver.profile_id = auth.uid()
        or exists (
          select 1
          from public.guardian_links guardian
          where guardian.driver_id = driver.id
            and guardian.guardian_id = auth.uid()
            and guardian.status = 'approved'
            and guardian.deleted_at is null
        )
      )
  )
$$;

grant execute on function public.can_participate_as_driver(uuid) to authenticated;

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
      join public.seasons target_season on target_season.id = target_role.season_id
      where target_role.user_id = p_profile_id
        and public.has_active_role(
          array['organization'],
          coalesce(target_role.championship_id, target_season.championship_id),
          target_role.season_id
        )
    )
$$;

grant execute on function public.can_view_profile(uuid) to authenticated;

drop policy if exists staff_profiles_read on public.profiles;
create policy staff_profiles_read on public.profiles
for select to authenticated
using (public.can_view_profile(id));

-- Only an existing global administrator may grant or modify the admin role.
drop policy if exists organization_roles_manage on public.user_roles;
create policy organization_roles_manage on public.user_roles
for all to authenticated
using (
  public.is_admin()
  or (
    role <> 'admin'
    and public.has_active_role(array['organization'], championship_id, season_id)
  )
)
with check (
  public.is_admin()
  or (
    role <> 'admin'
    and public.has_active_role(array['organization'], championship_id, season_id)
  )
);

-- Derive resource scope before evaluating granular module permissions.
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
    where stage.id = p_stage_id and stage.deleted_at is null;
  elsif p_category_id is not null then
    select category.season_id
    into requested_season_id
    from public.categories category
    where category.id = p_category_id;
  end if;

  if requested_season_id is not null then
    select season.championship_id
    into requested_championship_id
    from public.seasons season
    where season.id = requested_season_id;
  end if;

  return exists (
    select 1
    from public.user_roles role_row
    where role_row.user_id = auth.uid()
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

-- Participant-controlled records use operation-specific policies.
drop policy if exists own_registrations on public.registrations;
create policy participant_registrations_read on public.registrations
for select to authenticated
using (public.can_participate_as_driver(driver_id));
create policy participant_registrations_insert on public.registrations
for insert to authenticated
with check (
  public.can_participate_as_driver(driver_id)
  and status in ('draft','submitted')
  and approved_category_id is null
  and deleted_at is null
);
create policy participant_registrations_correct on public.registrations
for update to authenticated
using (
  public.can_participate_as_driver(driver_id)
  and status in ('draft','submitted','documents_pending','payment_pending')
)
with check (
  public.can_participate_as_driver(driver_id)
  and status in ('draft','submitted','documents_pending','payment_pending')
  and approved_category_id is null
  and deleted_at is null
);

drop policy if exists own_documents_rows on public.documents;
drop policy if exists guardian_documents_manage on public.documents;
create policy participant_documents_read on public.documents
for select to authenticated
using (public.can_participate_as_driver(driver_id));
create policy participant_documents_insert on public.documents
for insert to authenticated
with check (
  public.can_participate_as_driver(driver_id)
  and status = 'submitted'
  and reviewed_by is null
  and reviewed_at is null
  and rejection_reason is null
  and deleted_at is null
);
create policy participant_documents_correct on public.documents
for update to authenticated
using (
  public.can_participate_as_driver(driver_id)
  and status in ('submitted','rejected','correction_requested')
)
with check (
  public.can_participate_as_driver(driver_id)
  and status = 'submitted'
  and reviewed_by is null
  and reviewed_at is null
  and rejection_reason is null
  and deleted_at is null
);

drop policy if exists own_appeals on public.appeals;
drop policy if exists guardian_appeals_manage on public.appeals;
create policy participant_appeals_read on public.appeals
for select to authenticated
using (public.can_participate_as_driver(driver_id));
create policy participant_appeals_insert on public.appeals
for insert to authenticated
with check (
  public.can_participate_as_driver(driver_id)
  and status = 'filed'
  and deleted_at is null
  and exists (
    select 1 from public.penalties penalty
    where penalty.id = penalty_id
      and penalty.driver_id = driver_id
      and penalty.deleted_at is null
  )
);
create policy participant_appeals_correct on public.appeals
for update to authenticated
using (public.can_participate_as_driver(driver_id) and status = 'filed')
with check (
  public.can_participate_as_driver(driver_id)
  and status = 'filed'
  and deleted_at is null
);

drop policy if exists category_change_participant on public.category_change_requests;
create policy category_changes_participant_read on public.category_change_requests
for select to authenticated
using (public.can_participate_as_driver(driver_id));
create policy category_changes_participant_insert on public.category_change_requests
for insert to authenticated
with check (
  public.can_participate_as_driver(driver_id)
  and status in ('draft','submitted')
  and reviewed_by is null
  and reviewed_at is null
  and deleted_at is null
);
create policy category_changes_participant_correct on public.category_change_requests
for update to authenticated
using (public.can_participate_as_driver(driver_id) and status in ('draft','submitted'))
with check (
  public.can_participate_as_driver(driver_id)
  and status in ('draft','submitted')
  and reviewed_by is null
  and reviewed_at is null
  and deleted_at is null
);
create policy category_changes_staff_manage on public.category_change_requests
for all to authenticated
using (public.can_manage_season(season_id))
with check (public.can_manage_season(season_id));

-- A legal acceptance must reference a published, effective term for the represented season.
drop policy if exists own_term_acceptances_insert on public.term_acceptances;
create policy own_term_acceptances_insert on public.term_acceptances
for insert to authenticated
with check (
  user_id = auth.uid()
  and deleted_at is null
  and exists (
    select 1
    from public.terms term
    where term.id = term_id
      and term.deleted_at is null
      and term.status = 'published'
      and (term.effective_at is null or term.effective_at <= now())
      and (
        (
          driver_id is not null
          and exists (
            select 1 from public.drivers driver
            where driver.id = driver_id
              and driver.season_id = term.season_id
              and public.can_participate_as_driver(driver.id)
          )
        )
        or (
          driver_id is null
          and exists (
            select 1 from public.drivers driver
            where driver.season_id = term.season_id
              and public.can_participate_as_driver(driver.id)
          )
        )
      )
  )
);

-- Relational integrity for sessions, karts and timing laps.
alter table public.sessions
  add constraint sessions_stage_id_id_unique unique (stage_id, id);

alter table public.result_entries
  add constraint result_entries_composite_unique unique (id, result_id, driver_id);

alter table public.laps
  add constraint laps_result_entry_consistency_fkey
  foreign key (result_entry_id, result_id, driver_id)
  references public.result_entries (id, result_id, driver_id)
  on delete cascade;

alter table public.results
  add constraint results_stage_session_consistency_fkey
  foreign key (stage_id, session_id)
  references public.sessions (stage_id, id)
  on delete set null;

alter table public.kart_assignments
  add constraint kart_assignments_exactly_one_assignee
  check (num_nonnulls(driver_id, team_id) = 1),
  add constraint kart_assignments_stage_session_consistency_fkey
  foreign key (stage_id, session_id)
  references public.sessions (stage_id, id)
  on delete set null;

alter table public.endurance_teams
  add constraint endurance_teams_stage_id_id_unique unique (stage_id, id);

alter table public.kart_assignments
  add constraint kart_assignments_team_stage_consistency_fkey
  foreign key (stage_id, team_id)
  references public.endurance_teams (stage_id, id)
  on delete cascade;

create or replace function public.validate_kart_assignment_scope()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  stage_season_id uuid;
  driver_season_id uuid;
begin
  if new.driver_id is null then
    return new;
  end if;

  select season_id into stage_season_id from public.stages where id = new.stage_id;
  select season_id into driver_season_id from public.drivers where id = new.driver_id;
  if stage_season_id is null or driver_season_id is null or stage_season_id <> driver_season_id then
    raise exception 'driver and stage must belong to the same season';
  end if;
  return new;
end
$$;

create trigger kart_assignments_scope_check
before insert or update on public.kart_assignments
for each row execute function public.validate_kart_assignment_scope();

-- Initialize all matching seasons, not one arbitrary season.
insert into public.points_rules (season_id, event_format, position_points, pole_points, fastest_lap_points, version)
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
where season.year = 2026
on conflict do nothing;

-- Serialize standing snapshot version allocation through the category row.
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
  where season_id = p_season_id and category_id = p_category_id;

  with aggregated as (
    select
      entry.driver_id,
      sum(entry.points)::numeric(8,2) as total_points,
      count(*) filter (where entry.position = 1)::integer as wins,
      count(*) filter (where entry.position <= 3)::integer as podiums,
      count(*) filter (where entry.pole)::integer as poles
    from public.result_entries entry
    join public.results result on result.id = entry.result_id
    join public.stages stage on stage.id = result.stage_id
    where stage.season_id = p_season_id
      and result.category_id = p_category_id
      and result.status in ('homologated','published','rectified')
      and result.deleted_at is null
      and entry.deleted_at is null
      and entry.status <> 'disqualified'
    group by entry.driver_id
  ), ranked as (
    select
      aggregated.*,
      row_number() over (
        order by total_points desc, wins desc, podiums desc, poles desc, driver_id
      )::integer as calculated_position
    from aggregated
  )
  insert into public.standings (
    season_id, category_id, driver_id, points, gross_points,
    wins, podiums, poles, position, version, status
  )
  select
    p_season_id, p_category_id, driver_id, total_points, total_points,
    wins, podiums, poles, calculated_position, next_version, 'official'
  from ranked;

  get diagnostics inserted_count = row_count;
  return inserted_count;
end
$$;

-- Storage policies preserve scope through explicit path prefixes:
-- season/<season-id>/<uploader-id>/file or championship/<championship-id>/<uploader-id>/file.
create or replace function public.storage_path_scoped_to_roles(
  p_name text,
  p_roles text[]
)
returns boolean
language plpgsql
stable
security definer
set search_path = public, storage
as $$
declare
  folders text[];
  scope_id uuid;
begin
  folders := storage.foldername(p_name);
  if array_length(folders, 1) < 2 then
    return false;
  end if;

  begin
    scope_id := folders[2]::uuid;
  exception when invalid_text_representation then
    return false;
  end;

  if folders[1] = 'season' then
    return public.has_active_role(p_roles, null, scope_id);
  end if;
  if folders[1] = 'championship' then
    return public.has_active_role(p_roles, scope_id, null);
  end if;
  return false;
end
$$;

grant execute on function public.storage_path_scoped_to_roles(text, text[]) to authenticated;

drop policy if exists own_documents on storage.objects;
drop policy if exists staff_private_documents on storage.objects;
drop policy if exists own_payment_proofs on storage.objects;
drop policy if exists staff_payment_proofs on storage.objects;
drop policy if exists disciplinary_evidence_read on storage.objects;
drop policy if exists disciplinary_evidence_write on storage.objects;
drop policy if exists staff_disciplinary_evidence on storage.objects;
drop policy if exists timing_imports_staff on storage.objects;
drop policy if exists staff_timing_imports on storage.objects;
drop policy if exists signatures_own_write on storage.objects;
drop policy if exists signatures_own_read on storage.objects;
drop policy if exists staff_signatures_read on storage.objects;
drop policy if exists admin_media_write on storage.objects;
drop policy if exists content_public_media_manage on storage.objects;

create policy private_documents_owner_insert on storage.objects
for insert to authenticated
with check (
  bucket_id = 'private-documents'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or (
      (storage.foldername(name))[1] = 'season'
      and (storage.foldername(name))[3] = auth.uid()::text
    )
  )
);
create policy private_documents_owner_read on storage.objects
for select to authenticated
using (
  bucket_id = 'private-documents'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or (
      (storage.foldername(name))[1] = 'season'
      and (storage.foldername(name))[3] = auth.uid()::text
    )
  )
);
create policy private_documents_staff on storage.objects
for all to authenticated
using (
  bucket_id = 'private-documents'
  and (public.is_admin() or public.storage_path_scoped_to_roles(name, array['organization']))
)
with check (
  bucket_id = 'private-documents'
  and (public.is_admin() or public.storage_path_scoped_to_roles(name, array['organization']))
);

create policy payment_proofs_owner_insert on storage.objects
for insert to authenticated
with check (
  bucket_id = 'payment-proofs'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or (
      (storage.foldername(name))[1] = 'season'
      and (storage.foldername(name))[3] = auth.uid()::text
    )
  )
);
create policy payment_proofs_owner_read on storage.objects
for select to authenticated
using (
  bucket_id = 'payment-proofs'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or (
      (storage.foldername(name))[1] = 'season'
      and (storage.foldername(name))[3] = auth.uid()::text
    )
  )
);
create policy payment_proofs_staff on storage.objects
for all to authenticated
using (
  bucket_id = 'payment-proofs'
  and (public.is_admin() or public.storage_path_scoped_to_roles(name, array['organization','finance']))
)
with check (
  bucket_id = 'payment-proofs'
  and (public.is_admin() or public.storage_path_scoped_to_roles(name, array['organization','finance']))
);

create policy disciplinary_evidence_staff on storage.objects
for all to authenticated
using (
  bucket_id = 'disciplinary-evidence'
  and (public.is_admin() or public.storage_path_scoped_to_roles(name, array['organization','judge','marshal']))
)
with check (
  bucket_id = 'disciplinary-evidence'
  and (public.is_admin() or public.storage_path_scoped_to_roles(name, array['organization','judge','marshal']))
);

create policy timing_imports_staff on storage.objects
for all to authenticated
using (
  bucket_id = 'timing-imports'
  and (public.is_admin() or public.storage_path_scoped_to_roles(name, array['organization','judge']))
)
with check (
  bucket_id = 'timing-imports'
  and (public.is_admin() or public.storage_path_scoped_to_roles(name, array['organization','judge']))
);

create policy signatures_owner_insert on storage.objects
for insert to authenticated
with check (
  bucket_id = 'signatures'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or (
      (storage.foldername(name))[1] = 'season'
      and (storage.foldername(name))[3] = auth.uid()::text
    )
  )
);
create policy signatures_owner_read on storage.objects
for select to authenticated
using (
  bucket_id = 'signatures'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or (
      (storage.foldername(name))[1] = 'season'
      and (storage.foldername(name))[3] = auth.uid()::text
    )
  )
);
create policy signatures_staff_read on storage.objects
for select to authenticated
using (
  bucket_id = 'signatures'
  and (public.is_admin() or public.storage_path_scoped_to_roles(name, array['organization']))
);

create policy public_media_staff on storage.objects
for all to authenticated
using (
  bucket_id = 'public-media'
  and (public.is_admin() or public.storage_path_scoped_to_roles(name, array['organization','editor']))
)
with check (
  bucket_id = 'public-media'
  and (public.is_admin() or public.storage_path_scoped_to_roles(name, array['organization','editor']))
);
