-- Publica a 1a etapa oficial UDK 2026 a partir dos relatorios LapTime
-- de 18/08/2026. A categoria vem da lista homologada pela organizacao.
-- O numero do piloto permanece nulo: kart e sorteado por sessao.

update public.drivers driver
set
  number = null,
  sport_name = case when driver.slug = 'arthur-henrique' then 'Arthur' else driver.sport_name end
from public.seasons season
join public.championships championship on championship.id = season.championship_id
where driver.season_id = season.id
  and championship.slug = 'udk'
  and season.year = 2026;

update public.stages stage
set status = 'homologated'
from public.seasons season
join public.championships championship on championship.id = season.championship_id
where stage.season_id = season.id
  and championship.slug = 'udk'
  and season.year = 2026
  and stage.format = 'endurance'
  and (stage.starts_at at time zone 'America/Sao_Paulo')::date = date '2026-08-18';

with scope as (
  select
    season.id as season_id,
    stage.id as stage_id,
    session_row.id as session_id,
    category.id as category_id,
    category.slug as category_slug
  from public.seasons season
  join public.championships championship on championship.id = season.championship_id
  join public.stages stage on stage.season_id = season.id
  join public.sessions session_row
    on session_row.stage_id = stage.id
   and session_row.name = 'Endurance 1h'
   and session_row.deleted_at is null
  join public.categories category on category.season_id = season.id
  where championship.slug = 'udk'
    and season.year = 2026
    and stage.format = 'endurance'
    and (stage.starts_at at time zone 'America/Sao_Paulo')::date = date '2026-08-18'
    and category.slug in ('insanos', 'rapidos')
), payload(category_slug, external_racing_id, title, fastest_lap_ms) as (
  values
    ('insanos', 2026081801::bigint, 'Resultado oficial - 1a etapa - Ultra Insanos', 65118),
    ('rapidos', 2026081802::bigint, 'Resultado oficial - 1a etapa - Ultras Rapidos', 64976)
)
insert into public.results (
  stage_id,
  category_id,
  session_id,
  title,
  status,
  version,
  fastest_lap_ms,
  published_at,
  source_system,
  external_racing_id,
  external_imported_at
)
select
  scope.stage_id,
  scope.category_id,
  scope.session_id,
  payload.title,
  'published',
  1,
  payload.fastest_lap_ms,
  timestamptz '2026-08-18 23:26:33-03',
  'laptime',
  payload.external_racing_id,
  timestamptz '2026-08-18 23:30:27-03'
from scope
join payload on payload.category_slug = scope.category_slug
where not exists (
  select 1
  from public.results existing
  where existing.source_system = 'laptime'
    and existing.external_racing_id = payload.external_racing_id
    and existing.stage_id = scope.stage_id
    and existing.category_id = scope.category_id
    and existing.session_id = scope.session_id
    and existing.deleted_at is null
);

