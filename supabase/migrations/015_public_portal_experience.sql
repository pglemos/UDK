alter table public.drivers
  add column if not exists avatar_url text,
  add column if not exists hero_image_url text,
  add column if not exists team_name text,
  add column if not exists city text,
  add column if not exists bio text,
  add column if not exists previous_position integer;

alter table public.stages
  add column if not exists slug text,
  add column if not exists location text,
  add column if not exists city text,
  add column if not exists track_map_url text,
  add column if not exists hero_image_url text,
  add column if not exists short_description text;

alter table public.cms_pages
  add column if not exists kind text,
  add column if not exists summary text,
  add column if not exists category text,
  add column if not exists cover_image_url text,
  add column if not exists seo_description text;

alter table public.terms
  add column if not exists download_url text;

update public.stages
set
  slug = coalesce(
    nullif(slug, ''),
    trim(both '-' from regexp_replace(lower(title), '[^a-z0-9]+', '-', 'g'))
      || '-' || left(id::text, 8)
  ),
  location = coalesce(nullif(location, ''), 'Kartódromo Internacional de Betim'),
  city = coalesce(nullif(city, ''), 'Betim/MG')
where slug is null
   or slug = ''
   or location is null
   or location = ''
   or city is null
   or city = '';

create unique index if not exists stages_public_slug_unique_idx
  on public.stages (slug)
  where deleted_at is null and slug is not null;

create index if not exists drivers_public_category_name_idx
  on public.drivers (category_id, sport_name)
  where deleted_at is null and public_profile = true;

create index if not exists standings_public_position_idx
  on public.standings (season_id, category_id, version, position)
  where deleted_at is null;

create index if not exists stages_public_starts_at_idx
  on public.stages (starts_at)
  where deleted_at is null;

create index if not exists cms_pages_public_kind_date_idx
  on public.cms_pages (kind, published_at desc)
  where deleted_at is null and status = 'published';

create or replace view public.public_portal_categories
with (security_invoker = true)
as
select
  category.slug,
  category.name,
  category.color
from public.categories category
join public.seasons season
  on season.id = category.season_id
 and season.deleted_at is null
join public.championships championship
  on championship.id = season.championship_id
 and championship.deleted_at is null
where category.deleted_at is null
  and category.status = 'active';

create or replace view public.public_portal_standings
with (security_invoker = true)
as
with latest_versions as (
  select
    season_id,
    category_id,
    max(version) as version
  from public.standings
  where deleted_at is null
    and status = any (array['provisional'::text, 'official'::text, 'rectified'::text])
  group by season_id, category_id
)
select
  driver.id,
  driver.slug,
  driver.sport_name as name,
  driver.full_name,
  driver.number,
  driver.avatar_url,
  driver.hero_image_url,
  driver.team_name,
  driver.city,
  driver.bio,
  driver.previous_position,
  category.name as category,
  category.slug as category_slug,
  category.color as category_color,
  standing.points,
  standing.wins,
  standing.podiums,
  standing.poles,
  standing.position
from public.standings standing
join latest_versions latest
  on latest.season_id = standing.season_id
 and latest.category_id = standing.category_id
 and latest.version = standing.version
join public.drivers driver
  on driver.id = standing.driver_id
 and driver.deleted_at is null
join public.categories category
  on category.id = standing.category_id
 and category.deleted_at is null
join public.seasons season
  on season.id = standing.season_id
 and season.deleted_at is null
join public.championships championship
  on championship.id = season.championship_id
 and championship.deleted_at is null
where standing.deleted_at is null
  and driver.public_profile
  and driver.status = 'approved'
  and standing.status = any (array['provisional'::text, 'official'::text, 'rectified'::text]);

create or replace view public.public_portal_drivers
with (security_invoker = true)
as
with latest_versions as (
  select
    season_id,
    category_id,
    max(version) as version
  from public.standings
  where deleted_at is null
    and status = any (array['provisional'::text, 'official'::text, 'rectified'::text])
  group by season_id, category_id
),
latest_standing as (
  select standing.*
  from public.standings standing
  join latest_versions latest
    on latest.season_id = standing.season_id
   and latest.category_id = standing.category_id
   and latest.version = standing.version
  where standing.deleted_at is null
)
select
  driver.id,
  driver.slug,
  driver.sport_name as name,
  driver.full_name,
  driver.number,
  driver.avatar_url,
  driver.hero_image_url,
  driver.team_name,
  driver.city,
  driver.bio,
  driver.previous_position,
  category.name as category,
  category.slug as category_slug,
  category.color as category_color,
  coalesce(standing.points, 0) as points,
  coalesce(standing.wins, 0) as wins,
  coalesce(standing.podiums, 0) as podiums,
  coalesce(standing.poles, 0) as poles,
  standing.position
from public.drivers driver
join public.seasons season
  on season.id = driver.season_id
 and season.deleted_at is null
join public.championships championship
  on championship.id = season.championship_id
 and championship.deleted_at is null
left join public.categories category
  on category.id = driver.category_id
 and category.deleted_at is null
left join latest_standing standing
  on standing.driver_id = driver.id
 and standing.season_id = driver.season_id
 and (driver.category_id is null or standing.category_id = driver.category_id)
