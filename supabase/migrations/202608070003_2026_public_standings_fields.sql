-- Public transparency for UDK 2026 standings.
-- `points` is the official net score after discards; gross_points is the sum before discards.

create or replace view public.public_portal_standings
with (security_invoker = true)
as
with latest_versions as (
  select season_id, category_id, max(version) as version
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
  standing.position,
  standing.gross_points,
  greatest(0, standing.gross_points - standing.points) as discarded_points
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
  select season_id, category_id, max(version) as version
  from public.standings
  where deleted_at is null
    and status = any (array['provisional'::text, 'official'::text, 'rectified'::text])
  group by season_id, category_id
), latest_standing as (
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
  standing.position,
  coalesce(standing.gross_points, 0) as gross_points,
  greatest(0, coalesce(standing.gross_points, 0) - coalesce(standing.points, 0)) as discarded_points
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

grant select on public.public_portal_standings, public.public_portal_drivers to anon, authenticated;
