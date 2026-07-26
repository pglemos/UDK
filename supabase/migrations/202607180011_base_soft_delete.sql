alter table public.championships add column if not exists deleted_at timestamptz;
alter table public.seasons add column if not exists deleted_at timestamptz;
alter table public.categories add column if not exists deleted_at timestamptz;
alter table public.profiles add column if not exists deleted_at timestamptz;
alter table public.user_roles add column if not exists deleted_at timestamptz;
alter table public.notification_preferences add column if not exists deleted_at timestamptz;

create index if not exists championships_active_idx on public.championships(slug) where deleted_at is null;
create index if not exists seasons_active_idx on public.seasons(championship_id, year) where deleted_at is null;
create index if not exists categories_active_idx on public.categories(season_id, slug) where deleted_at is null;
create index if not exists profiles_active_idx on public.profiles(full_name) where deleted_at is null;
create index if not exists user_roles_active_idx on public.user_roles(user_id, role) where deleted_at is null;

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
join public.seasons season on season.id = stage.season_id and season.deleted_at is null
join public.championships championship on championship.id = season.championship_id and championship.deleted_at is null
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
join public.drivers driver on driver.id = standing.driver_id and driver.deleted_at is null
join public.categories category on category.id = standing.category_id and category.deleted_at is null
join public.seasons season on season.id = standing.season_id and season.deleted_at is null
join public.championships championship on championship.id = season.championship_id and championship.deleted_at is null
where standing.deleted_at is null
  and driver.public_profile
  and driver.status = 'approved'
  and standing.status in ('provisional','official','rectified');

grant select on public.public_calendar, public.public_standings to anon, authenticated;