where driver.deleted_at is null
  and driver.public_profile
  and driver.status = 'approved';

create or replace view public.public_portal_calendar
with (security_invoker = true)
as
select
  stage.id,
  stage.slug,
  stage.title,
  stage.format,
  stage.track,
  stage.starts_at,
  upper(to_char(stage.starts_at at time zone 'America/Sao_Paulo', 'DD MON')) as date_label,
  to_char(stage.starts_at at time zone 'America/Sao_Paulo', 'HH24"h"') as time_label,
  stage.registration_opens_at,
  stage.registration_closes_at,
  stage.status,
  stage.location,
  stage.city,
  stage.track_map_url,
  stage.hero_image_url,
  stage.short_description,
  season.name as season,
  championship.slug as championship_slug
from public.stages stage
join public.seasons season
  on season.id = stage.season_id
 and season.deleted_at is null
join public.championships championship
  on championship.id = season.championship_id
 and championship.deleted_at is null
where stage.deleted_at is null
  and stage.status <> 'cancelled';

create or replace view public.public_portal_results
with (security_invoker = true)
as
with latest_results as (
  select distinct on (
    result.stage_id,
    coalesce(result.category_id, '00000000-0000-0000-0000-000000000000'::uuid),
    coalesce(result.session_id, '00000000-0000-0000-0000-000000000000'::uuid),
    result.title
  )
    result.*
  from public.results result
  where result.deleted_at is null
    and result.status = any (
      array['provisional'::text, 'homologated'::text, 'published'::text, 'rectified'::text]
    )
  order by
    result.stage_id,
    coalesce(result.category_id, '00000000-0000-0000-0000-000000000000'::uuid),
    coalesce(result.session_id, '00000000-0000-0000-0000-000000000000'::uuid),
    result.title,
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
  result.stage_id,
  stage.slug as stage_slug,
  stage.title as stage_title,
  stage.track,
  stage.starts_at,
  category.name as category,
  category.slug as category_slug
from latest_results result
join public.stages stage
  on stage.id = result.stage_id
 and stage.deleted_at is null
join public.seasons season
  on season.id = stage.season_id
 and season.deleted_at is null
join public.championships championship
  on championship.id = season.championship_id
 and championship.deleted_at is null
left join public.categories category
  on category.id = result.category_id
 and category.deleted_at is null
where result.category_id is null or category.id is not null;

create or replace view public.public_portal_result_entries
with (security_invoker = true)
as
select
  entry.id,
  entry.result_id,
  entry.position,
  entry.kart_number,
  entry.laps,
  entry.total_time_ms,
  entry.best_lap_ms,
  entry.penalty_ms,
  entry.points,
  entry.pole,
  entry.fastest_lap,
  entry.status,
  entry.created_at,
  driver.slug as driver_slug,
  driver.sport_name as driver_name,
  driver.number as driver_number,
  stage.title as stage_title
from public.result_entries entry
join public.results result
  on result.id = entry.result_id
 and result.deleted_at is null
 and result.status = any (
   array['provisional'::text, 'homologated'::text, 'published'::text, 'rectified'::text]
 )
join public.drivers driver
  on driver.id = entry.driver_id
 and driver.deleted_at is null
 and driver.public_profile
join public.stages stage
  on stage.id = result.stage_id
 and stage.deleted_at is null
where entry.deleted_at is null;

create or replace view public.public_portal_news
with (security_invoker = true)
as
select
  page.slug,
  page.title,
  coalesce(page.summary, page.content ->> 'summary', page.content ->> 'description', '') as summary,
  page.content,
  coalesce(page.category, 'Notícias') as category,
  page.cover_image_url,
  page.seo_description,
  page.published_at
from public.cms_pages page
join public.championships championship
  on championship.id = page.championship_id
 and championship.deleted_at is null
where page.deleted_at is null
  and page.status = 'published'
  and coalesce(page.kind, 'news') = 'news';

create or replace view public.public_portal_regulations
with (security_invoker = true)
as
select
  term.id,
  term.title,
  term.version,
  term.content,
  term.effective_at,
  term.status,
  term.download_url
from public.terms term
join public.seasons season
  on season.id = term.season_id
 and season.deleted_at is null
join public.championships championship
  on championship.id = season.championship_id
 and championship.deleted_at is null
where term.deleted_at is null
  and term.kind = 'regulation'
  and term.status = 'published';

create or replace view public.public_portal_sponsors
with (security_invoker = true)
as
select
  sponsor.name,
  sponsor.slug,
  sponsor.logo_url,
  sponsor.website_url,
  sponsor.tier
from public.sponsors sponsor
join public.championships championship
  on championship.id = sponsor.championship_id
 and championship.deleted_at is null
where sponsor.deleted_at is null
  and sponsor.status = 'active';

grant select on
  public.public_portal_categories,
  public.public_portal_standings,
  public.public_portal_drivers,
  public.public_portal_calendar,
  public.public_portal_results,
  public.public_portal_result_entries,
  public.public_portal_news,
  public.public_portal_regulations,
  public.public_portal_sponsors
to anon, authenticated;
