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
      and ur.role = any(p_roles)
      and (ur.expires_at is null or ur.expires_at > now())
  )
$$;

grant execute on function public.has_any_active_role(text[]) to authenticated;

create policy staff_profiles_read on public.profiles
for select to authenticated
using (
  id = auth.uid()
  or public.has_any_active_role(array['admin','organization','judge','marshal','finance','editor'])
);

create policy organization_documents_manage on public.documents
for all to authenticated
using (
  exists (
    select 1 from public.drivers d
    where d.id = documents.driver_id
      and public.can_manage_season(d.season_id)
  )
)
with check (
  exists (
    select 1 from public.drivers d
    where d.id = documents.driver_id
      and public.can_manage_season(d.season_id)
  )
);

create policy organization_points_rules_manage on public.points_rules
for all to authenticated
using (public.can_manage_season(season_id))
with check (public.can_manage_season(season_id));

create policy staff_notifications_manage on public.notifications
for all to authenticated
using (public.has_any_active_role(array['admin','organization','editor']))
with check (public.has_any_active_role(array['admin','organization','editor']));

create policy staff_private_documents on storage.objects
for select to authenticated
using (
  bucket_id = 'private-documents'
  and public.has_any_active_role(array['admin','organization'])
);

create policy staff_payment_proofs on storage.objects
for all to authenticated
using (
  bucket_id = 'payment-proofs'
  and public.has_any_active_role(array['admin','organization','finance'])
)
with check (
  bucket_id = 'payment-proofs'
  and public.has_any_active_role(array['admin','organization','finance'])
);

create policy staff_disciplinary_evidence on storage.objects
for all to authenticated
using (
  bucket_id = 'disciplinary-evidence'
  and public.has_any_active_role(array['admin','organization','judge','marshal'])
)
with check (
  bucket_id = 'disciplinary-evidence'
  and public.has_any_active_role(array['admin','organization','judge','marshal'])
);

create policy staff_timing_imports on storage.objects
for all to authenticated
using (
  bucket_id = 'timing-imports'
  and public.has_any_active_role(array['admin','organization','judge'])
)
with check (
  bucket_id = 'timing-imports'
  and public.has_any_active_role(array['admin','organization','judge'])
);

create policy staff_signatures_read on storage.objects
for select to authenticated
using (
  bucket_id = 'signatures'
  and public.has_any_active_role(array['admin','organization'])
);

create policy content_public_media_manage on storage.objects
for all to authenticated
using (
  bucket_id = 'public-media'
  and public.has_any_active_role(array['admin','organization','editor'])
)
with check (
  bucket_id = 'public-media'
  and public.has_any_active_role(array['admin','organization','editor'])
);

create or replace function public.recalculate_result_points(p_result_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_rule public.points_rules%rowtype;
  selected_season_id uuid;
  updated_count integer;
begin
  select st.season_id
  into selected_season_id
  from public.results r
  join public.stages st on st.id = r.stage_id
  where r.id = p_result_id;

  if selected_season_id is null or not public.can_judge_season(selected_season_id) then
    raise exception 'permission denied';
  end if;

  select pr.*
    into selected_rule
  from public.results r
  join public.stages st on st.id = r.stage_id
  join public.points_rules pr
    on pr.season_id = st.season_id
   and pr.event_format = st.format
   and pr.active
   and (pr.category_id = r.category_id or pr.category_id is null)
  where r.id = p_result_id
  order by (pr.category_id is not null) desc, pr.version desc
  limit 1;

  if selected_rule.id is null then
    raise exception 'active points rule not found';
  end if;

  update public.result_entries entry
  set points =
    coalesce((selected_rule.position_points ->> entry.position::text)::numeric, 0)
    + case when entry.pole then selected_rule.pole_points else 0 end
    + case when entry.fastest_lap then selected_rule.fastest_lap_points else 0 end,
    updated_at = now()
  where entry.result_id = p_result_id;

  get diagnostics updated_count = row_count;
  return updated_count;
end
$$;

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

  if not exists (
    select 1 from public.categories c
    where c.id = p_category_id and c.season_id = p_season_id
  ) then
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
    season_id,
    category_id,
    driver_id,
    points,
    gross_points,
    wins,
    podiums,
    poles,
    position,
    version,
    status
  )
  select
    p_season_id,
    p_category_id,
    driver_id,
    total_points,
    total_points,
    wins,
    podiums,
    poles,
    calculated_position,
    next_version,
    'official'
  from ranked;

  get diagnostics inserted_count = row_count;
  return inserted_count;
end
$$;