with payload(
  category_slug,
  driver_slug,
  position,
  status,
  laps,
  total_time,
  best_lap,
  pole,
  fastest_lap
) as (
  values
    ('insanos', 'matteo-rinoldi', 1, 'classified', 50, '01:02:48.123', '01:05.140', false, false),
    ('insanos', 'andre-felisberto', 2, 'classified', 50, '01:02:48.196', '01:05.140', true, false),
    ('insanos', 'gegela', 3, 'classified', 50, '01:02:52.058', '01:05.306', false, false),
    ('insanos', 'bernardo-thadeu', 4, 'classified', 50, '01:02:53.012', '01:05.118', false, false),
    ('insanos', 'marcelo-augusto', 5, 'classified', 50, '01:02:55.095', '01:05.352', false, false),
    ('insanos', 'saulo-vieira', 6, 'classified', 50, '01:02:58.847', '01:05.321', false, false),
    ('insanos', 'rafael-soares', 7, 'classified', 50, '01:03:06.986', '01:05.539', false, false),
    ('insanos', 'agenor-jr', 8, 'classified', 50, '01:03:07.320', '01:05.672', false, false),
    ('insanos', 'lucas-rabelo', 9, 'classified', 50, '01:03:07.561', '01:05.149', false, false),
    ('insanos', 'alexandre-janotti', 10, 'classified', 50, '01:03:07.638', '01:05.509', false, false),
    ('insanos', 'enzo-camara', 11, 'classified', 49, '01:02:26.503', '01:05.656', false, false),
    ('insanos', 'renato-oliveira', 12, 'classified', 49, '01:02:33.416', '01:05.242', false, false),
    ('insanos', 'fabio-filho', 13, 'classified', 49, '01:02:35.543', '01:05.521', false, false),
    ('insanos', 'flavio-camara', 14, 'classified', 49, '01:02:41.736', '01:05.617', false, false),
    ('insanos', 'lucas-guimaraes', 15, 'classified', 49, '01:03:03.723', '01:05.478', false, false),
    ('insanos', 'vitor-hugo', 16, 'classified', 43, '01:03:06.710', '01:05.436', false, false),
    ('insanos', 'francisco-biuchi', 17, 'classified', 43, '01:03:07.877', '01:05.616', false, false),
    ('insanos', 'pablo-fonseca', 18, 'classified', 43, '01:03:08.312', '01:05.509', false, false),
    ('insanos', 'anderson-silveira', 19, 'classified', 31, '00:38:43.201', '01:05.650', false, false),
    ('rapidos', 'arthur-henrique', 1, 'classified', 50, '01:03:08.638', '01:04.976', false, true),
    ('rapidos', 'rafael-morais', 2, 'classified', 49, '01:02:30.603', '01:05.668', false, false),
    ('rapidos', 'raphael-werner', 3, 'classified', 49, '01:02:41.860', '01:05.737', false, false),
    ('rapidos', 'gabriel-fernandes', 4, 'classified', 49, '01:02:53.318', '01:06.570', false, false),
    ('rapidos', 'marcos-felipe', 5, 'classified', 49, '01:02:59.668', '01:05.941', false, false),
    ('rapidos', 'guilherme-faria', 6, 'classified', 49, '01:03:15.831', '01:05.971', false, false),
    ('rapidos', 'lucas-godoy', 7, 'classified', 48, '01:02:17.442', '01:06.478', false, false),
    ('rapidos', 'reinaldo-teles', 8, 'classified', 48, '01:02:24.377', '01:06.076', false, false),
    ('rapidos', 'marcelo-marques', 9, 'classified', 48, '01:02:42.400', '01:05.834', false, false),
    ('rapidos', 'pedro-teles', 10, 'classified', 48, '01:02:50.487', '01:05.990', false, false),
    ('rapidos', 'bernardo', 11, 'classified', 48, '01:02:52.501', '01:05.434', true, false),
    ('rapidos', 'pedro-guilherme', 12, 'classified', 46, '01:03:04.128', '01:06.754', false, false),
    ('rapidos', 'braulio-bonoto', 13, 'classified', 46, '01:03:08.461', '01:05.164', false, false),
    ('rapidos', 'lucca-dambros', 14, 'classified', 46, '01:03:09.744', '01:06.683', false, false),
    ('rapidos', 'rodrigo-boris', 15, 'classified', 42, '01:02:26.354', '01:05.912', false, false),
    ('rapidos', 'fernando-godoy', 16, 'classified', 41, '01:02:57.701', '01:06.898', false, false),
    ('rapidos', 'wesley-cardoso', 17, 'classified', 40, '01:02:42.131', '01:05.899', false, false),
    ('rapidos', 'samael', 999, 'nc', 37, '00:55:10.707', '01:08.932', false, false),
    ('rapidos', 'toninho-da-prata', 1000, 'nc', 17, '00:22:32.934', '01:06.595', false, false),
    ('rapidos', 'theodoro', 1001, 'nc', 16, '00:18:41.880', '01:08.070', false, false)
), scope as (
  select
    season.id as season_id,
    category.id as category_id,
    category.slug as category_slug,
    result.id as result_id
  from public.seasons season
  join public.championships championship on championship.id = season.championship_id
  join public.categories category on category.season_id = season.id
  join public.results result
    on result.category_id = category.id
   and result.source_system = 'laptime'
   and result.external_racing_id = case category.slug
     when 'insanos' then 2026081801::bigint
     when 'rapidos' then 2026081802::bigint
   end
   and result.deleted_at is null
  where championship.slug = 'udk'
    and season.year = 2026
    and category.slug in ('insanos', 'rapidos')
)
insert into public.result_entries (
  result_id,
  driver_id,
  position,
  laps,
  total_time_ms,
  best_lap_ms,
  penalty_ms,
  pole,
  fastest_lap,
  status
)
select
  scope.result_id,
  driver.id,
  payload.position,
  payload.laps,
  round(extract(epoch from payload.total_time::interval) * 1000)::bigint,
  round(extract(epoch from payload.best_lap::interval) * 1000)::integer,
  0,
  payload.pole,
  payload.fastest_lap,
  payload.status
