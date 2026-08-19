-- Corrige a homologação da 1ª etapa: o TimingOfficialReport entregue pela
-- cronometragem já incorpora os +5 s das bandeiras preta/branca no TT e na
-- ordem final. A camada UDK deve aplicar somente a dedução de -10 pontos no
-- campeonato, sem somar outros 5 s e sem reordenar novamente a corrida.

-- 1. Restaura a ordem oficial dos ULTRAS RÁPIDOS sem colidir com a unicidade
-- (result_id, position): Bráulio P13 e Lucca P14 no relatório de origem.
with target as (
  select result.id as result_id
  from public.results result
  join public.categories category on category.id = result.category_id
  join public.stages stage on stage.id = result.stage_id
  join public.seasons season on season.id = stage.season_id
  join public.championships championship on championship.id = season.championship_id
  where championship.slug = 'udk'
    and season.year = 2026
    and category.slug = 'rapidos'
    and (stage.starts_at at time zone 'America/Sao_Paulo')::date = date '2026-08-18'
    and result.version = 2
    and result.status = 'rectified'
    and result.deleted_at is null
  limit 1
)
update public.result_entries entry
set position = case driver.slug
  when 'braulio-bonoto' then 4013
  when 'lucca-dambros' then 4014
  else entry.position
end
from target, public.drivers driver
where entry.result_id = target.result_id
  and driver.id = entry.driver_id
  and driver.slug in ('braulio-bonoto', 'lucca-dambros')
  and entry.deleted_at is null;

with target as (
  select result.id as result_id
  from public.results result
  join public.categories category on category.id = result.category_id
  join public.stages stage on stage.id = result.stage_id
  join public.seasons season on season.id = stage.season_id
  join public.championships championship on championship.id = season.championship_id
  where championship.slug = 'udk'
    and season.year = 2026
    and category.slug = 'rapidos'
    and (stage.starts_at at time zone 'America/Sao_Paulo')::date = date '2026-08-18'
    and result.version = 2
    and result.status = 'rectified'
    and result.deleted_at is null
  limit 1
)
update public.result_entries entry
set
  position = case driver.slug
    when 'braulio-bonoto' then 13
    when 'lucca-dambros' then 14
    else entry.position
  end,
  sporting_note = case driver.slug
    when 'braulio-bonoto' then
      'Bandeira preta/branca: os +5 s já estão refletidos no TT/ordem do TimingOfficialReport; aplica-se somente -10 pontos no campeonato. Parada obrigatória não realizada; -7 voltas já refletidas no resultado LapTime.'
    when 'lucca-dambros' then
      'P14 preservado conforme TimingOfficialReport. Bráulio permanece P13 porque os +5 s da bandeira preta/branca já estavam incorporados ao TT oficial.'
    else entry.sporting_note
  end
from target, public.drivers driver
where entry.result_id = target.result_id
  and driver.id = entry.driver_id
  and driver.slug in ('braulio-bonoto', 'lucca-dambros')
  and entry.deleted_at is null;

-- 2. Remove a DUPLICAÇÃO de tempo dos oito registros de bandeira preta/branca.
-- penalty_points continua em 10 para que o trigger recalcule somente a punição
-- de campeonato. O TT armazenado permanece exatamente o do TimingOfficialReport.
with stage_scope as (
  select stage.id as stage_id, season.id as season_id
  from public.stages stage
  join public.seasons season on season.id = stage.season_id
  join public.championships championship on championship.id = season.championship_id
  where championship.slug = 'udk'
    and season.year = 2026
    and (stage.starts_at at time zone 'America/Sao_Paulo')::date = date '2026-08-18'
  limit 1
), flagged(slug, note) as (
  values
    ('francisco-biuchi'::text, 'Bandeira preta/branca: os +5 s já estão refletidos no TT/ordem do TimingOfficialReport; aplica-se somente -10 pontos no campeonato. Pit inválido 04:59.221; -7 voltas já refletidas no resultado LapTime.'::text),
    ('vitor-hugo', 'Bandeira preta/branca: os +5 s já estão refletidos no TT/ordem do TimingOfficialReport; aplica-se somente -10 pontos no campeonato. Pit inválido 04:59.335; -7 voltas já refletidas no resultado LapTime.'),
    ('rodrigo-boris', 'Bandeira preta/branca: os +5 s já estão refletidos no TT/ordem do TimingOfficialReport; aplica-se somente -10 pontos no campeonato. Pit inválido 04:59.796; -7 voltas já refletidas no resultado LapTime.'),
    ('pablo-fonseca', 'Bandeira preta/branca: os +5 s já estão refletidos no TT/ordem do TimingOfficialReport; aplica-se somente -10 pontos no campeonato. Pit inválido 04:59.720; -7 voltas já refletidas no resultado LapTime.'),
    ('wesley-cardoso', 'Bandeira preta/branca: os +5 s já estão refletidos no TT/ordem do TimingOfficialReport; aplica-se somente -10 pontos no campeonato. Pit inválido 04:59.959; -7 voltas já refletidas no resultado LapTime.'),
    ('fernando-godoy', 'Bandeira preta/branca: os +5 s já estão refletidos no TT/ordem do TimingOfficialReport; aplica-se somente -10 pontos no campeonato. Pit inválido 04:06.087; -7 voltas já refletidas no resultado LapTime.'),
    ('braulio-bonoto', 'Bandeira preta/branca: os +5 s já estão refletidos no TT/ordem do TimingOfficialReport; aplica-se somente -10 pontos no campeonato. Parada obrigatória não realizada; -7 voltas já refletidas no resultado LapTime.'),
    ('toninho-da-prata', 'Bandeira preta/branca: os +5 s já estão refletidos no TT/ordem do TimingOfficialReport; aplica-se somente -10 pontos no campeonato.')
)
update public.result_entries entry
set
  penalty_ms = 0,
  penalty_points = 10,
  sporting_note = flagged.note,
  updated_at = now()
