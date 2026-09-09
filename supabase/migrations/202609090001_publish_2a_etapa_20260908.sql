-- Publicação homologada da 2ª etapa regular (08/09/2026).
-- Fonte: relatórios LapTime anexados e páginas homologadas fornecidas pela organização.
-- Os pontos abaixo são os valores homologados C1/C2; não são inferidos da posição bruta.

with scope as (
  select season.id season_id, stage.id stage_id, category.id category_id,
         category.slug category_slug, session_row.id session_id, session_row.name session_name
  from public.seasons season
  join public.championships championship on championship.id=season.championship_id
  join public.stages stage on stage.season_id=season.id
    and (stage.starts_at at time zone 'America/Sao_Paulo')::date=date '2026-09-08'
  join public.categories category on category.season_id=season.id
    and category.slug in ('rapidos','insanos')
  join public.sessions session_row on session_row.stage_id=stage.id
    and session_row.name in ('Corrida 1 - Horário','Corrida 2 - Anti-horário')
  where championship.slug='udk' and season.year=2026
), payload(category_slug,session_name,external_id,title,fastest_lap_ms) as (values
 ('insanos','Corrida 1 - Horário',2026090801,'Resultado homologado - 2ª etapa - Ultras Rápidos - Corrida 1',51610),
 ('insanos','Corrida 2 - Anti-horário',2026090802,'Resultado homologado - 2ª etapa - Ultras Rápidos - Corrida 2',51235),
 ('rapidos','Corrida 1 - Horário',2026090803,'Resultado homologado - 2ª etapa - Ultra Insanos - Corrida 1',53754),
 ('rapidos','Corrida 2 - Anti-horário',2026090804,'Resultado homologado - 2ª etapa - Ultra Insanos - Corrida 2',52385)
)
insert into public.results(stage_id,category_id,session_id,title,status,version,fastest_lap_ms,published_at,source_system,external_racing_id,external_imported_at)
select s.stage_id,s.category_id,s.session_id,p.title,'published',1,p.fastest_lap_ms,timestamptz '2026-09-08 23:30:00-03','manual_pdf',p.external_id,now()
from scope s join payload p using(category_slug,session_name)
where not exists (select 1 from public.results r where r.external_racing_id=p.external_id and r.deleted_at is null);

