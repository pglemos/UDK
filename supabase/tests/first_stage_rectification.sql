create extension if not exists pgtap;

begin;
select plan(20);

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
      and result.category_id is null
      and result.external_racing_id = 2026081801
      and result.version = 1
      and result.status = 'rectified'
      and result.deleted_at is null
  ),
  1::bigint,
  'the 1st-stage Endurance is one rectified combined result'
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
      and result.category_id is not null
      and result.version in (1, 2)
      and result.deleted_at is not null
  ),
  4::bigint,
  'category result versions remain preserved as archived audit'
);

select is(
  (
    select entry.laps
    from public.result_entries entry
    join public.results result on result.id = entry.result_id
    join public.drivers driver on driver.id = entry.driver_id
    join public.stages stage on stage.id = result.stage_id
    where result.category_id is null
      and result.external_racing_id = 2026081801
      and result.version = 1
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
    where result.category_id is null
      and result.external_racing_id = 2026081801
      and result.version = 1 and result.status = 'rectified'
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
    where result.category_id is null
      and result.external_racing_id = 2026081801
      and result.version = 1 and result.status = 'rectified'
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
    where result.category_id is null
      and result.external_racing_id = 2026081801
      and result.version = 1 and result.status = 'rectified'
      and driver.slug = 'arthur-henrique'
      and entry.deleted_at is null
    limit 1
  ),
  133,
  'Arthur receives the overall Endurance fastest-lap bonus'
);

select ok(
  (
    select entry.points = coalesce((rule.position_points ->> entry.position::text)::numeric, 0)
      and not entry.pole
    from public.result_entries entry
    join public.results result on result.id = entry.result_id
    join public.drivers driver on driver.id = entry.driver_id
    join public.stages stage on stage.id = result.stage_id
    join public.points_rules rule
      on rule.season_id = stage.season_id
     and rule.event_format = stage.format
     and rule.category_id is null
     and rule.active
     and rule.deleted_at is null
    where result.category_id is null
      and result.external_racing_id = 2026081801
      and result.version = 1 and result.status = 'rectified'
      and driver.slug = 'bernardo'
      and entry.deleted_at is null
    order by rule.version desc
    limit 1
  ),
  'Bernardo receives only the combined-position Endurance points'
);

select ok(
  (
    select entry.position > 30
      and entry.points = -10
      and entry.penalty_ms = 0
    from public.result_entries entry
    join public.results result on result.id = entry.result_id
    join public.drivers driver on driver.id = entry.driver_id
    where result.category_id is null
      and result.external_racing_id = 2026081801
      and result.version = 1 and result.status = 'rectified'
      and driver.slug = 'vitor-hugo'
      and entry.deleted_at is null
    limit 1
  ),
  'Vitor Hugo is beyond Endurance P30 and keeps only the sporting deduction'
);

select is(
  (
    select entry.position
    from public.result_entries entry
    join public.results result on result.id = entry.result_id
    join public.drivers driver on driver.id = entry.driver_id
    where result.category_id is null
      and result.external_racing_id = 2026081801
      and result.version = 1 and result.status = 'rectified'
      and driver.slug = 'lucca-dambros'
      and entry.deleted_at is null
    limit 1
  ),
  33,
  'Lucca remains at the combined Endurance position'
);

select is(
  (
    select entry.points::integer
    from public.result_entries entry
    join public.results result on result.id = entry.result_id
    join public.drivers driver on driver.id = entry.driver_id
    where result.category_id is null
      and result.external_racing_id = 2026081801
      and result.version = 1 and result.status = 'rectified'
      and driver.slug = 'lucca-dambros'
      and entry.deleted_at is null
    limit 1
  ),
  0,
  'Lucca receives no Endurance arrival points after P30'
);

select ok(
  (
    select entry.position < lucca.position
      and entry.position > 30
      and entry.points = -10
    from public.result_entries entry
    join public.results result on result.id = entry.result_id
    join public.drivers driver on driver.id = entry.driver_id
    join public.result_entries lucca on lucca.result_id = entry.result_id
    join public.drivers lucca_driver on lucca_driver.id = lucca.driver_id
    where result.category_id is null
      and result.external_racing_id = 2026081801
      and result.version = 1 and result.status = 'rectified'
      and driver.slug = 'braulio-bonoto'
      and lucca_driver.slug = 'lucca-dambros'
      and entry.deleted_at is null
      and lucca.deleted_at is null
    limit 1
  ),
  'Braulio stays ahead of Lucca and receives only the sporting deduction'
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
  235,
  'public standings expose Lucas Rabelo recalculated total'
);

select is(
  (
    select count(*)
    from public.public_portal_results result
    where result.category_slug is null
      and result.title = 'Resultado oficial - 1a etapa - Endurance - Geral'
  ),
  1::bigint,
  'public results expose one combined Endurance result'
);

select * from finish();
rollback;
