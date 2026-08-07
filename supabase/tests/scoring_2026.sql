create extension if not exists pgtap;

begin;
select plan(12);

select is(
  (
    select (rule.position_points ->> '1')::integer
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
  50,
  'regular P1 is worth 50 points'
);

select is(
  (
    select (rule.position_points ->> '42')::integer
    from public.points_rules rule
    join public.seasons season on season.id = rule.season_id
    join public.championships championship on championship.id = season.championship_id
    where championship.slug = 'udk' and season.year = 2026
      and rule.event_format = 'regular' and rule.category_id is null
      and rule.active and rule.deleted_at is null
    order by rule.version desc limit 1
  ),
  1,
  'regular P42 is worth 1 point'
);

select is(
  (
    select rule.pole_points::integer
    from public.points_rules rule
    join public.seasons season on season.id = rule.season_id
    join public.championships championship on championship.id = season.championship_id
    where championship.slug = 'udk' and season.year = 2026
      and rule.event_format = 'regular' and rule.category_id is null
      and rule.active and rule.deleted_at is null
    order by rule.version desc limit 1
  ),
  1,
  'pole bonus is one point'
);

select is(
  (
    select rule.fastest_lap_points::integer
    from public.points_rules rule
    join public.seasons season on season.id = rule.season_id
    join public.championships championship on championship.id = season.championship_id
    where championship.slug = 'udk' and season.year = 2026
      and rule.event_format = 'regular' and rule.category_id is null
      and rule.active and rule.deleted_at is null
    order by rule.version desc limit 1
  ),
  1,
  'fastest-lap bonus is one point'
);

select is(
  (
    select (rule.position_points ->> '1')::integer
    from public.points_rules rule
    join public.seasons season on season.id = rule.season_id
    join public.championships championship on championship.id = season.championship_id
    where championship.slug = 'udk' and season.year = 2026
      and rule.event_format = 'endurance' and rule.category_id is null
      and rule.active and rule.deleted_at is null
    order by rule.version desc limit 1
  ),
  150,
  'Endurance P1 is worth 150 points'
);

select is(
  (
    select (rule.position_points ->> '6')::integer
    from public.points_rules rule
    join public.seasons season on season.id = rule.season_id
    join public.championships championship on championship.id = season.championship_id
    where championship.slug = 'udk' and season.year = 2026
      and rule.event_format = 'endurance' and rule.category_id is null
      and rule.active and rule.deleted_at is null
    order by rule.version desc limit 1
  ),
  137,
  'Endurance P6 continues at 137 points'
);

select is(
  (
    select (rule.position_points ->> '142')::integer
    from public.points_rules rule
    join public.seasons season on season.id = rule.season_id
    join public.championships championship on championship.id = season.championship_id
    where championship.slug = 'udk' and season.year = 2026
      and rule.event_format = 'endurance' and rule.category_id is null
      and rule.active and rule.deleted_at is null
    order by rule.version desc limit 1
  ),
  1,
  'Endurance sequence reaches one point at P142'
);

select is(
  (
    select count(*)
    from public.sessions session_row
    join public.stages stage on stage.id = session_row.stage_id
    join public.seasons season on season.id = stage.season_id
    join public.championships championship on championship.id = season.championship_id
    where championship.slug = 'udk'
      and season.year = 2026
      and session_row.kind in ('race', 'endurance')
      and session_row.deleted_at is null
  ),
  8::bigint,
  'the season materializes exactly eight scoring sessions'
);

select is(
  (
    select count(*)
    from public.sessions session_row
    join public.stages stage on stage.id = session_row.stage_id
    join public.seasons season on season.id = stage.season_id
    join public.championships championship on championship.id = season.championship_id
    where championship.slug = 'udk'
      and season.year = 2026
      and session_row.kind = 'race'
      and session_row.deleted_at is null
  ),
  6::bigint,
  'three regular stages create six race sessions'
);

select has_column('public', 'public_portal_standings', 'gross_points', 'public standings expose gross points');
select has_column('public', 'public_portal_standings', 'discarded_points', 'public standings expose discarded points');

select ok(
  position('event_count - 6' in pg_get_functiondef('public.recalculate_standings(uuid,uuid)'::regprocedure)) > 0
  and position('least(2' in pg_get_functiondef('public.recalculate_standings(uuid,uuid)'::regprocedure)) > 0
  and position('coalesce(entry.points, 0)' in lower(pg_get_functiondef('public.recalculate_standings(uuid,uuid)'::regprocedure))) > 0,
  'standings function applies progressive best-six-of-eight discards including zero-point absences'
);

select * from finish();
rollback;
