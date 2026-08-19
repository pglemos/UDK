-- Materializa a retificacao da 1a etapa de forma reprodutivel, inclusive em
-- ambientes locais que ainda nao possuem todos os pilotos cadastrados.

-- 1. Garante a identidade esportiva minima dos pilotos que constam no resultado.
with scope as (
  select season.id as season_id, category.id as category_id, category.slug as category_slug
  from public.seasons season
  join public.championships championship on championship.id = season.championship_id
  join public.categories category on category.season_id = season.id
  where championship.slug = 'udk' and season.year = 2026
    and category.slug in ('insanos','rapidos')
), roster(category_slug, slug, sport_name) as (
  values
    ('insanos','matteo-rinoldi','Matteo Rinoldi'),
    ('insanos','andre-felisberto','André Felisberto'),
    ('insanos','gegela','Gegela'),
    ('insanos','bernardo-thadeu','Bernardo Thadeu'),
    ('insanos','marcelo-augusto','Marcelo Augusto'),
    ('insanos','saulo-vieira','Saulo Vieira'),
    ('insanos','rafael-soares','Rafael Soares'),
    ('insanos','agenor-jr','Agenor Jr.'),
    ('insanos','lucas-rabelo','Lucas Rabelo'),
    ('insanos','alexandre-janotti','Alexandre Janotti'),
    ('insanos','enzo-camara','Enzo Câmara'),
    ('insanos','renato-oliveira','Renato Oliveira'),
    ('insanos','fabio-filho','Fábio Filho'),
    ('insanos','flavio-camara','Flavio Câmara'),
    ('insanos','lucas-guimaraes','Lucas Guimarães'),
    ('insanos','vitor-hugo','Vitor Hugo'),
    ('insanos','francisco-biuchi','Francisco Biulchi'),
    ('insanos','pablo-fonseca','Pablo Fonseca'),
    ('insanos','anderson-silveira','Anderson Silveira'),
    ('rapidos','arthur-henrique','Arthur'),
    ('rapidos','rafael-morais','Rafael Morais'),
    ('rapidos','raphael-werner','Raphael Werner'),
    ('rapidos','gabriel-fernandes','Gabriel Fernandes'),
    ('rapidos','marcos-felipe','Marcos Felipe'),
    ('rapidos','guilherme-faria','Guilherme Faria'),
    ('rapidos','lucas-godoy','Lucas Godoy'),
    ('rapidos','reinaldo-teles','Reinaldo Teles'),
    ('rapidos','marcelo-marques','Marcelo Marques'),
    ('rapidos','pedro-teles','Pedro Teles'),
    ('rapidos','bernardo','Bernardo'),
    ('rapidos','pedro-guilherme','Pedro Guilherme'),
    ('rapidos','lucca-dambros','Lucca Dambrós'),
    ('rapidos','braulio-bonoto','Bráulio Bonoto'),
    ('rapidos','rodrigo-boris','Rodrigo Boris'),
    ('rapidos','fernando-godoy','Fernando Godoy'),
    ('rapidos','wesley-cardoso','Wesley Cardoso'),
    ('rapidos','samael','Samael'),
    ('rapidos','toninho-da-prata','Toninho da Prata'),
    ('rapidos','theodoro','Theodoro')
)
insert into public.drivers (
  season_id, category_id, slug, full_name, sport_name, number, status, public_profile
)
select scope.season_id, scope.category_id, roster.slug, roster.sport_name, roster.sport_name,
  null, 'approved', true
from roster join scope using (category_slug)
on conflict (season_id, slug) where deleted_at is null do update
set category_id = excluded.category_id,
    status = 'approved',
    public_profile = true,
    updated_at = now();

-- 2. Libera as posicoes existentes da v2 antes do upsert para nao colidir com
-- a restricao unique(result_id, position).
update public.result_entries entry
set position = entry.position + 4000
from public.results result
where entry.result_id = result.id
  and result.version = 2
  and result.status = 'rectified'
  and result.external_racing_id in (2026081801,2026081802)
  and entry.deleted_at is null;

