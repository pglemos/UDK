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
      and result.version = 2
      and result.status = 'rectified'
      and entry.penalty_points = 10
      and entry.penalty_ms = 0
      and entry.deleted_at is null
  ),
  8::bigint,
  'all eight black/white flags deduct points without adding another five seconds'
);

select is(
  (
    select entry.position
    from public.result_entries entry
    join public.results result on result.id = entry.result_id
    join public.drivers driver on driver.id = entry.driver_id
    where result.version = 2
      and result.status = 'rectified'
      and driver.slug = 'braulio-bonoto'
      and entry.deleted_at is null
    limit 1
  ),
  13,
  'Braulio keeps P13 because the official LapTime result already contains the five-second penalty'
);

select is(
  (
    select entry.points::integer
    from public.result_entries entry
    join public.results result on result.id = entry.result_id
    join public.drivers driver on driver.id = entry.driver_id
    where result.version = 2
      and result.status = 'rectified'
      and driver.slug = 'braulio-bonoto'
      and entry.deleted_at is null
    limit 1
  ),
  120,
  'Braulio receives P13 base points minus only the 10-point championship deduction'
);

select is(
  (
    select entry.position
    from public.result_entries entry
    join public.results result on result.id = entry.result_id
    join public.drivers driver on driver.id = entry.driver_id
    where result.version = 2
      and result.status = 'rectified'
      and driver.slug = 'lucca-dambros'
      and entry.deleted_at is null
    limit 1
  ),
  14,
  'Lucca remains P14 because no second time penalty is added to Braulio'
);

select is(
  (
    select entry.points::integer
    from public.result_entries entry
    join public.results result on result.id = entry.result_id
    join public.drivers driver on driver.id = entry.driver_id
    where result.version = 2
      and result.status = 'rectified'
      and driver.slug = 'lucca-dambros'
      and entry.deleted_at is null
    limit 1
  ),
  129,
  'Lucca keeps P14 Endurance base points'
);

select * from finish();
rollback;