-- C1/C2 homologados da imagem oficial, em ordem de classificação da categoria.
with rows(category_slug,session_name,driver_slug,position,points) as (values
 ('insanos','Corrida 1 - Horário','andre-felisberto',1,50),('insanos','Corrida 1 - Horário','lucas-rabelo',2,45),('insanos','Corrida 1 - Horário','fabio-filho',3,42),('insanos','Corrida 1 - Horário','marcelo-augusto',4,35),('insanos','Corrida 1 - Horário','vitor-hugo',5,37),('insanos','Corrida 1 - Horário','pablo-fonseca',6,40),('insanos','Corrida 1 - Horário','alexandre-janotti',7,38),('insanos','Corrida 1 - Horário','rafael-soares',8,36),('insanos','Corrida 1 - Horário','agenor-jr',9,34),('insanos','Corrida 1 - Horário','gegela',10,33),('insanos','Corrida 1 - Horário','renato-oliveira',11,30),('insanos','Corrida 1 - Horário','bernardo-thadeu',12,32),('insanos','Corrida 1 - Horário','lucas-guimaraes',13,32),
 ('insanos','Corrida 2 - Anti-horário','andre-felisberto',1,51),('insanos','Corrida 2 - Anti-horário','lucas-rabelo',2,45),('insanos','Corrida 2 - Anti-horário','fabio-filho',3,35),('insanos','Corrida 2 - Anti-horário','marcelo-augusto',4,42),('insanos','Corrida 2 - Anti-horário','vitor-hugo',5,38),('insanos','Corrida 2 - Anti-horário','pablo-fonseca',6,31),('insanos','Corrida 2 - Anti-horário','alexandre-janotti',7,32),('insanos','Corrida 2 - Anti-horário','rafael-soares',8,34),('insanos','Corrida 2 - Anti-horário','agenor-jr',9,36),('insanos','Corrida 2 - Anti-horário','gegela',10,37),('insanos','Corrida 2 - Anti-horário','renato-oliveira',11,33),('insanos','Corrida 2 - Anti-horário','bernardo-thadeu',12,30),('insanos','Corrida 2 - Anti-horário','lucas-guimaraes',13,30),
 ('rapidos','Corrida 1 - Horário','arthur-henrique',1,45),('rapidos','Corrida 1 - Horário','bernardo-thadeu',2,35),('rapidos','Corrida 1 - Horário','marcos-felipe',3,40),('rapidos','Corrida 1 - Horário','pedro-henrique',4,42),('rapidos','Corrida 1 - Horário','braulio-bonoto',5,36),('rapidos','Corrida 1 - Horário','raphael-werner',6,50),('rapidos','Corrida 1 - Horário','pedro-teles',7,37),('rapidos','Corrida 1 - Horário','fernando-godoy',8,32),('rapidos','Corrida 1 - Horário','lucas-godoy',9,34),('rapidos','Corrida 1 - Horário','reinaldo-teles',10,38),('rapidos','Corrida 1 - Horário','marcelo-marques',11,33),('rapidos','Corrida 1 - Horário','maxmiiler-frantiescoly',12,29),('rapidos','Corrida 1 - Horário','gabriel-fernandes',13,27),('rapidos','Corrida 1 - Horário','rafael-morais',14,31),('rapidos','Corrida 1 - Horário','wesley-cardoso',15,26),('rapidos','Corrida 1 - Horário','guilherme-faria',16,28),('rapidos','Corrida 1 - Horário','newton',17,30),('rapidos','Corrida 1 - Horário','theodoro',18,25),('rapidos','Corrida 1 - Horário','lucca-dambros',19,24),
 ('rapidos','Corrida 2 - Anti-horário','arthur-henrique',1,50),('rapidos','Corrida 2 - Anti-horário','bernardo-thadeu',2,45),('rapidos','Corrida 2 - Anti-horário','marcos-felipe',3,40),('rapidos','Corrida 2 - Anti-horário','pedro-henrique',4,37),('rapidos','Corrida 2 - Anti-horário','braulio-bonoto',5,42),('rapidos','Corrida 2 - Anti-horário','raphael-werner',6,26),('rapidos','Corrida 2 - Anti-horário','pedro-teles',7,38),('rapidos','Corrida 2 - Anti-horário','fernando-godoy',8,36),('rapidos','Corrida 2 - Anti-horário','lucas-godoy',9,32),('rapidos','Corrida 2 - Anti-horário','reinaldo-teles',10,28),('rapidos','Corrida 2 - Anti-horário','marcelo-marques',11,31),('rapidos','Corrida 2 - Anti-horário','maxmiiler-frantiescoly',12,35),('rapidos','Corrida 2 - Anti-horário','gabriel-fernandes',13,34),('rapidos','Corrida 2 - Anti-horário','rafael-morais',14,29),('rapidos','Corrida 2 - Anti-horário','wesley-cardoso',15,33),('rapidos','Corrida 2 - Anti-horário','guilherme-faria',16,30),('rapidos','Corrida 2 - Anti-horário','newton',17,27),('rapidos','Corrida 2 - Anti-horário','theodoro',18,25),('rapidos','Corrida 2 - Anti-horário','lucca-dambros',19,24)
), scope as (
 select r.id result_id, se.id season_id, c.id category_id, c.slug category_slug, ss.name session_name
 from public.results r
 join public.stages st on st.id=r.stage_id
 join public.seasons se on se.id=st.season_id
 join public.categories c on c.id=r.category_id
 join public.sessions ss on ss.id=r.session_id
 where r.external_racing_id between 2026090801 and 2026090804
), inserted as (
 insert into public.result_entries(result_id,driver_id,position,status,points,gross_points,penalty_points)
 select sc.result_id,d.id,rows.position,'classified',rows.points,rows.points,0
 from rows join scope sc using(category_slug,session_name)
 join public.drivers d on d.season_id=sc.season_id and d.slug=rows.driver_slug
 where not exists (select 1 from public.result_entries e where e.result_id=sc.result_id and e.driver_id=d.id and e.deleted_at is null)
 returning id
) select count(*) from inserted;

update public.stages set status='homologated', updated_at=now()
where (starts_at at time zone 'America/Sao_Paulo')::date=date '2026-09-08';