-- 3. Payload final da decisao esportiva. As -7 voltas de pit ja estao
-- refletidas nas voltas/posicoes provenientes do resultado oficial LapTime.
with scope as (
  select season.id as season_id, category.slug as category_slug, result.id as result_id
  from public.seasons season
  join public.championships championship on championship.id = season.championship_id
  join public.categories category on category.season_id = season.id
  join public.results result on result.category_id = category.id
    and result.version = 2 and result.status = 'rectified'
    and result.external_racing_id = case category.slug when 'insanos' then 2026081801 else 2026081802 end
    and result.deleted_at is null
  where championship.slug='udk' and season.year=2026 and category.slug in ('insanos','rapidos')
), payload(
  category_slug, driver_slug, position, kart_number, status, laps, total_time, best_lap,
  pole, fastest_lap, best_pit, penalty_ms, penalty_points, timing_adjustment_laps, sporting_note
) as (
  values
    ('insanos','matteo-rinoldi',1,138,'classified',50,'01:02:48.123','01:05.140',false,false,false,0,0,0,null),
    ('insanos','andre-felisberto',2,121,'classified',50,'01:02:48.196','01:05.140',true,false,false,0,0,0,'Pole Position geral da Super Pole: 1:07.775 (+1 ponto).'),
    ('insanos','gegela',3,161,'classified',50,'01:02:52.058','01:05.306',false,false,false,0,0,0,null),
    ('insanos','bernardo-thadeu',4,104,'classified',50,'01:02:53.012','01:05.118',false,false,false,0,0,0,null),
    ('insanos','marcelo-augusto',5,134,'classified',50,'01:02:55.095','01:05.352',false,false,false,0,0,0,null),
    ('insanos','saulo-vieira',6,150,'classified',50,'01:02:58.847','01:05.321',false,false,false,0,0,0,null),
    ('insanos','rafael-soares',7,102,'classified',50,'01:03:06.986','01:05.539',false,false,false,0,0,0,null),
    ('insanos','agenor-jr',8,128,'classified',50,'01:03:07.320','01:05.672',false,false,false,0,0,0,null),
    ('insanos','lucas-rabelo',9,120,'classified',50,'01:03:07.561','01:05.149',false,false,true,0,0,0,'Melhor Parada do Endurance: TV 05:00.007, 7 ms acima do mínimo (+10 pontos).'),
    ('insanos','alexandre-janotti',10,158,'classified',50,'01:03:07.638','01:05.509',false,false,false,0,0,0,null),
    ('insanos','enzo-camara',11,124,'classified',49,'01:02:26.503','01:05.656',false,false,false,0,0,0,null),
    ('insanos','renato-oliveira',12,108,'classified',49,'01:02:33.416','01:05.242',false,false,false,0,0,0,null),
    ('insanos','fabio-filho',13,113,'classified',49,'01:02:35.543','01:05.521',false,false,false,0,0,0,null),
    ('insanos','flavio-camara',14,131,'classified',49,'01:02:41.736','01:05.617',false,false,false,0,0,0,null),
    ('insanos','lucas-guimaraes',15,105,'classified',49,'01:03:03.723','01:05.478',false,false,false,0,0,0,null),
    ('insanos','vitor-hugo',16,133,'classified',43,'01:03:06.710','01:05.436',false,false,false,5000,10,0,'Bandeira preta/branca: +5 s e -10 pontos. Pit inválido 04:59.335; -7 voltas já refletidas no resultado LapTime.'),
    ('insanos','francisco-biuchi',17,130,'classified',43,'01:03:07.877','01:05.616',false,false,false,5000,10,0,'Bandeira preta/branca: +5 s e -10 pontos. Pit inválido 04:59.221; -7 voltas já refletidas no resultado LapTime.'),
    ('insanos','pablo-fonseca',18,141,'classified',43,'01:03:08.312','01:05.509',false,false,false,5000,10,0,'Bandeira preta/branca: +5 s e -10 pontos. Pit inválido 04:59.720; -7 voltas já refletidas no resultado LapTime.'),
    ('insanos','anderson-silveira',19,115,'classified',31,'00:38:43.201','01:05.650',false,false,false,0,0,0,null),

    ('rapidos','arthur-henrique',1,135,'classified',50,'01:03:08.638','01:04.976',false,true,false,0,0,0,'Melhor volta geral da prova: 1:04.976 (+1 ponto).'),
    ('rapidos','rafael-morais',2,114,'classified',49,'01:02:30.603','01:05.668',false,false,false,0,0,0,null),
    ('rapidos','raphael-werner',3,117,'classified',49,'01:02:41.860','01:05.737',false,false,false,0,0,0,null),
    ('rapidos','gabriel-fernandes',4,122,'classified',49,'01:02:53.318','01:06.570',false,false,false,0,0,0,null),
    ('rapidos','marcos-felipe',5,116,'classified',49,'01:02:59.668','01:05.941',false,false,false,0,0,0,null),
    ('rapidos','guilherme-faria',6,106,'classified',49,'01:03:15.831','01:05.971',false,false,false,0,0,0,null),
    ('rapidos','lucas-godoy',7,142,'classified',48,'01:02:17.442','01:06.478',false,false,false,0,0,0,'Relatório LapTime contém registro "Penalidades: 1;" sem efeito desportivo identificável; nenhum efeito adicional foi inventado.'),
    ('rapidos','reinaldo-teles',8,144,'classified',48,'01:02:24.377','01:06.076',false,false,false,0,0,0,null),
    ('rapidos','marcelo-marques',9,126,'classified',48,'01:02:42.400','01:05.834',false,false,false,0,0,0,null),
    ('rapidos','pedro-teles',10,146,'classified',48,'01:02:50.487','01:05.990',false,false,false,0,0,0,null),
    ('rapidos','bernardo',11,118,'classified',48,'01:02:52.501','01:05.434',false,false,false,0,0,0,'Mais rápido dos Ultras Rápidos na Super Pole (1:08.268), sem bônus de pole geral; a pole geral foi de André Felisberto.'),
    ('rapidos','pedro-guilherme',12,123,'classified',47,'01:03:04.128','01:06.754',false,false,false,0,0,1,'Retificação de cronometragem: TV 02:16.868 reuniu duas voltas pelo sensor/transponder; total oficial 47 voltas. Tempos individuais não foram estimados.'),
    ('rapidos','lucca-dambros',13,140,'classified',46,'01:03:09.744','01:06.683',false,false,false,0,0,0,'Subiu para P13 após aplicação de +5 s a Bráulio Bonoto.'),
    ('rapidos','braulio-bonoto',14,129,'classified',46,'01:03:08.461','01:05.164',false,false,false,5000,10,0,'Bandeira preta/branca: +5 s e -10 pontos. Parada obrigatória não realizada; -7 voltas já refletidas no resultado LapTime.'),
    ('rapidos','rodrigo-boris',15,149,'classified',42,'01:02:26.354','01:05.912',false,false,false,5000,10,0,'Bandeira preta/branca: +5 s e -10 pontos. Pit inválido 04:59.796; -7 voltas já refletidas no resultado LapTime.'),
    ('rapidos','fernando-godoy',16,112,'classified',41,'01:02:57.701','01:06.898',false,false,false,5000,10,0,'Bandeira preta/branca: +5 s e -10 pontos. Pit inválido 04:06.087; -7 voltas já refletidas no resultado LapTime.'),
    ('rapidos','wesley-cardoso',17,132,'classified',40,'01:02:42.131','01:05.899',false,false,false,5000,10,0,'Bandeira preta/branca: +5 s e -10 pontos. Pit inválido 04:59.959; -7 voltas já refletidas no resultado LapTime.'),
    ('rapidos','samael',999,107,'nc',37,'00:55:10.707','01:08.932',false,false,false,0,0,0,null),
    ('rapidos','toninho-da-prata',1000,119,'nc',17,'00:22:32.934','01:06.595',false,false,false,5000,10,0,'Bandeira preta/branca: +5 s e -10 pontos.'),
    ('rapidos','theodoro',1001,148,'nc',16,'00:18:41.880','01:08.070',false,false,false,0,0,0,null)
)
insert into public.result_entries (
  result_id, driver_id, position, kart_number, laps, total_time_ms, best_lap_ms,
  penalty_ms, pole, fastest_lap, status, best_pit, penalty_points,
  timing_adjustment_laps, sporting_note
)
select
  scope.result_id, driver.id, payload.position, payload.kart_number, payload.laps,
  round(extract(epoch from payload.total_time::interval)*1000)::bigint,
  round(extract(epoch from payload.best_lap::interval)*1000)::integer,
  payload.penalty_ms, payload.pole, payload.fastest_lap, payload.status,
  payload.best_pit, payload.penalty_points, payload.timing_adjustment_laps, payload.sporting_note
