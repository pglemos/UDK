alter table public.drivers add column if not exists deleted_at timestamptz;
alter table public.registrations add column if not exists deleted_at timestamptz;
alter table public.documents add column if not exists deleted_at timestamptz;
alter table public.payments add column if not exists deleted_at timestamptz;
alter table public.credits add column if not exists deleted_at timestamptz;
alter table public.stages add column if not exists deleted_at timestamptz;
alter table public.stages add column if not exists registration_opens_at timestamptz;
alter table public.stages add column if not exists registration_closes_at timestamptz;
alter table public.sessions add column if not exists deleted_at timestamptz;
alter table public.checkins add column if not exists deleted_at timestamptz;
alter table public.kart_assignments add column if not exists deleted_at timestamptz;
alter table public.results add column if not exists deleted_at timestamptz;
alter table public.result_entries add column if not exists deleted_at timestamptz;
alter table public.standings add column if not exists deleted_at timestamptz;
alter table public.points_rules add column if not exists deleted_at timestamptz;
alter table public.import_batches add column if not exists deleted_at timestamptz;
alter table public.laps add column if not exists deleted_at timestamptz;
alter table public.incidents add column if not exists deleted_at timestamptz;
alter table public.evidence add column if not exists deleted_at timestamptz;
alter table public.penalties add column if not exists deleted_at timestamptz;
alter table public.appeals add column if not exists deleted_at timestamptz;
alter table public.endurance_teams add column if not exists deleted_at timestamptz;
alter table public.endurance_members add column if not exists deleted_at timestamptz;
alter table public.stints add column if not exists deleted_at timestamptz;
alter table public.guardian_links add column if not exists deleted_at timestamptz;
alter table public.terms add column if not exists deleted_at timestamptz;
alter table public.term_acceptances add column if not exists deleted_at timestamptz;
alter table public.category_change_requests add column if not exists deleted_at timestamptz;
alter table public.sponsors add column if not exists deleted_at timestamptz;
alter table public.sponsor_users add column if not exists deleted_at timestamptz;
alter table public.sponsor_campaigns add column if not exists deleted_at timestamptz;
alter table public.cms_pages add column if not exists deleted_at timestamptz;
alter table public.cms_versions add column if not exists deleted_at timestamptz;
alter table public.notifications add column if not exists deleted_at timestamptz;
alter table public.role_permissions add column if not exists deleted_at timestamptz;

create index if not exists drivers_active_idx on public.drivers(season_id, status) where deleted_at is null;
create index if not exists registrations_active_idx on public.registrations(stage_id, status) where deleted_at is null;
create index if not exists stages_active_idx on public.stages(season_id, starts_at) where deleted_at is null;
create index if not exists sessions_active_idx on public.sessions(stage_id, starts_at) where deleted_at is null;
create index if not exists results_active_idx on public.results(stage_id, category_id, version desc) where deleted_at is null;
create index if not exists standings_active_idx on public.standings(season_id, category_id, version desc) where deleted_at is null;
create index if not exists incidents_active_idx on public.incidents(stage_id, status) where deleted_at is null;
create index if not exists endurance_teams_active_idx on public.endurance_teams(stage_id, status) where deleted_at is null;
create index if not exists sponsors_active_idx on public.sponsors(championship_id, status) where deleted_at is null;
create index if not exists cms_pages_active_idx on public.cms_pages(championship_id, status) where deleted_at is null;

create or replace view public.public_calendar as
select
  stage.id,
  stage.title,
  stage.format,
  stage.track,
  stage.starts_at,
  upper(to_char(stage.starts_at at time zone 'America/Sao_Paulo', 'DD MON')) as date_label,
  to_char(stage.starts_at at time zone 'America/Sao_Paulo', 'HH24"h"') as time_label,
  stage.registration_opens_at,
  stage.registration_closes_at,
  stage.status,
  season.name as season,
  championship.slug as championship_slug
from public.stages stage
join public.seasons season on season.id = stage.season_id
join public.championships championship on championship.id = season.championship_id
where stage.deleted_at is null
  and stage.status <> 'cancelled';

create or replace view public.public_standings as
with latest_versions as (
  select season_id, category_id, max(version) as version
  from public.standings
  where deleted_at is null
    and status in ('provisional','official','rectified')
  group by season_id, category_id
)
select
  driver.slug,
  driver.sport_name as name,
  driver.number,
  category.name as category,
  standing.points,
  standing.wins,
  standing.podiums,
  standing.position
from public.standings standing
join latest_versions latest
  on latest.season_id = standing.season_id
 and latest.category_id = standing.category_id
 and latest.version = standing.version
join public.drivers driver on driver.id = standing.driver_id
join public.categories category on category.id = standing.category_id
where standing.deleted_at is null
  and driver.deleted_at is null
  and driver.public_profile
  and driver.status = 'approved'
  and standing.status in ('provisional','official','rectified');

create or replace view public.public_results as
with latest_results as (
  select distinct on (result.stage_id, coalesce(result.category_id, '00000000-0000-0000-0000-000000000000'::uuid))
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
join public.stages stage on stage.id = result.stage_id and stage.deleted_at is null
left join public.categories category on category.id = result.category_id;

grant select on public.public_calendar, public.public_standings, public.public_results to anon, authenticated;
