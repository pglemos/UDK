create table public.sponsor_users (
  id uuid primary key default gen_random_uuid(),
  sponsor_id uuid not null references public.sponsors on delete cascade,
  user_id uuid not null references public.profiles on delete cascade,
  member_role text not null default 'viewer' check (member_role in ('owner','manager','analyst','viewer')),
  status text not null default 'active' check (status in ('invited','active','suspended','revoked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (sponsor_id, user_id)
);

create table public.role_permissions (
  id uuid primary key default gen_random_uuid(),
  user_role_id uuid not null references public.user_roles on delete cascade,
  category_id uuid references public.categories on delete cascade,
  stage_id uuid references public.stages on delete cascade,
  session_id uuid references public.sessions on delete cascade,
  module text not null,
  action text not null check (action in ('read','create','update','delete','approve','publish','homologate','export','manage')),
  allowed boolean not null default true,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index role_permissions_scope_unique on public.role_permissions (
  user_role_id,
  coalesce(category_id, '00000000-0000-0000-0000-000000000000'::uuid),
  coalesce(stage_id, '00000000-0000-0000-0000-000000000000'::uuid),
  coalesce(session_id, '00000000-0000-0000-0000-000000000000'::uuid),
  module,
  action
);
create index sponsor_users_user_status_idx on public.sponsor_users(user_id, status);
create index role_permissions_role_module_idx on public.role_permissions(user_role_id, module, action);

create trigger sponsor_users_updated before update on public.sponsor_users for each row execute function public.set_updated_at();
create trigger role_permissions_updated before update on public.role_permissions for each row execute function public.set_updated_at();

alter table public.sponsor_users enable row level security;
alter table public.role_permissions enable row level security;

create or replace function public.can_module_action(
  p_module text,
  p_action text,
  p_category_id uuid default null,
  p_stage_id uuid default null,
  p_session_id uuid default null
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
      and (ur.expires_at is null or ur.expires_at > now())
      and (
        ur.role = 'admin'
        or not exists (
          select 1
          from public.role_permissions denied
          where denied.user_role_id = ur.id
            and denied.module = p_module
            and denied.action in (p_action, 'manage')
            and denied.allowed = false
            and (denied.expires_at is null or denied.expires_at > now())
            and (denied.category_id is null or denied.category_id = p_category_id)
            and (denied.stage_id is null or denied.stage_id = p_stage_id)
            and (denied.session_id is null or denied.session_id = p_session_id)
        )
      )
      and (
        ur.role = 'admin'
        or not exists (
          select 1 from public.role_permissions configured
          where configured.user_role_id = ur.id
        )
        or exists (
          select 1
          from public.role_permissions granted
          where granted.user_role_id = ur.id
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
$$;

grant execute on function public.can_module_action(text, text, uuid, uuid, uuid) to authenticated;

create policy sponsor_users_own_read on public.sponsor_users
for select to authenticated
using (user_id = auth.uid());

create policy sponsor_users_staff_manage on public.sponsor_users
for all to authenticated
using (
  exists (
    select 1 from public.sponsors sponsor
    where sponsor.id = sponsor_users.sponsor_id
      and public.can_edit_championship(sponsor.championship_id)
  )
)
with check (
  exists (
    select 1 from public.sponsors sponsor
    where sponsor.id = sponsor_users.sponsor_id
      and public.can_edit_championship(sponsor.championship_id)
  )
);

create policy sponsor_own_company_read on public.sponsors
for select to authenticated
using (
  exists (
    select 1 from public.sponsor_users membership
    where membership.sponsor_id = sponsors.id
      and membership.user_id = auth.uid()
      and membership.status = 'active'
  )
);

create policy sponsor_own_campaigns_read on public.sponsor_campaigns
for select to authenticated
using (
  exists (
    select 1 from public.sponsor_users membership
    where membership.sponsor_id = sponsor_campaigns.sponsor_id
      and membership.user_id = auth.uid()
      and membership.status = 'active'
  )
);

create policy role_permissions_own_read on public.role_permissions
for select to authenticated
using (
  exists (
    select 1 from public.user_roles role_row
    where role_row.id = role_permissions.user_role_id
      and role_row.user_id = auth.uid()
  )
);

create policy role_permissions_staff_manage on public.role_permissions
for all to authenticated
using (
  exists (
    select 1 from public.user_roles role_row
    where role_row.id = role_permissions.user_role_id
      and public.has_active_role(array['admin','organization'], role_row.championship_id, role_row.season_id)
  )
)
with check (
  exists (
    select 1 from public.user_roles role_row
    where role_row.id = role_permissions.user_role_id
      and public.has_active_role(array['admin','organization'], role_row.championship_id, role_row.season_id)
  )
);

create policy involved_penalties_read on public.penalties
for select to authenticated
using (
  exists (
    select 1 from public.drivers driver
    where driver.id = penalties.driver_id
      and driver.profile_id = auth.uid()
  )
  or exists (
    select 1 from public.guardian_links guardian
    where guardian.driver_id = penalties.driver_id
      and guardian.guardian_id = auth.uid()
      and guardian.status = 'approved'
  )
);

create policy guardian_appeals_manage on public.appeals
for all to authenticated
using (
  exists (
    select 1 from public.guardian_links guardian
    where guardian.driver_id = appeals.driver_id
      and guardian.guardian_id = auth.uid()
      and guardian.status = 'approved'
  )
)
with check (
  exists (
    select 1 from public.guardian_links guardian
    where guardian.driver_id = appeals.driver_id
      and guardian.guardian_id = auth.uid()
      and guardian.status = 'approved'
  )
);

create trigger audit_sponsor_users after insert or update or delete on public.sponsor_users for each row execute function public.audit_row_change();
create trigger audit_role_permissions after insert or update or delete on public.role_permissions for each row execute function public.audit_row_change();