from payload
join scope using (category_slug)
join public.drivers driver on driver.season_id=scope.season_id and driver.slug=payload.driver_slug
on conflict (result_id, driver_id) where deleted_at is null do update
set position=excluded.position,
    kart_number=excluded.kart_number,
    laps=excluded.laps,
    total_time_ms=excluded.total_time_ms,
    best_lap_ms=excluded.best_lap_ms,
    penalty_ms=excluded.penalty_ms,
    pole=excluded.pole,
    fastest_lap=excluded.fastest_lap,
    status=excluded.status,
    best_pit=excluded.best_pit,
    penalty_points=excluded.penalty_points,
    timing_adjustment_laps=excluded.timing_adjustment_laps,
    sporting_note=excluded.sporting_note,
    updated_at=now();

-- 4. Persiste as oito bandeiras preta/branca agora que todos os pilotos existem.
with stage_scope as (
  select stage.id stage_id, season.id season_id
  from public.stages stage
  join public.seasons season on season.id=stage.season_id
  join public.championships championship on championship.id=season.championship_id
  where championship.slug='udk' and season.year=2026
    and (stage.starts_at at time zone 'America/Sao_Paulo')::date=date '2026-08-18'
  limit 1
), flagged(slug) as (values
  ('francisco-biuchi'::text),('vitor-hugo'),('rodrigo-boris'),('pablo-fonseca'),
  ('wesley-cardoso'),('fernando-godoy'),('braulio-bonoto'),('toninho-da-prata')
)
insert into public.penalties(stage_id,driver_id,code,summary,effect,status,public_visibility)
select stage_scope.stage_id, driver.id, 'BW-01',
  'Primeira bandeira preta/branca registrada no relatório oficial da 1ª etapa.',
  '+5 segundos no resultado e -10 pontos no campeonato.', 'homologated','full'