from payload
join scope on scope.category_slug = payload.category_slug
join public.drivers driver
  on driver.season_id = scope.season_id
 and driver.slug = payload.driver_slug
where not exists (
  select 1
  from public.result_entries existing
  where existing.result_id = scope.result_id
    and existing.driver_id = driver.id
    and existing.deleted_at is null
);

with scope as (
  select
    season.id as season_id,
    category.id as category_id,
    category.slug as category_slug,
    result.id as result_id
  from public.seasons season
  join public.championships championship on championship.id = season.championship_id
  join public.categories category on category.season_id = season.id
  join public.results result
    on result.category_id = category.id
   and result.source_system = 'laptime'
   and result.external_racing_id = case category.slug
     when 'insanos' then 2026081801::bigint
     when 'rapidos' then 2026081802::bigint
   end
   and result.deleted_at is null
  where championship.slug = 'udk'
    and season.year = 2026
    and category.slug in ('insanos', 'rapidos')
), eligible as (
  select
    scope.season_id,
    scope.category_id,
    scope.result_id,
    driver.id as driver_id
  from scope
  join public.drivers driver
    on driver.season_id = scope.season_id
   and driver.category_id = scope.category_id
   and driver.status = 'approved'
   and driver.deleted_at is null
), scored as (
  select
    eligible.season_id,
    eligible.category_id,
    eligible.driver_id,
    coalesce(entry.points, 0)::numeric(8,2) as points,
    case when entry.position between 1 and 3 and entry.status = 'classified' then 1 else 0 end as podiums,
    case when entry.position = 1 and entry.status = 'classified' then 1 else 0 end as wins,
    case when entry.pole then 1 else 0 end as poles
  from eligible
  left join public.result_entries entry
    on entry.result_id = eligible.result_id
   and entry.driver_id = eligible.driver_id
   and entry.deleted_at is null
), ranked as (
  select
    scored.*,
    row_number() over (
      partition by scored.category_id
      order by scored.points desc, scored.wins desc, scored.podiums desc, scored.poles desc, scored.driver_id
    )::integer as position
  from scored
), next_versions as (
  select
    season_id,
    category_id,
    coalesce(max(version), 0) + 1 as version
  from public.standings
  where deleted_at is null
  group by season_id, category_id
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
  ranked.season_id,
  ranked.category_id,
  ranked.driver_id,
  ranked.points,
  ranked.points,
  ranked.wins,
  ranked.podiums,
  ranked.poles,
  ranked.position,
  next_versions.version,
  'official'
from ranked
join next_versions
  on next_versions.season_id = ranked.season_id
 and next_versions.category_id = ranked.category_id
where not exists (
  select 1
  from public.standings existing
  where existing.season_id = ranked.season_id
    and existing.category_id = ranked.category_id
    and existing.driver_id = ranked.driver_id
    and existing.version = next_versions.version
    and existing.deleted_at is null
);
