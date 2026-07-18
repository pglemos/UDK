create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end
$$;

create table public.championships (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  status text not null default 'draft' check (status in ('draft','active','closed','archived')),
  primary_color text not null default '#DAFC08',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.seasons (
  id uuid primary key default gen_random_uuid(),
  championship_id uuid not null references public.championships on delete cascade,
  name text not null,
  year integer not null,
  status text not null default 'draft' check (status in ('draft','registration','active','homologated','archived')),
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (championship_id, year)
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons on delete cascade,
  slug text not null,
  name text not null,
  color text not null default '#DAFC08',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (season_id, slug)
);

create table public.stages (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons on delete cascade,
  title text not null,
  format text not null check (format in ('regular','endurance','special')),
  track text not null,
  starts_at timestamptz not null,
  status text not null default 'scheduled' check (status in ('scheduled','registration','live','provisional','homologated','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text not null default '',
  sport_name text not null default '',
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles on delete cascade,
  role text not null check (role in ('admin','organization','judge','marshal','finance','editor','sponsor','driver','guardian')),
  championship_id uuid references public.championships on delete cascade,
  season_id uuid references public.seasons on delete cascade,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index user_roles_scope_unique on public.user_roles (
  user_id,
  role,
  coalesce(championship_id, '00000000-0000-0000-0000-000000000000'::uuid),
  coalesce(season_id, '00000000-0000-0000-0000-000000000000'::uuid)
);

create table public.drivers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique references public.profiles on delete set null,
  season_id uuid not null references public.seasons on delete cascade,
  category_id uuid references public.categories on delete set null,
  slug text not null,
  full_name text not null,
  sport_name text not null,
  number integer not null check (number between 0 and 999),
  status text not null default 'pending' check (status in ('pending','approved','suspended','archived')),
  public_profile boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (season_id, slug),
  unique (season_id, category_id, number)
);

create table public.registrations (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references public.drivers on delete cascade,
  stage_id uuid references public.stages on delete cascade,
  kind text not null check (kind in ('season','regular','endurance')),
  requested_category_id uuid references public.categories,
  approved_category_id uuid references public.categories,
  status text not null default 'draft' check (status in ('draft','submitted','documents_pending','payment_pending','analysis','approved','rejected','cancelled','homologated')),
  amount_cents integer not null check (amount_cents >= 0),
  protocol text not null unique default upper(substr(replace(gen_random_uuid()::text,'-',''),1,12)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null references public.registrations on delete cascade,
  amount_cents integer not null check (amount_cents >= 0),
  method text not null default 'pix',
  status text not null default 'pending' check (status in ('pending','proof_sent','analysis','approved','rejected','refunded','cancelled')),
  proof_path text,
  reviewed_by uuid references public.profiles,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.results (
  id uuid primary key default gen_random_uuid(),
  stage_id uuid not null references public.stages on delete cascade,
  category_id uuid references public.categories on delete set null,
  title text not null,
  status text not null default 'draft' check (status in ('draft','analysis','provisional','homologated','published','rectified')),
  version integer not null default 1,
  fastest_lap_ms integer,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (stage_id, category_id, version)
);

create table public.result_entries (
  id uuid primary key default gen_random_uuid(),
  result_id uuid not null references public.results on delete cascade,
  driver_id uuid not null references public.drivers on delete cascade,
  position integer not null check (position > 0),
  kart_number integer,
  laps integer not null default 0,
  total_time_ms bigint,
  best_lap_ms integer,
  penalty_ms integer not null default 0,
  status text not null default 'classified',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (result_id, position),
  unique (result_id, driver_id)
);

create table public.standings (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons on delete cascade,
  category_id uuid not null references public.categories on delete cascade,
  driver_id uuid not null references public.drivers on delete cascade,
  points numeric(8,2) not null default 0,
  gross_points numeric(8,2) not null default 0,
  wins integer not null default 0,
  podiums integer not null default 0,
  poles integer not null default 0,
  position integer not null,
  version integer not null default 1,
  status text not null default 'official' check (status in ('provisional','official','rectified')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (season_id, category_id, driver_id, version)
);

create table public.penalties (
  id uuid primary key default gen_random_uuid(),
  stage_id uuid not null references public.stages on delete cascade,
  driver_id uuid references public.drivers on delete cascade,
  code text not null,
  summary text not null,
  effect text not null,
  status text not null default 'provisional' check (status in ('draft','provisional','homologated','appealed','annulled','closed')),
  public_visibility text not null default 'effect' check (public_visibility in ('private','effect','summary','full')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.appeals (
  id uuid primary key default gen_random_uuid(),
  penalty_id uuid not null references public.penalties on delete cascade,
  driver_id uuid not null references public.drivers on delete cascade,
  protocol text not null unique default upper(substr(replace(gen_random_uuid()::text,'-',''),1,12)),
  statement text not null,
  status text not null default 'filed' check (status in ('filed','triage','analysis','awaiting_evidence','granted','denied','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.endurance_teams (
  id uuid primary key default gen_random_uuid(),
  stage_id uuid not null references public.stages on delete cascade,
  name text not null,
  number integer,
  category_id uuid references public.categories,
  status text not null default 'forming' check (status in ('forming','analysis','homologated','rejected','cancelled','disqualified')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (stage_id, name)
);

create table public.endurance_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.endurance_teams on delete cascade,
  driver_id uuid not null references public.drivers on delete cascade,
  member_role text not null default 'starter' check (member_role in ('captain','starter','reserve')),
  status text not null default 'invited' check (status in ('invited','accepted','declined','approved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (team_id, driver_id)
);

create table public.stints (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.endurance_teams on delete cascade,
  driver_id uuid not null references public.drivers on delete cascade,
  sequence integer not null,
  started_at timestamptz,
  ended_at timestamptz,
  laps integer not null default 0,
  status text not null default 'planned' check (status in ('planned','requested','confirmed','running','closed','corrected','invalid')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (team_id, sequence)
);

create table public.sponsors (
  id uuid primary key default gen_random_uuid(),
  championship_id uuid not null references public.championships on delete cascade,
  name text not null,
  slug text not null,
  logo_url text,
  website_url text,
  tier text not null default 'supporter',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (championship_id, slug)
);

create table public.cms_pages (
  id uuid primary key default gen_random_uuid(),
  championship_id uuid not null references public.championships on delete cascade,
  slug text not null,
  title text not null,
  content jsonb not null default '[]'::jsonb,
  status text not null default 'draft' check (status in ('draft','review','approved','scheduled','published','archived')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (championship_id, slug)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles on delete cascade,
  title text not null,
  body text not null,
  kind text not null default 'general',
  read_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles on delete set null,
  entity_type text not null,
  entity_id uuid,
  action text not null,
  before_data jsonb,
  after_data jsonb,
  reason text,
  created_at timestamptz not null default now()
);

create index seasons_championship_idx on public.seasons(championship_id);
create index categories_season_idx on public.categories(season_id);
create index stages_season_start_idx on public.stages(season_id, starts_at);
create index drivers_scope_idx on public.drivers(season_id, category_id);
create index registrations_driver_stage_idx on public.registrations(driver_id, stage_id);
create index results_stage_status_idx on public.results(stage_id, status);
create index standings_scope_idx on public.standings(season_id, category_id, position);
create index roles_user_role_idx on public.user_roles(user_id, role);

create trigger championships_updated before update on public.championships for each row execute function public.set_updated_at();
create trigger seasons_updated before update on public.seasons for each row execute function public.set_updated_at();
create trigger categories_updated before update on public.categories for each row execute function public.set_updated_at();
create trigger stages_updated before update on public.stages for each row execute function public.set_updated_at();
create trigger profiles_updated before update on public.profiles for each row execute function public.set_updated_at();
create trigger roles_updated before update on public.user_roles for each row execute function public.set_updated_at();
create trigger drivers_updated before update on public.drivers for each row execute function public.set_updated_at();
create trigger registrations_updated before update on public.registrations for each row execute function public.set_updated_at();
create trigger payments_updated before update on public.payments for each row execute function public.set_updated_at();
create trigger results_updated before update on public.results for each row execute function public.set_updated_at();
create trigger entries_updated before update on public.result_entries for each row execute function public.set_updated_at();
create trigger standings_updated before update on public.standings for each row execute function public.set_updated_at();
create trigger penalties_updated before update on public.penalties for each row execute function public.set_updated_at();
create trigger appeals_updated before update on public.appeals for each row execute function public.set_updated_at();
create trigger teams_updated before update on public.endurance_teams for each row execute function public.set_updated_at();
create trigger members_updated before update on public.endurance_members for each row execute function public.set_updated_at();
create trigger stints_updated before update on public.stints for each row execute function public.set_updated_at();
create trigger sponsors_updated before update on public.sponsors for each row execute function public.set_updated_at();
create trigger cms_updated before update on public.cms_pages for each row execute function public.set_updated_at();
create trigger notifications_updated before update on public.notifications for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles(id, full_name, sport_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name',''),
    coalesce(new.raw_user_meta_data->>'sport_name', new.raw_user_meta_data->>'full_name','')
  );
  insert into public.user_roles(user_id, role) values (new.id, 'driver');
  return new;
end
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and role in ('admin','organization')
      and (expires_at is null or expires_at > now())
  )
$$;

alter table public.championships enable row level security;
alter table public.seasons enable row level security;
alter table public.categories enable row level security;
alter table public.stages enable row level security;
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.drivers enable row level security;
alter table public.registrations enable row level security;
alter table public.payments enable row level security;
alter table public.results enable row level security;
alter table public.result_entries enable row level security;
alter table public.standings enable row level security;
alter table public.penalties enable row level security;
alter table public.appeals enable row level security;
alter table public.endurance_teams enable row level security;
alter table public.endurance_members enable row level security;
alter table public.stints enable row level security;
alter table public.sponsors enable row level security;
alter table public.cms_pages enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_events enable row level security;

create policy public_championships on public.championships for select using (status in ('active','closed'));
create policy public_seasons on public.seasons for select using (status in ('registration','active','homologated'));
create policy public_categories on public.categories for select using (status = 'active');
create policy public_stages on public.stages for select using (status <> 'cancelled');
create policy public_drivers on public.drivers for select using (public_profile and status = 'approved');
create policy public_results on public.results for select using (status in ('provisional','homologated','published','rectified'));
create policy public_entries on public.result_entries for select using (
  exists (select 1 from public.results r where r.id = result_id and r.status in ('provisional','homologated','published','rectified'))
);
create policy public_standings on public.standings for select using (status in ('provisional','official','rectified'));
create policy public_sponsors on public.sponsors for select using (status = 'active');
create policy public_cms on public.cms_pages for select using (status = 'published' and published_at <= now());

create policy own_profile_select on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy own_profile_update on public.profiles for update using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());
create policy own_roles on public.user_roles for select using (user_id = auth.uid() or public.is_admin());
create policy own_driver on public.drivers for select using (profile_id = auth.uid() or public_profile or public.is_admin());
create policy own_registrations on public.registrations for all using (
  exists (select 1 from public.drivers d where d.id = driver_id and d.profile_id = auth.uid()) or public.is_admin()
) with check (
  exists (select 1 from public.drivers d where d.id = driver_id and d.profile_id = auth.uid()) or public.is_admin()
);
create policy own_payments on public.payments for select using (
  exists (
    select 1 from public.registrations r
    join public.drivers d on d.id = r.driver_id
    where r.id = registration_id and d.profile_id = auth.uid()
  ) or public.is_admin()
);
create policy own_notifications on public.notifications for all using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
create policy own_appeals on public.appeals for all using (
  exists (select 1 from public.drivers d where d.id = driver_id and d.profile_id = auth.uid()) or public.is_admin()
) with check (
  exists (select 1 from public.drivers d where d.id = driver_id and d.profile_id = auth.uid()) or public.is_admin()
);
create policy audit_insert on public.audit_events for insert to authenticated with check (actor_id = auth.uid());
create policy audit_admin_read on public.audit_events for select using (public.is_admin());

create policy admin_championships on public.championships for all using (public.is_admin()) with check (public.is_admin());
create policy admin_seasons on public.seasons for all using (public.is_admin()) with check (public.is_admin());
create policy admin_categories on public.categories for all using (public.is_admin()) with check (public.is_admin());
create policy admin_stages on public.stages for all using (public.is_admin()) with check (public.is_admin());
create policy admin_profiles on public.profiles for all using (public.is_admin()) with check (public.is_admin());
create policy admin_roles on public.user_roles for all using (public.is_admin()) with check (public.is_admin());
create policy admin_drivers on public.drivers for all using (public.is_admin()) with check (public.is_admin());
create policy admin_registrations on public.registrations for all using (public.is_admin()) with check (public.is_admin());
create policy admin_payments on public.payments for all using (public.is_admin()) with check (public.is_admin());
create policy admin_results on public.results for all using (public.is_admin()) with check (public.is_admin());
create policy admin_entries on public.result_entries for all using (public.is_admin()) with check (public.is_admin());
create policy admin_standings on public.standings for all using (public.is_admin()) with check (public.is_admin());
create policy admin_penalties on public.penalties for all using (public.is_admin()) with check (public.is_admin());
create policy admin_appeals on public.appeals for all using (public.is_admin()) with check (public.is_admin());
create policy admin_teams on public.endurance_teams for all using (public.is_admin()) with check (public.is_admin());
create policy admin_members on public.endurance_members for all using (public.is_admin()) with check (public.is_admin());
create policy admin_stints on public.stints for all using (public.is_admin()) with check (public.is_admin());
create policy admin_sponsors on public.sponsors for all using (public.is_admin()) with check (public.is_admin());
create policy admin_cms on public.cms_pages for all using (public.is_admin()) with check (public.is_admin());
create policy admin_notifications on public.notifications for all using (public.is_admin()) with check (public.is_admin());

create or replace view public.public_calendar as
select
  s.starts_at,
  to_char(s.starts_at at time zone 'America/Sao_Paulo', 'DD MON') as date_label,
  to_char(s.starts_at at time zone 'America/Sao_Paulo', 'HH24"h"MI') as time_label,
  s.title,
  s.track
from public.stages s
join public.seasons se on se.id = s.season_id
where se.status in ('registration','active','homologated')
  and s.status <> 'cancelled';

create or replace view public.public_standings as
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
join public.drivers d on d.id = st.driver_id
join public.categories c on c.id = st.category_id
where d.public_profile
  and d.status = 'approved'
  and st.status in ('provisional','official','rectified');

grant select on public.public_calendar, public.public_standings to anon, authenticated;

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values
  ('public-media','public-media',true,10485760,array['image/jpeg','image/png','image/webp','image/svg+xml']),
  ('private-documents','private-documents',false,26214400,array['image/jpeg','image/png','application/pdf'])
on conflict (id) do nothing;

create policy public_media_read on storage.objects for select using (bucket_id = 'public-media');
create policy admin_media_write on storage.objects for all to authenticated using (bucket_id = 'public-media' and public.is_admin()) with check (bucket_id = 'public-media' and public.is_admin());
create policy own_documents on storage.objects for all to authenticated using (
  bucket_id = 'private-documents' and (storage.foldername(name))[1] = auth.uid()::text
) with check (
  bucket_id = 'private-documents' and (storage.foldername(name))[1] = auth.uid()::text
);
