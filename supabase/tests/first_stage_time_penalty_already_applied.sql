create extension if not exists pgtap;

begin;
select plan(5);

-- O TimingOfficialReport já traz os 5 segundos incorporados ao TT/ordem final.
-- A retificação deve aplicar apenas a dedução de pontos no campeonato, sem
-- somar novamente 5 segundos nem reordenar a classificação publicada.

select is(
  (
    select count(*)
    from public.result_entries entry
    join public.results result on result.id = entry.result_id
    join public.stages stage on stage.id = result.stage_id
    join public.seasons season on season.id = stage.season_id
    join public.championships championship on championship.id = season.championship_id
    where championship.slug = 'udk'
      and season.year = 2026
      and (stage.starts_at at time zone 'America/Sao_Paulo')::date = date '2026-08-18'
      and result.category_id is null
      and result.external_racing_id = 2026081801
      and result.version = 1
      and result.status = 'rectified'
      and entry.penalty_points = 10
      and entry.penalty_ms = 0
      and entry.deleted_at is null
  ),
  8::bigint,
  'all eight combined Endurance flags deduct points without adding another five seconds'
);

select ok(
  (
    select entry.position = 28
      and entry.position < lucca.position
      and entry.penalty_ms = 0
    from public.result_entries entry
    join public.results result on result.id = entry.result_id
    join public.drivers driver on driver.id = entry.driver_id
    join public.result_entries lucca on lucca.result_id = entry.result_id
    join public.drivers lucca_driver on lucca_driver.id = lucca.driver_id
    where result.category_id is null
      and result.external_racing_id = 2026081801
      and result.version = 1
      and result.status = 'rectified'
      and driver.slug = 'braulio-bonoto'
      and lucca_driver.slug = 'lucca-dambros'
      and entry.deleted_at is null
      and lucca.deleted_at is null
    limit 1
  ),
  'Braulio remains P28 ahead of Lucca in the combined result'
);

select is(
  (
    select entry.points::integer
    from public.result_entries entry
    join public.results result on result.id = entry.result_id
    join public.drivers driver on driver.id = entry.driver_id
    where result.category_id is null
      and result.external_racing_id = 2026081801
      and result.version = 1
      and result.status = 'rectified'
      and driver.slug = 'braulio-bonoto'
      and entry.deleted_at is null
    limit 1
  ),
  105,
  'Braulio receives P28 Endurance points minus the championship deduction'
);

select is(
  (
    select entry.position
    from public.result_entries entry
    join public.results result on result.id = entry.result_id
    join public.drivers driver on driver.id = entry.driver_id
    where result.category_id is null
      and result.external_racing_id = 2026081801
      and result.version = 1
      and result.status = 'rectified'
      and driver.slug = 'lucca-dambros'
      and entry.deleted_at is null
    limit 1
  ),
  29,
  'Lucca remains P29 in the combined Endurance result'
);

select is(
  (
    select entry.points::integer
    from public.result_entries entry
    join public.results result on result.id = entry.result_id
    join public.drivers driver on driver.id = entry.driver_id
    where result.category_id is null
      and result.external_racing_id = 2026081801
      and result.version = 1
      and result.status = 'rectified'
      and driver.slug = 'lucca-dambros'
      and entry.deleted_at is null
    limit 1
  ),
  114,
  'Lucca receives the combined P29 Endurance points'
);

select * from finish();
rollback;