from stage_scope
join public.drivers driver on driver.season_id=stage_scope.season_id
join flagged on flagged.slug=driver.slug
where not exists (
  select 1 from public.penalties p where p.stage_id=stage_scope.stage_id
    and p.driver_id=driver.id and p.code='BW-01' and p.deleted_at is null
);

-- 5. A versão de regulamento resumida criada pela migration anterior não
-- substitui o documento oficial. Restaura a versão oficial anterior publicada.
with scope as (
  select season.id season_id
  from public.seasons season join public.championships c on c.id=season.championship_id
  where c.slug='udk' and season.year=2026
), latest as (
  select term.id, term.season_id, term.version,
    row_number() over(partition by term.season_id order by term.version desc) rn
  from public.terms term join scope on scope.season_id=term.season_id
  where term.kind='regulation' and term.deleted_at is null
)
update public.terms term
set status=case when latest.rn=1 then 'superseded' else 'published' end,
    updated_at=now()
from latest
where term.id=latest.id and latest.rn in (1,2);

-- 6. Classificação atualizada. Como a 1ª etapa é o único evento concluído até
-- aqui, os pontos da etapa são os pontos brutos e líquidos atuais.
with season_scope as (
  select season.id season_id, category.id category_id, category.slug category_slug
  from public.seasons season
  join public.championships championship on championship.id=season.championship_id
  join public.categories category on category.season_id=season.id
  where championship.slug='udk' and season.year=2026 and category.slug in ('insanos','rapidos')
), result_scope as (
  select scope.*, result.id result_id
  from season_scope scope join public.results result on result.category_id=scope.category_id
  where result.version=2 and result.status='rectified' and result.deleted_at is null
    and result.external_racing_id=case scope.category_slug when 'insanos' then 2026081801 else 2026081802 end
), next_version as (
  select scope.season_id, scope.category_id, coalesce(max(s.version),0)+1 version
  from season_scope scope left join public.standings s
    on s.season_id=scope.season_id and s.category_id=scope.category_id and s.deleted_at is null
  group by scope.season_id,scope.category_id
), scored as (
  select scope.season_id, scope.category_id, driver.id driver_id,
    coalesce(entry.points,0)::numeric(8,2) points,
    case when entry.position=1 and entry.status='classified' then 1 else 0 end wins,
    case when entry.position between 1 and 3 and entry.status='classified' then 1 else 0 end podiums,
    case when entry.pole then 1 else 0 end poles
  from result_scope scope
  join public.drivers driver on driver.season_id=scope.season_id and driver.category_id=scope.category_id
    and driver.status='approved' and driver.deleted_at is null
  left join public.result_entries entry on entry.result_id=scope.result_id and entry.driver_id=driver.id and entry.deleted_at is null
), ranked as (
  select scored.*, row_number() over(partition by category_id order by points desc,wins desc,podiums desc,poles desc,driver_id)::integer position
  from scored
)
insert into public.standings(season_id,category_id,driver_id,points,gross_points,wins,podiums,poles,position,version,status)
select ranked.season_id,ranked.category_id,ranked.driver_id,ranked.points,ranked.points,
  ranked.wins,ranked.podiums,ranked.poles,ranked.position,next_version.version,'rectified'
from ranked join next_version using(season_id,category_id);

-- 7. O portal deve retornar uma unica versão de resultado por sessão/categoria.
create or replace view public.public_portal_results
with (security_invoker = true)
as
with latest_results as (
  select distinct on (
    result.stage_id,
    coalesce(result.category_id,'00000000-0000-0000-0000-000000000000'::uuid),
    coalesce(result.session_id,'00000000-0000-0000-0000-000000000000'::uuid)
  ) result.*
  from public.results result
  where result.deleted_at is null
    and result.status = any(array['provisional'::text,'homologated'::text,'published'::text,'rectified'::text])
  order by result.stage_id,
    coalesce(result.category_id,'00000000-0000-0000-0000-000000000000'::uuid),
    coalesce(result.session_id,'00000000-0000-0000-0000-000000000000'::uuid),
    result.version desc,result.updated_at desc
)
select result.id,result.title,result.status,result.version,result.fastest_lap_ms,result.published_at,
  result.stage_id,stage.slug stage_slug,stage.title stage_title,stage.track,stage.starts_at,
  category.name category,category.slug category_slug
from latest_results result
join public.stages stage on stage.id=result.stage_id and stage.deleted_at is null
left join public.categories category on category.id=result.category_id and category.deleted_at is null;

grant select on public.public_portal_results to anon,authenticated;
