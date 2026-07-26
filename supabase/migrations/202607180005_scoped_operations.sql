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
            )
          )
          and (ur.season_id is null or ur.season_id = p_season_id)
        )
      )
  )
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_active_role(array['admin'])
$$;

create or replace function public.can_manage_season(p_season_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_active_role(array['admin','organization'], null, p_season_id)
$$;

create or replace function public.can_judge_season(p_season_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_active_role(array['admin','organization','judge'], null, p_season_id)
$$;

create or replace function public.can_marshal_season(p_season_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_active_role(array['admin','organization','marshal'], null, p_season_id)
$$;

create or replace function public.can_finance_season(p_season_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_active_role(array['admin','organization','finance'], null, p_season_id)
$$;

create or replace function public.can_edit_championship(p_championship_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_active_role(array['admin','organization','editor'], p_championship_id, null)
$$;

grant execute on function public.has_active_role(text[], uuid, uuid) to authenticated;
grant execute on function public.can_manage_season(uuid) to authenticated;
grant execute on function public.can_judge_season(uuid) to authenticated;
grant execute on function public.can_marshal_season(uuid) to authenticated;
grant execute on function public.can_finance_season(uuid) to authenticated;
grant execute on function public.can_edit_championship(uuid) to authenticated;

create table public.guardian_links (
  id uuid primary key default gen_random_uuid(),
  guardian_id uuid not null references public.profiles on delete cascade,
  driver_id uuid not null references public.drivers on delete cascade,
  relationship text not null,
  status text not null default 'pending' check (status in ('pending','approved','rejected','revoked')),
  approved_by uuid references public.profiles on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (guardian_id, driver_id)
);

create table public.terms (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons on delete cascade,
  kind text not null check (kind in ('regulation','responsibility','image_authorization','privacy','guardian_authorization','payment_policy','other')),
  title text not null,
  version integer not null default 1,
  content text not null,
  required boolean not null default true,
  status text not null default 'draft' check (status in ('draft','review','published','superseded','archived')),
  effective_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (season_id, kind, version)
);

create table public.term_acceptances (
  id uuid primary key default gen_random_uuid(),
  term_id uuid not null references public.terms on delete cascade,
  user_id uuid not null references public.profiles on delete cascade,
  driver_id uuid references public.drivers on delete cascade,
  accepted_at timestamptz not null default now(),
  ip_address inet,
  user_agent text,
  signature_path text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index term_acceptances_unique
  on public.term_acceptances(term_id, user_id, coalesce(driver_id, '00000000-0000-0000-0000-000000000000'::uuid));

create table public.category_change_requests (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons on delete cascade,
  driver_id uuid not null references public.drivers on delete cascade,
  from_category_id uuid references public.categories on delete set null,
  to_category_id uuid not null references public.categories on delete restrict,
  effective_stage_id uuid references public.stages on delete set null,
  points_policy text not null default 'maintain' check (points_policy in ('transfer','zero','convert','maintain')),
  reason text not null,
  status text not null default 'submitted' check (status in ('draft','submitted','analysis','approved','rejected','cancelled','applied')),
  reviewed_by uuid references public.profiles on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  stage_id uuid not null references public.stages on delete cascade,
  category_id uuid references public.categories on delete set null,
  name text not null,
  kind text not null check (kind in ('practice','qualifying','super_pole','race','endurance')),
  starts_at timestamptz,
  status text not null default 'scheduled' check (status in ('scheduled','open','live','provisional','homologated','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (stage_id, name)
);

alter table public.results add column if not exists session_id uuid references public.sessions on delete set null;

create table public.checkins (
  id uuid primary key default gen_random_uuid(),
  stage_id uuid not null references public.stages on delete cascade,
  driver_id uuid not null references public.drivers on delete cascade,
  status text not null default 'expected' check (status in ('expected','present','late','absent','excused','blocked')),
  checked_in_at timestamptz,
  checked_in_by uuid references public.profiles on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (stage_id, driver_id)
);

create table public.kart_assignments (
  id uuid primary key default gen_random_uuid(),
  stage_id uuid not null references public.stages on delete cascade,
  session_id uuid references public.sessions on delete cascade,
  driver_id uuid references public.drivers on delete cascade,
  team_id uuid references public.endurance_teams on delete cascade,
  kart_number integer not null check (kart_number between 1 and 999),
  status text not null default 'assigned' check (status in ('assigned','confirmed','changed','returned','cancelled')),
  assigned_by uuid references public.profiles on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (driver_id is not null or team_id is not null)
);

create unique index kart_assignments_driver_unique
  on public.kart_assignments(session_id, driver_id)
  where driver_id is not null;
create unique index kart_assignments_team_unique
  on public.kart_assignments(session_id, team_id)
  where team_id is not null;

create table public.sponsor_campaigns (
  id uuid primary key default gen_random_uuid(),
  championship_id uuid not null references public.championships on delete cascade,
  sponsor_id uuid not null references public.sponsors on delete cascade,
  title text not null,
  kind text not null default 'promotion' check (kind in ('promotion','coupon','banner','lead_campaign','event_activation','content')),
  status text not null default 'draft' check (status in ('draft','approval','adjustments','approved','scheduled','published','ended','cancelled')),
  starts_at timestamptz,
  ends_at timestamptz,
  coupon_code text,
  target_url text,
  content jsonb not null default '{}'::jsonb,
  metrics jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cms_versions (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.cms_pages on delete cascade,
  version integer not null,
  content jsonb not null,
  status text not null default 'draft' check (status in ('draft','review','approved','published','archived')),
  created_by uuid references public.profiles on delete set null,
  created_at timestamptz not null default now(),
  unique (page_id, version)
);

create index guardian_links_driver_status_idx on public.guardian_links(driver_id, status);
create index terms_season_status_idx on public.terms(season_id, status);
create index category_changes_season_status_idx on public.category_change_requests(season_id, status);
create index sessions_stage_status_idx on public.sessions(stage_id, status);
create index checkins_stage_status_idx on public.checkins(stage_id, status);
create index kart_assignments_stage_idx on public.kart_assignments(stage_id, session_id);
create index sponsor_campaigns_scope_idx on public.sponsor_campaigns(championship_id, sponsor_id, status);
create index cms_versions_page_idx on public.cms_versions(page_id, version desc);

create trigger guardian_links_updated before update on public.guardian_links for each row execute function public.set_updated_at();
create trigger terms_updated before update on public.terms for each row execute function public.set_updated_at();
create trigger category_change_requests_updated before update on public.category_change_requests for each row execute function public.set_updated_at();
create trigger sessions_updated before update on public.sessions for each row execute function public.set_updated_at();
create trigger checkins_updated before update on public.checkins for each row execute function public.set_updated_at();
create trigger kart_assignments_updated before update on public.kart_assignments for each row execute function public.set_updated_at();
create trigger sponsor_campaigns_updated before update on public.sponsor_campaigns for each row execute function public.set_updated_at();

alter table public.guardian_links enable row level security;
alter table public.terms enable row level security;
alter table public.term_acceptances enable row level security;
alter table public.category_change_requests enable row level security;
alter table public.sessions enable row level security;
alter table public.checkins enable row level security;
alter table public.kart_assignments enable row level security;
alter table public.sponsor_campaigns enable row level security;
alter table public.cms_versions enable row level security;

create policy organization_championships_manage on public.championships for all to authenticated
  using (public.has_active_role(array['admin','organization'], id, null))
  with check (public.has_active_role(array['admin','organization'], id, null));
create policy organization_seasons_manage on public.seasons for all to authenticated
  using (public.has_active_role(array['admin','organization'], championship_id, id))
  with check (public.has_active_role(array['admin','organization'], championship_id, id));
create policy organization_categories_manage on public.categories for all to authenticated
  using (public.can_manage_season(season_id)) with check (public.can_manage_season(season_id));
create policy organization_stages_manage on public.stages for all to authenticated
  using (public.can_manage_season(season_id)) with check (public.can_manage_season(season_id));
create policy organization_drivers_manage on public.drivers for all to authenticated
  using (public.can_manage_season(season_id)) with check (public.can_manage_season(season_id));
create policy organization_roles_manage on public.user_roles for all to authenticated
  using (public.has_active_role(array['admin','organization'], championship_id, season_id))
  with check (public.has_active_role(array['admin','organization'], championship_id, season_id));

create policy staff_registrations_manage on public.registrations for all to authenticated
  using (exists (select 1 from public.drivers d where d.id = registrations.driver_id and public.can_manage_season(d.season_id)))
  with check (exists (select 1 from public.drivers d where d.id = registrations.driver_id and public.can_manage_season(d.season_id)));
create policy finance_payments_manage on public.payments for all to authenticated
  using (exists (
    select 1 from public.registrations r join public.drivers d on d.id = r.driver_id
    where r.id = payments.registration_id and public.can_finance_season(d.season_id)
  ))
  with check (exists (
    select 1 from public.registrations r join public.drivers d on d.id = r.driver_id
    where r.id = payments.registration_id and public.can_finance_season(d.season_id)
  ));
create policy finance_credits_manage on public.credits for all to authenticated
  using (exists (select 1 from public.drivers d where d.id = credits.driver_id and public.can_finance_season(d.season_id)))
  with check (exists (select 1 from public.drivers d where d.id = credits.driver_id and public.can_finance_season(d.season_id)));

create policy judging_results_manage on public.results for all to authenticated
  using (exists (select 1 from public.stages st where st.id = results.stage_id and public.can_judge_season(st.season_id)))
  with check (exists (select 1 from public.stages st where st.id = results.stage_id and public.can_judge_season(st.season_id)));
create policy judging_entries_manage on public.result_entries for all to authenticated
  using (exists (
    select 1 from public.results r join public.stages st on st.id = r.stage_id
    where r.id = result_entries.result_id and public.can_judge_season(st.season_id)
  ))
  with check (exists (
    select 1 from public.results r join public.stages st on st.id = r.stage_id
    where r.id = result_entries.result_id and public.can_judge_season(st.season_id)
  ));
create policy judging_standings_manage on public.standings for all to authenticated
  using (public.can_judge_season(season_id)) with check (public.can_judge_season(season_id));
create policy judging_penalties_manage on public.penalties for all to authenticated
  using (exists (select 1 from public.stages st where st.id = penalties.stage_id and public.can_judge_season(st.season_id)))
  with check (exists (select 1 from public.stages st where st.id = penalties.stage_id and public.can_judge_season(st.season_id)));
create policy judging_appeals_manage on public.appeals for all to authenticated
  using (exists (
    select 1 from public.penalties p join public.stages st on st.id = p.stage_id
    where p.id = appeals.penalty_id and public.can_judge_season(st.season_id)
  ))
  with check (exists (
    select 1 from public.penalties p join public.stages st on st.id = p.stage_id
    where p.id = appeals.penalty_id and public.can_judge_season(st.season_id)
  ));
create policy judging_imports_manage on public.import_batches for all to authenticated
  using (exists (select 1 from public.stages st where st.id = import_batches.stage_id and public.can_judge_season(st.season_id)))
  with check (exists (select 1 from public.stages st where st.id = import_batches.stage_id and public.can_judge_season(st.season_id)));
create policy judging_laps_manage on public.laps for all to authenticated
  using (exists (
    select 1 from public.results r join public.stages st on st.id = r.stage_id
    where r.id = laps.result_id and public.can_judge_season(st.season_id)
  ))
  with check (exists (
    select 1 from public.results r join public.stages st on st.id = r.stage_id
    where r.id = laps.result_id and public.can_judge_season(st.season_id)
  ));

create policy operations_teams_manage on public.endurance_teams for all to authenticated
  using (exists (select 1 from public.stages st where st.id = endurance_teams.stage_id and public.can_marshal_season(st.season_id)))
  with check (exists (select 1 from public.stages st where st.id = endurance_teams.stage_id and public.can_marshal_season(st.season_id)));
create policy operations_members_manage on public.endurance_members for all to authenticated
  using (exists (
    select 1 from public.endurance_teams team join public.stages st on st.id = team.stage_id
    where team.id = endurance_members.team_id and public.can_marshal_season(st.season_id)
  ))
  with check (exists (
    select 1 from public.endurance_teams team join public.stages st on st.id = team.stage_id
    where team.id = endurance_members.team_id and public.can_marshal_season(st.season_id)
  ));
create policy operations_stints_manage on public.stints for all to authenticated
  using (exists (
    select 1 from public.endurance_teams team join public.stages st on st.id = team.stage_id
    where team.id = stints.team_id and public.can_marshal_season(st.season_id)
  ))
  with check (exists (
    select 1 from public.endurance_teams team join public.stages st on st.id = team.stage_id
    where team.id = stints.team_id and public.can_marshal_season(st.season_id)
  ));
create policy operations_incidents_manage on public.incidents for all to authenticated
  using (exists (select 1 from public.stages st where st.id = incidents.stage_id and public.has_active_role(array['admin','organization','judge','marshal'], null, st.season_id)))
  with check (exists (select 1 from public.stages st where st.id = incidents.stage_id and public.has_active_role(array['admin','organization','judge','marshal'], null, st.season_id)));
create policy operations_evidence_manage on public.evidence for all to authenticated
  using (exists (
    select 1 from public.incidents i join public.stages st on st.id = i.stage_id
    where i.id = evidence.incident_id and public.has_active_role(array['admin','organization','judge','marshal'], null, st.season_id)
  ))
  with check (exists (
    select 1 from public.incidents i join public.stages st on st.id = i.stage_id
    where i.id = evidence.incident_id and public.has_active_role(array['admin','organization','judge','marshal'], null, st.season_id)
  ));

create policy content_sponsors_manage on public.sponsors for all to authenticated
  using (public.can_edit_championship(championship_id)) with check (public.can_edit_championship(championship_id));
create policy content_cms_manage on public.cms_pages for all to authenticated
  using (public.can_edit_championship(championship_id)) with check (public.can_edit_championship(championship_id));

create policy guardian_links_participant_read on public.guardian_links for select to authenticated
  using (
    guardian_id = auth.uid()
    or exists (select 1 from public.drivers d where d.id = guardian_links.driver_id and d.profile_id = auth.uid())
    or exists (select 1 from public.drivers d where d.id = guardian_links.driver_id and public.can_manage_season(d.season_id))
  );
create policy guardian_links_staff_manage on public.guardian_links for all to authenticated
  using (exists (select 1 from public.drivers d where d.id = guardian_links.driver_id and public.can_manage_season(d.season_id)))
  with check (exists (select 1 from public.drivers d where d.id = guardian_links.driver_id and public.can_manage_season(d.season_id)));

create policy guardian_driver_read on public.drivers for select to authenticated
  using (exists (
    select 1 from public.guardian_links gl
    where gl.driver_id = drivers.id and gl.guardian_id = auth.uid() and gl.status = 'approved'
  ));
create policy guardian_registrations_manage on public.registrations for all to authenticated
  using (exists (
    select 1 from public.guardian_links gl
    where gl.driver_id = registrations.driver_id and gl.guardian_id = auth.uid() and gl.status = 'approved'
  ))
  with check (exists (
    select 1 from public.guardian_links gl
    where gl.driver_id = registrations.driver_id and gl.guardian_id = auth.uid() and gl.status = 'approved'
  ));
create policy guardian_documents_manage on public.documents for all to authenticated
  using (exists (
    select 1 from public.guardian_links gl
    where gl.driver_id = documents.driver_id and gl.guardian_id = auth.uid() and gl.status = 'approved'
  ))
  with check (exists (
    select 1 from public.guardian_links gl
    where gl.driver_id = documents.driver_id and gl.guardian_id = auth.uid() and gl.status = 'approved'
  ));
create policy guardian_payments_read on public.payments for select to authenticated
  using (exists (
    select 1
    from public.registrations r
    join public.guardian_links gl on gl.driver_id = r.driver_id
    where r.id = payments.registration_id and gl.guardian_id = auth.uid() and gl.status = 'approved'
  ));
create policy guardian_credits_read on public.credits for select to authenticated
  using (exists (
    select 1 from public.guardian_links gl
    where gl.driver_id = credits.driver_id and gl.guardian_id = auth.uid() and gl.status = 'approved'
  ));

create policy published_terms_read on public.terms for select to authenticated using (status = 'published');
create policy staff_terms_manage on public.terms for all to authenticated
  using (public.can_manage_season(season_id)) with check (public.can_manage_season(season_id));
create policy own_term_acceptances_read on public.term_acceptances for select to authenticated using (user_id = auth.uid());
create policy own_term_acceptances_insert on public.term_acceptances for insert to authenticated with check (
  user_id = auth.uid()
  and (
    driver_id is null
    or exists (select 1 from public.drivers d where d.id = driver_id and d.profile_id = auth.uid())
    or exists (select 1 from public.guardian_links gl where gl.driver_id = driver_id and gl.guardian_id = auth.uid() and gl.status = 'approved')
  )
);
create policy staff_term_acceptances_read on public.term_acceptances for select to authenticated using (
  exists (select 1 from public.terms t where t.id = term_acceptances.term_id and public.can_manage_season(t.season_id))
);

create policy category_change_participant on public.category_change_requests for all to authenticated
  using (
    exists (select 1 from public.drivers d where d.id = category_change_requests.driver_id and d.profile_id = auth.uid())
    or exists (select 1 from public.guardian_links gl where gl.driver_id = category_change_requests.driver_id and gl.guardian_id = auth.uid() and gl.status = 'approved')
    or public.can_manage_season(season_id)
  )
  with check (
    exists (select 1 from public.drivers d where d.id = category_change_requests.driver_id and d.profile_id = auth.uid())
    or exists (select 1 from public.guardian_links gl where gl.driver_id = category_change_requests.driver_id and gl.guardian_id = auth.uid() and gl.status = 'approved')
    or public.can_manage_season(season_id)
  );

create policy public_sessions_read on public.sessions for select using (exists (
  select 1 from public.stages st where st.id = sessions.stage_id and st.status <> 'cancelled'
));
create policy staff_sessions_manage on public.sessions for all to authenticated
  using (exists (select 1 from public.stages st where st.id = sessions.stage_id and public.has_active_role(array['admin','organization','judge','marshal'], null, st.season_id)))
  with check (exists (select 1 from public.stages st where st.id = sessions.stage_id and public.has_active_role(array['admin','organization','judge','marshal'], null, st.season_id)));

create policy checkins_participant_read on public.checkins for select to authenticated
  using (
    exists (select 1 from public.drivers d where d.id = checkins.driver_id and d.profile_id = auth.uid())
    or exists (select 1 from public.guardian_links gl where gl.driver_id = checkins.driver_id and gl.guardian_id = auth.uid() and gl.status = 'approved')
    or exists (select 1 from public.stages st where st.id = checkins.stage_id and public.can_marshal_season(st.season_id))
  );
create policy checkins_staff_manage on public.checkins for all to authenticated
  using (exists (select 1 from public.stages st where st.id = checkins.stage_id and public.can_marshal_season(st.season_id)))
  with check (exists (select 1 from public.stages st where st.id = checkins.stage_id and public.can_marshal_season(st.season_id)));

create policy kart_assignments_participant_read on public.kart_assignments for select to authenticated
  using (
    exists (select 1 from public.drivers d where d.id = kart_assignments.driver_id and d.profile_id = auth.uid())
    or exists (select 1 from public.guardian_links gl where gl.driver_id = kart_assignments.driver_id and gl.guardian_id = auth.uid() and gl.status = 'approved')
    or exists (select 1 from public.stages st where st.id = kart_assignments.stage_id and public.can_marshal_season(st.season_id))
  );
create policy kart_assignments_staff_manage on public.kart_assignments for all to authenticated
  using (exists (select 1 from public.stages st where st.id = kart_assignments.stage_id and public.can_marshal_season(st.season_id)))
  with check (exists (select 1 from public.stages st where st.id = kart_assignments.stage_id and public.can_marshal_season(st.season_id)));

create policy public_sponsor_campaigns on public.sponsor_campaigns for select using (status in ('published','ended'));
create policy content_sponsor_campaigns_manage on public.sponsor_campaigns for all to authenticated
  using (public.can_edit_championship(championship_id)) with check (public.can_edit_championship(championship_id));
create policy content_cms_versions_manage on public.cms_versions for all to authenticated
  using (exists (select 1 from public.cms_pages page where page.id = cms_versions.page_id and public.can_edit_championship(page.championship_id)))
  with check (exists (select 1 from public.cms_pages page where page.id = cms_versions.page_id and public.can_edit_championship(page.championship_id)));

create trigger audit_guardian_links after insert or update or delete on public.guardian_links for each row execute function public.audit_row_change();
create trigger audit_terms after insert or update or delete on public.terms for each row execute function public.audit_row_change();
create trigger audit_term_acceptances after insert or update or delete on public.term_acceptances for each row execute function public.audit_row_change();
create trigger audit_category_changes after insert or update or delete on public.category_change_requests for each row execute function public.audit_row_change();
create trigger audit_sessions after insert or update or delete on public.sessions for each row execute function public.audit_row_change();
create trigger audit_checkins after insert or update or delete on public.checkins for each row execute function public.audit_row_change();
create trigger audit_kart_assignments after insert or update or delete on public.kart_assignments for each row execute function public.audit_row_change();
create trigger audit_sponsor_campaigns after insert or update or delete on public.sponsor_campaigns for each row execute function public.audit_row_change();
create trigger audit_cms_versions after insert or update or delete on public.cms_versions for each row execute function public.audit_row_change();

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values
  ('timing-imports','timing-imports',false,52428800,array['application/pdf','text/csv','application/vnd.ms-excel']),
  ('signatures','signatures',false,15728640,array['image/jpeg','image/png','application/pdf'])
on conflict (id) do nothing;

create policy timing_imports_staff on storage.objects for all to authenticated
using (
  bucket_id = 'timing-imports'
  and public.has_active_role(array['admin','organization','judge'])
)
with check (
  bucket_id = 'timing-imports'
  and public.has_active_role(array['admin','organization','judge'])
);

create policy signatures_own_write on storage.objects for insert to authenticated
with check (bucket_id = 'signatures' and (storage.foldername(name))[1] = auth.uid()::text);
create policy signatures_own_read on storage.objects for select to authenticated
using (bucket_id = 'signatures' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
