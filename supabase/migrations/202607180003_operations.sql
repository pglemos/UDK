alter table public.result_entries
  add column if not exists points numeric(8,2) not null default 0,
  add column if not exists pole boolean not null default false,
  add column if not exists fastest_lap boolean not null default false;

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references public.drivers on delete cascade,
  document_type text not null check (document_type in ('identity','profile_photo','responsibility_term','image_authorization','guardian_document','guardian_authorization','other')),
  file_path text not null,
  status text not null default 'submitted' check (status in ('submitted','analysis','approved','rejected','correction_requested','archived')),
  rejection_reason text,
  reviewed_by uuid references public.profiles on delete set null,
  reviewed_at timestamptz,
  valid_until date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.credits (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references public.drivers on delete cascade,
  amount_cents integer not null check (amount_cents > 0),
  remaining_cents integer not null check (remaining_cents >= 0),
  origin text not null check (origin in ('cancellation','refund','overpayment','courtesy','award','adjustment','transfer')),
  status text not null default 'available' check (status in ('available','reserved','used','expired','cancelled','transferred')),
  expires_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (remaining_cents <= amount_cents)
);

create table public.points_rules (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons on delete cascade,
  category_id uuid references public.categories on delete cascade,
  event_format text not null check (event_format in ('regular','endurance','special')),
  position_points jsonb not null default '{"1":25,"2":20,"3":16,"4":13,"5":11,"6":10,"7":9,"8":8,"9":7,"10":6,"11":5,"12":4,"13":3,"14":2,"15":1}'::jsonb,
  pole_points numeric(8,2) not null default 0,
  fastest_lap_points numeric(8,2) not null default 0,
  active boolean not null default true,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index points_rules_scope_unique on public.points_rules (
  season_id,
  coalesce(category_id, '00000000-0000-0000-0000-000000000000'::uuid),
  event_format,
  version
);

create table public.import_batches (
  id uuid primary key default gen_random_uuid(),
  stage_id uuid not null references public.stages on delete cascade,
  result_id uuid references public.results on delete set null,
  source text not null default 'manual' check (source in ('email','forwarded_email','manual_pdf','manual_csv')),
  original_filename text,
  original_path text,
  content_hash text,
  status text not null default 'received' check (status in ('received','processing','review','imported','duplicate','failed','rejected')),
  confidence numeric(5,2),
  diagnostics jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index import_batches_hash_unique
  on public.import_batches(content_hash)
  where content_hash is not null;

create table public.laps (
  id uuid primary key default gen_random_uuid(),
  result_id uuid not null references public.results on delete cascade,
  result_entry_id uuid not null references public.result_entries on delete cascade,
  driver_id uuid not null references public.drivers on delete cascade,
  lap_number integer not null check (lap_number > 0),
  lap_time_ms integer check (lap_time_ms > 0),
  speed_kph numeric(7,3),
  position integer,
  valid boolean not null default true,
  invalid_reason text,
  created_at timestamptz not null default now(),
  unique (result_entry_id, lap_number)
);

create table public.incidents (
  id uuid primary key default gen_random_uuid(),
  stage_id uuid not null references public.stages on delete cascade,
  driver_id uuid references public.drivers on delete set null,
  team_id uuid references public.endurance_teams on delete set null,
  incident_type text not null,
  severity text not null default 'medium' check (severity in ('low','medium','high','critical')),
  description text not null,
  occurred_at timestamptz not null,
  lap_number integer,
  regulation_clause text,
  status text not null default 'registered' check (status in ('draft','registered','triage','analysis','awaiting_evidence','judgment','archived','converted','closed')),
  created_by uuid references public.profiles on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.evidence (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.incidents on delete cascade,
  evidence_type text not null check (evidence_type in ('photo','video','report','witness','document','timing')),
  file_path text,
  statement text,
  visibility text not null default 'restricted' check (visibility in ('private','involved','committee','public','restricted')),
  content_hash text,
  created_by uuid references public.profiles on delete set null,
  created_at timestamptz not null default now()
);

create table public.notification_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles on delete cascade,
  notification_kind text not null,
  email_enabled boolean not null default true,
  in_app_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, notification_kind)
);

create index documents_driver_status_idx on public.documents(driver_id, status);
create index credits_driver_status_idx on public.credits(driver_id, status);
create index points_rules_lookup_idx on public.points_rules(season_id, category_id, event_format, active);
create index import_batches_stage_status_idx on public.import_batches(stage_id, status);
create index laps_result_driver_idx on public.laps(result_id, driver_id, lap_number);
create index incidents_stage_status_idx on public.incidents(stage_id, status);
create index evidence_incident_idx on public.evidence(incident_id);

create trigger documents_updated before update on public.documents for each row execute function public.set_updated_at();
create trigger credits_updated before update on public.credits for each row execute function public.set_updated_at();
create trigger points_rules_updated before update on public.points_rules for each row execute function public.set_updated_at();
create trigger import_batches_updated before update on public.import_batches for each row execute function public.set_updated_at();
create trigger incidents_updated before update on public.incidents for each row execute function public.set_updated_at();
create trigger notification_preferences_updated before update on public.notification_preferences for each row execute function public.set_updated_at();

alter table public.documents enable row level security;
alter table public.credits enable row level security;
alter table public.points_rules enable row level security;
alter table public.import_batches enable row level security;
alter table public.laps enable row level security;
alter table public.incidents enable row level security;
alter table public.evidence enable row level security;
alter table public.notification_preferences enable row level security;

create policy own_documents_rows on public.documents for all using (
  exists (
    select 1 from public.drivers d
    where d.id = documents.driver_id and d.profile_id = auth.uid()
  ) or public.is_admin()
) with check (
  exists (
    select 1 from public.drivers d
    where d.id = documents.driver_id and d.profile_id = auth.uid()
  ) or public.is_admin()
);

create policy own_credits_rows on public.credits for select using (
  exists (
    select 1 from public.drivers d
    where d.id = credits.driver_id and d.profile_id = auth.uid()
  ) or public.is_admin()
);

create policy admin_credits_rows on public.credits for all using (public.is_admin()) with check (public.is_admin());
create policy public_points_rules on public.points_rules for select using (active);
create policy admin_points_rules on public.points_rules for all using (public.is_admin()) with check (public.is_admin());
create policy admin_import_batches on public.import_batches for all using (public.is_admin()) with check (public.is_admin());

create policy public_laps on public.laps for select using (
  exists (
    select 1 from public.results r
    where r.id = laps.result_id
      and r.status in ('provisional','homologated','published','rectified')
  )
);
create policy admin_laps on public.laps for all using (public.is_admin()) with check (public.is_admin());

create policy incident_involved_read on public.incidents for select using (
  public.is_admin()
  or exists (
    select 1 from public.drivers d
    where d.id = incidents.driver_id and d.profile_id = auth.uid()
  )
);
create policy admin_incidents on public.incidents for all using (public.is_admin()) with check (public.is_admin());

create policy evidence_involved_read on public.evidence for select using (
  public.is_admin()
  or (
    visibility in ('involved','public')
    and exists (
      select 1
      from public.incidents i
      join public.drivers d on d.id = i.driver_id
      where i.id = evidence.incident_id and d.profile_id = auth.uid()
    )
  )
  or visibility = 'public'
);
create policy admin_evidence on public.evidence for all using (public.is_admin()) with check (public.is_admin());

create policy own_notification_preferences on public.notification_preferences for all using (
  user_id = auth.uid() or public.is_admin()
) with check (
  user_id = auth.uid() or public.is_admin()
);

create or replace function public.recalculate_result_points(p_result_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_rule public.points_rules%rowtype;
  updated_count integer;
begin
  if not public.is_admin() then
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
  if not public.is_admin() then
    raise exception 'permission denied';
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

grant execute on function public.recalculate_result_points(uuid) to authenticated;
grant execute on function public.recalculate_standings(uuid, uuid) to authenticated;

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

  return coalesce(new, old);
end
$$;

create trigger audit_registrations after insert or update or delete on public.registrations for each row execute function public.audit_row_change();
create trigger audit_payments after insert or update or delete on public.payments for each row execute function public.audit_row_change();
create trigger audit_results after insert or update or delete on public.results for each row execute function public.audit_row_change();
create trigger audit_result_entries after insert or update or delete on public.result_entries for each row execute function public.audit_row_change();
create trigger audit_penalties after insert or update or delete on public.penalties for each row execute function public.audit_row_change();
create trigger audit_appeals after insert or update or delete on public.appeals for each row execute function public.audit_row_change();
create trigger audit_documents after insert or update or delete on public.documents for each row execute function public.audit_row_change();
create trigger audit_credits after insert or update or delete on public.credits for each row execute function public.audit_row_change();
create trigger audit_incidents after insert or update or delete on public.incidents for each row execute function public.audit_row_change();

with active_season as (
  select id from public.seasons where year = 2026 limit 1
)
insert into public.points_rules (
  season_id,
  event_format,
  position_points,
  pole_points,
  fastest_lap_points,
  active,
  version
)
select
  id,
  event_format,
  '{"1":25,"2":20,"3":16,"4":13,"5":11,"6":10,"7":9,"8":8,"9":7,"10":6,"11":5,"12":4,"13":3,"14":2,"15":1}'::jsonb,
  case when event_format = 'regular' then 1 else 0 end,
  case when event_format = 'regular' then 1 else 0 end,
  true,
  1
from active_season
cross join (values ('regular'), ('endurance'), ('special')) as formats(event_format);
