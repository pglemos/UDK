create or replace function public.audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  row_id uuid;
begin
  row_id := coalesce(
    nullif(to_jsonb(new) ->> 'id', '')::uuid,
    nullif(to_jsonb(old) ->> 'id', '')::uuid
  );

  insert into public.audit_events (
    actor_id,
    entity_type,
    entity_id,
    action,
    before_data,
    after_data
  ) values (
    auth.uid(),
    tg_table_name,
    row_id,
    lower(tg_op),
    case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) else null end,
    case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) else null end
  );

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end
$$;

create or replace view public.public_standings as
with latest_versions as (
  select season_id, category_id, max(version) as version
  from public.standings
  where status in ('provisional','official','rectified')
  group by season_id, category_id
)
select
  d.slug,
  d.sport_name as name,
  d.number,
  c.name as category,
  st.points,
  st.wins,
  st.podiums,
  st.position
from public.standings st
join latest_versions latest
  on latest.season_id = st.season_id
 and latest.category_id = st.category_id
 and latest.version = st.version
join public.drivers d on d.id = st.driver_id
join public.categories c on c.id = st.category_id
where d.public_profile
  and d.status = 'approved'
  and st.status in ('provisional','official','rectified');

create or replace view public.public_results as
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
from public.results result
join public.stages stage on stage.id = result.stage_id
left join public.categories category on category.id = result.category_id
where result.status in ('provisional','homologated','published','rectified');

grant select on public.public_results to anon, authenticated;

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values
  ('payment-proofs','payment-proofs',false,15728640,array['image/jpeg','image/png','application/pdf']),
  ('disciplinary-evidence','disciplinary-evidence',false,104857600,array['image/jpeg','image/png','application/pdf','video/mp4','video/webm'])
on conflict (id) do nothing;

create policy own_payment_proofs on storage.objects
for all to authenticated
using (
  bucket_id = 'payment-proofs'
  and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
)
with check (
  bucket_id = 'payment-proofs'
  and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
);

create policy disciplinary_evidence_read on storage.objects
for select to authenticated
using (
  bucket_id = 'disciplinary-evidence'
  and public.is_admin()
);

create policy disciplinary_evidence_write on storage.objects
for all to authenticated
using (
  bucket_id = 'disciplinary-evidence'
  and public.is_admin()
)
with check (
  bucket_id = 'disciplinary-evidence'
  and public.is_admin()
);
