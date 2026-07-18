with championship as (
  insert into public.championships(slug,name,description,status)
  values ('udk','Ultras do Kart','Campeonato oficial UDK em Betim.','active')
  returning id
), season as (
  insert into public.seasons(championship_id,name,year,status,starts_at,ends_at)
  select id,'UDK 2026',2026,'active','2026-08-18 21:00-03','2026-12-12 16:00-03'
  from championship
  returning id
)
insert into public.categories(season_id,slug,name,color)
select id,'insanos','Ultras Insanos','#DAFC08' from season
union all
select id,'rapidos','Ultras Rápidos','#F7F5F0' from season;

with season as (select id from public.seasons where year=2026 limit 1)
insert into public.stages(season_id,title,format,track,starts_at,status)
select season.id,stage.title,stage.format,stage.track,stage.starts_at,'registration'
from season
cross join (values
  ('Endurance','endurance','Traçado 01 invertido com chicane','2026-08-18 21:00-03'::timestamptz),
  ('Etapa regular','regular','Traçado 02 normal e invertido','2026-09-08 21:00-03'::timestamptz),
  ('Etapa regular','regular','Traçado 05 normal e invertido','2026-10-13 21:00-03'::timestamptz),
  ('Etapa regular','regular','Traçado 11 normal e invertido','2026-11-10 21:00-03'::timestamptz),
  ('Final Endurance','endurance','Traçado 01 normal','2026-12-12 11:00-03'::timestamptz)
) as stage(title,format,track,starts_at);

with season as (select id from public.seasons where year=2026 limit 1),
insanos as (select id from public.categories where slug='insanos' limit 1),
rapidos as (select id from public.categories where slug='rapidos' limit 1)
insert into public.drivers(season_id,category_id,slug,full_name,sport_name,number,status)
values
  ((select id from season),(select id from insanos),'walison-goncalves','Walison Gonçalves','Walison Gonçalves',7,'approved'),
  ((select id from season),(select id from insanos),'haroldo-alves','Haroldo Alves','Haroldo Alves',79,'approved'),
  ((select id from season),(select id from rapidos),'aldo-senna','Aldo Senna','Aldo Senna',44,'approved'),
  ((select id from season),(select id from rapidos),'pedro-guilherme','Pedro Guilherme Lemos Teixeira','Pedro Guilherme',70,'approved'),
  ((select id from season),(select id from rapidos),'arthur-henrique','Arthur Henrique Vieira da Silva','Arthur Henrique',56,'approved');

with season as (select id from public.seasons where year=2026 limit 1),
driver_points as (
  select d.*,
    case d.slug
      when 'walison-goncalves' then 112
      when 'haroldo-alves' then 104
      when 'aldo-senna' then 98
      when 'pedro-guilherme' then 91
      else 84
    end as points,
    case d.slug
      when 'walison-goncalves' then 3
      when 'haroldo-alves' then 2
      when 'aldo-senna' then 2
      when 'pedro-guilherme' then 1
      else 0
    end as wins,
    case d.slug
      when 'walison-goncalves' then 5
      when 'haroldo-alves' then 5
      when 'aldo-senna' then 4
      when 'pedro-guilherme' then 4
      else 3
    end as podiums
  from public.drivers d
)
insert into public.standings(season_id,category_id,driver_id,points,gross_points,wins,podiums,position,status)
select
  season.id,
  d.category_id,
  d.id,
  d.points,
  d.points + 6,
  d.wins,
  d.podiums,
  row_number() over (partition by d.category_id order by d.points desc),
  'official'
from season
cross join driver_points d;
