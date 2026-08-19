create extension if not exists pgtap;

begin;
select plan(18);

select has_column(
  'public', 'points_rules', 'best_pit_points',
  'points rules support the Endurance best-pit bonus'
);

select has_column(
  'public', 'result_entries', 'best_pit',
  'result entries identify the best valid Endurance pit stop'
);

select has_column(
  'public', 'result_entries', 'penalty_points',
  'result entries support championship-point penalties'
);

select has_column(
  'public', 'result_entries', 'timing_adjustment_laps',
  'result entries preserve manual timing lap adjustments'
);

select ok(
  position('best_pit_points' in pg_get_functiondef('public.apply_result_entry_points()'::regprocedure)) > 0
  and position('penalty_points' in pg_get_functiondef('public.apply_result_entry_points()'::regprocedure)) > 0,
  'automatic scoring includes best-pit bonus and sporting point deductions'
);

select is(
  (
    select rule.best_pit_points::integer
    from public.points_rules rule
    join public.seasons season on season.id = rule.season_id
    join public.championships championship on championship.id = season.championship_id
    where championship.slug = 'udk'
      and season.year = 2026
      and rule.event_format = 'endurance'
      and rule.category_id is null
      and rule.active
      and rule.deleted_at is null
    order by rule.version desc
    limit 1
  ),
  10,
  'Endurance best valid pit stop is worth 10 points'
);

select is(
  (
    select count(*)
    from public.results result
    join public.stages stage on stage.id = result.stage_id
    join public.seasons season on season.id = stage.season_id
    join public.championships championship on championship.id = season.championship_id
    where championship.slug = 'udk'
      and season.year = 2026
      and (stage.starts_at at time zone 'America/Sao_Paulo')::date = date '2026-08-18'
      and result.version = 2
      and result.status = 'rectified'
      and result.deleted_at is null
  ),
  2::bigint,
  'both 1st-stage category results have a rectified version 2'
);

select is(
  (
    select count(*)
    from public.results result
    join public.stages stage on stage.id = result.stage_id
    join public.seasons season on season.id = stage.season_id
    join public.championships championship on championship.id = season.championship_id
    where championship.slug = 'udk'
      and season.year = 2026
      and (stage.starts_at at time zone 'America/Sao_Paulo')::date = date '2026-08-18'
      and result.version = 1
      and result.deleted_at is null
  ),
  2::bigint,
  'published version 1 remains preserved after rectification'
);

select is(
  (
    select entry.laps
    from public.result_entries entry
    join public.results result on result.id = entry.result_id
    join public.drivers driver on driver.id = entry.driver_id
    join public.stages stage on stage.id = result.stage_id
    where result.version = 2
      and result.status = 'rectified'
      and driver.slug = 'pedro-guilherme'
      and (stage.starts_at at time zone 'America/Sao_Paulo')::date = date '2026-08-18'
      and entry.deleted_at is null
    limit 1
  ),
  47,
  'Pedro Guilherme is rectified to 47 official laps'
);

select is(
  (
    select entry.points::integer
    from public.result_entries entry
    join public.results result on result.id = entry.result_id
    join public.drivers driver on driver.id = entry.driver_id
    where result.version = 2 and result.status = 'rectified'
      and driver.slug = 'lucas-rabelo'
      and entry.deleted_at is null
    limit 1
  ),
  144,
  'Lucas Rabelo receives 134 base + 10 best-pit points'
);

select is(
  (
    select entry.points::integer
    from public.result_entries entry
    join public.results result on result.id = entry.result_id
    join public.drivers driver on driver.id = entry.driver_id
    where result.version = 2 and result.status = 'rectified'
      and driver.slug = 'andre-felisberto'
      and entry.deleted_at is null
    limit 1
  ),
  146,
  'Andre Felisberto receives the overall Super Pole bonus'
);

select is(
  (
    select entry.points::integer
    from public.result_entries entry
    join public.results result on result.id = entry.result_id
    join public.drivers driver on driver.id = entry.driver_id
    where result.version = 2 and result.status = 'rectified'
      and driver.slug = 'arthur-henrique'
      and entry.deleted_at is null
    limit 1
  ),
  151,
  'Arthur receives the overall fastest-lap bonus'
);

select is(
  (
    select entry.points::integer
    from public.result_entries entry
    join public.results result on result.id = entry.result_id
    join public.drivers driver on driver.id = entry.driver_id
    where result.version = 2 and result.status = 'rectified'
      and driver.slug = 'bernardo'
      and entry.deleted_at is null
    limit 1
  ),
  132,
  'Bernardo keeps category pole information out of overall bonus scoring'
);

select is(
  (
    select entry.points::integer
    from public.result_entries entry
    join public.results result on result.id = entry.result_id
    join public.drivers driver on driver.id = entry.driver_id
    where result.version = 2 and result.status = 'rectified'
      and driver.slug = 'vitor-hugo'
      and entry.deleted_at is null
    limit 1
  ),
  117,
  'Vitor Hugo has the 10-point black/white sporting deduction'
);

select is(
  (
    select entry.points::integer
    from public.result_entries entry
    join public.results result on result.id = entry.result_id
    join public.drivers driver on driver.id = entry.driver_id
    where result.version = 2 and result.status = 'rectified'
      and driver.slug = 'braulio-bonoto'
      and entry.deleted_at is null
    limit 1
  ),
  120,
  'Braulio Bonoto has the 10-point black/white sporting deduction'
);

select is(
  (
    select count(*)
    from public.penalties penalty
    join public.stages stage on stage.id = penalty.stage_id
    join public.seasons season on season.id = stage.season_id
    join public.championships championship on championship.id = season.championship_id
    where championship.slug = 'udk'
      and season.year = 2026
      and (stage.starts_at at time zone 'America/Sao_Paulo')::date = date '2026-08-18'
      and penalty.code = 'BW-01'
      and penalty.status = 'homologated'
      and penalty.deleted_at is null
  ),
  8::bigint,
  'all eight official black/white flags are persisted as homologated penalties'
);

select is(
  (
    select standing.points::integer
    from public.public_portal_standings standing
    where standing.slug = 'lucas-rabelo'
  ),
  144,
  'public standings expose Lucas Rabelo corrected total'
);

select is(
  (
    select result.version
    from public.public_portal_results result
    where result.category_slug = 'rapidos'
      and result.stage_title ilike '%1%etapa%'
    order by result.version desc
    limit 1
  ),
  2,
  'public results expose the latest rectified version'
);

select * from finish();
rollback;
