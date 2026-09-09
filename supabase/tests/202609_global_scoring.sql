create extension if not exists pgtap;

begin;
select plan(22);

select ok(
  (
    select count(*) = 1
    from public.points_rules rule
    join public.seasons season on season.id = rule.season_id
    join public.championships championship on championship.id = season.championship_id
    where championship.slug = 'udk'
      and season.year = 2026
      and rule.event_format = 'regular'
      and rule.category_id is null
      and rule.active
      and rule.deleted_at is null
  ),
  'one active global regular rule'
);

select is(
  (
    select (rule.position_points ->> '42')::integer
    from public.points_rules rule
    join public.seasons season on season.id = rule.season_id
    join public.championships championship on championship.id = season.championship_id
    where championship.slug = 'udk'
      and season.year = 2026
      and rule.event_format = 'regular'
      and rule.category_id is null
      and rule.active
      and rule.deleted_at is null
    order by rule.version desc
    limit 1
  ),
  1,
  'regular P42 is one point'
);

select is(
  (
    select (rule.position_points ->> '1')::integer
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
  150,
  'Endurance P1 is 150 points'
);

select is(
  (
    select (rule.position_points ->> '30')::integer
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
  113,
  'Endurance P30 is 113 points'
);

select ok(
  (
    select not (rule.position_points ? '31')
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
  'Endurance positions after P30 have no arrival-point entry'
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
  'Endurance best pit is 10 points'
);

select is(
  (
    select count(*)
    from public.results result
    where result.external_racing_id in (2026081801, 2026090801, 2026090802)
      and result.category_id is null
      and result.deleted_at is null
  ),
  3::bigint,
  'published history has one combined result per race'
);

select is(
  (
    select count(*)
    from public.result_entries entry
    join public.results result on result.id = entry.result_id
    where result.external_racing_id = 2026081801
      and result.category_id is null
      and result.deleted_at is null
      and entry.deleted_at is null
  ),
  39::bigint,
  'Endurance has all 39 general entries'
);

select is(
  (
    select count(*)
    from public.result_entries entry
    join public.results result on result.id = entry.result_id
    where result.external_racing_id = 2026090801
      and result.category_id is null
      and result.deleted_at is null
      and entry.deleted_at is null
  ),
  33::bigint,
  'race 1 has all 33 general entries'
);

select is(
  (
    select count(*)
    from public.result_entries entry
    join public.results result on result.id = entry.result_id
    where result.external_racing_id = 2026090802
      and result.category_id is null
      and result.deleted_at is null
      and entry.deleted_at is null
  ),
  33::bigint,
  'race 2 has all 33 general entries including NC'
);

select ok(
  (
    select entry.position = 9
      and entry.points = 34
      and driver.category_id = category.id
    from public.result_entries entry
    join public.results result on result.id = entry.result_id
    join public.drivers driver on driver.id = entry.driver_id
    join public.categories category on category.slug = 'rapidos'
    where result.external_racing_id = 2026090801
      and result.category_id is null
      and driver.slug = 'raphael-werner'
      and entry.deleted_at is null
  ),
  'race 1 keeps the global position across categories'
);

select ok(
  (
    select entry.position = 2
      and entry.points = 46
      and entry.fastest_lap
    from public.result_entries entry
    join public.results result on result.id = entry.result_id
    join public.drivers driver on driver.id = entry.driver_id
    where result.external_racing_id = 2026090801
      and result.category_id is null
      and driver.slug = 'lucas-rabelo'
      and entry.deleted_at is null
  ),
  'Lucas Rabelo has the missing race 1 fastest-lap point'
);

select ok(
  (
    select entry.position = 33
      and entry.status = 'nc'
      and entry.points = 0
    from public.result_entries entry
    join public.results result on result.id = entry.result_id
    join public.drivers driver on driver.id = entry.driver_id
    where result.external_racing_id = 2026090802
      and result.category_id is null
      and driver.slug = 'lucas-gabriel-voieta-parreira'
      and entry.deleted_at is null
  ),
  'NC remains at the end of the global race result without arrival points'
);

select ok(
  (
    select entry.position = 2
      and entry.points = 146
      and entry.pole
    from public.result_entries entry
    join public.results result on result.id = entry.result_id
    join public.drivers driver on driver.id = entry.driver_id
    where result.external_racing_id = 2026081801
      and result.category_id is null
      and driver.slug = 'andre-felisberto'
      and entry.deleted_at is null
  ),
  'Endurance pole bonus follows the combined result'
);

select ok(
  (
    select entry.position = 9
      and entry.points = 144
      and entry.best_pit
    from public.result_entries entry
    join public.results result on result.id = entry.result_id
    join public.drivers driver on driver.id = entry.driver_id
    where result.external_racing_id = 2026081801
      and result.category_id is null
      and driver.slug = 'lucas-rabelo'
      and entry.deleted_at is null
  ),
  'Endurance best-pit bonus follows the combined result'
);

select ok(
  (
    select entry.position = 11
      and entry.points = 133
      and entry.fastest_lap
    from public.result_entries entry
    join public.results result on result.id = entry.result_id
    join public.drivers driver on driver.id = entry.driver_id
    where result.external_racing_id = 2026081801
      and result.category_id is null
      and driver.slug = 'arthur-henrique'
      and entry.deleted_at is null
  ),
  'Endurance fastest-lap bonus follows the combined result'
);

select is(
  (
    select count(*)
    from public.result_entries entry
    join public.results result on result.id = entry.result_id
    where result.external_racing_id = 2026090801
      and result.category_id is null
      and entry.pole
      and entry.deleted_at is null
  ),
  1::bigint,
  'race 1 has one pole bonus'
);

select is(
  (
    select count(*)
    from public.result_entries entry
    join public.results result on result.id = entry.result_id
    where result.external_racing_id = 2026090801
      and result.category_id is null
      and entry.fastest_lap
      and entry.deleted_at is null
  ),
  1::bigint,
  'race 1 has one fastest-lap bonus'
);

select is(
  (
    select count(*)
    from public.result_entries entry
    join public.results result on result.id = entry.result_id
    where result.external_racing_id = 2026090802
      and result.category_id is null
      and entry.pole
      and entry.deleted_at is null
  ),
  1::bigint,
  'race 2 has one pole bonus'
);

select is(
  (
    select count(*)
    from public.result_entries entry
    join public.results result on result.id = entry.result_id
    where result.external_racing_id = 2026090802
      and result.category_id is null
      and entry.fastest_lap
      and entry.deleted_at is null
  ),
  1::bigint,
  'race 2 has one fastest-lap bonus'
);

select is(
  (
    select count(*)
    from public.results result
    where result.external_racing_id in (2026081801, 2026090801, 2026090802)
      and result.category_id is not null
      and result.deleted_at is null
  ),
  0::bigint,
  'legacy category result rows are archived from the public scope'
);

select is(
  (
    select standing.points::integer
    from public.public_portal_standings standing
    where standing.slug = 'lucas-rabelo'
  ),
  235,
  'standings include the recalculated Lucas Rabelo total'
);

select * from finish();
rollback;