from public.results result
join stage_scope on stage_scope.stage_id = result.stage_id
join public.drivers driver on driver.season_id = stage_scope.season_id
join flagged on flagged.slug = driver.slug
where entry.result_id = result.id
  and entry.driver_id = driver.id
  and result.version = 2
  and result.status = 'rectified'
  and result.deleted_at is null
  and entry.deleted_at is null;

-- 3. Corrige o texto da decisão desportiva para deixar explícito que a camada
-- UDK NÃO acrescenta outro tempo à classificação fornecida pela cronometragem.
with stage_scope as (
  select stage.id as stage_id
  from public.stages stage
  join public.seasons season on season.id = stage.season_id
  join public.championships championship on championship.id = season.championship_id
  where championship.slug = 'udk'
    and season.year = 2026
    and (stage.starts_at at time zone 'America/Sao_Paulo')::date = date '2026-08-18'
  limit 1
)
update public.penalties penalty
set
  effect = '+5 segundos já refletidos no TT/ordem do TimingOfficialReport; -10 pontos aplicados no campeonato.',
  updated_at = now()
from stage_scope
where penalty.stage_id = stage_scope.stage_id
  and penalty.code = 'BW-01'
  and penalty.status = 'homologated'
  and penalty.deleted_at is null;

-- 4. Materializa uma nova versão da classificação de campeonato a partir da
-- v2 retificada já corrigida. A posição do resultado da corrida permanece uma
-- coisa; o ranking do campeonato continua ordenado pelos pontos acumulados.
with season_scope as (
  select season.id as season_id, category.id as category_id, category.slug as category_slug
  from public.seasons season
  join public.championships championship on championship.id = season.championship_id
  join public.categories category on category.season_id = season.id
  where championship.slug = 'udk'
    and season.year = 2026
    and category.slug in ('insanos', 'rapidos')
), result_scope as (
  select scope.*, result.id as result_id
  from season_scope scope
  join public.results result on result.category_id = scope.category_id
  join public.stages stage on stage.id = result.stage_id
  where result.version = 2
    and result.status = 'rectified'
    and result.deleted_at is null
    and (stage.starts_at at time zone 'America/Sao_Paulo')::date = date '2026-08-18'
    and result.external_racing_id = case scope.category_slug
      when 'insanos' then 2026081801
      else 2026081802
    end
), next_version as (
  select scope.season_id, scope.category_id, coalesce(max(standing.version), 0) + 1 as version
  from season_scope scope
  left join public.standings standing
    on standing.season_id = scope.season_id
   and standing.category_id = scope.category_id
   and standing.deleted_at is null
  group by scope.season_id, scope.category_id
), scored as (
  select
    scope.season_id,
    scope.category_id,
    driver.id as driver_id,
    coalesce(entry.points, 0)::numeric(8,2) as points,
    case when entry.position = 1 and entry.status = 'classified' then 1 else 0 end as wins,
    case when entry.position between 1 and 3 and entry.status = 'classified' then 1 else 0 end as podiums,
    case when entry.pole then 1 else 0 end as poles
  from result_scope scope
  join public.drivers driver
    on driver.season_id = scope.season_id
   and driver.category_id = scope.category_id
   and driver.status = 'approved'
   and driver.deleted_at is null
  left join public.result_entries entry
    on entry.result_id = scope.result_id
   and entry.driver_id = driver.id
   and entry.deleted_at is null
), ranked as (
  select
    scored.*,
    row_number() over (
      partition by category_id
      order by points desc, wins desc, podiums desc, poles desc, driver_id
    )::integer as position
  from scored
)
insert into public.standings (
  season_id, category_id, driver_id, points, gross_points,
  wins, podiums, poles, position, version, status
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
  next_version.version,
  'rectified'
from ranked
join next_version using (season_id, category_id);
