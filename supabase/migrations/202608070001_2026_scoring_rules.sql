-- Official UDK 2026 scoring events and points rules.

alter table public.results
  drop constraint if exists results_stage_id_category_id_version_key;

-- The current Supabase CLI applies migrations in pipeline mode and rejects
-- CREATE INDEX CONCURRENTLY with SQLSTATE 25001. Keep this index transactional
-- so db reset/db push can apply the schema deterministically. `public.results`
-- is small enough in the current championship workload for this migration path.
create unique index if not exists results_scoring_event_version_unique_idx
  on public.results (
    stage_id,
    coalesce(category_id, '00000000-0000-0000-0000-000000000000'::uuid),
    coalesce(session_id, '00000000-0000-0000-0000-000000000000'::uuid),
    version
  )
  where deleted_at is null;

insert into public.sessions (stage_id, category_id, name, kind, status)
select stage.id, null, session_row.name, session_row.kind, 'scheduled'
from public.stages stage
join public.seasons season on season.id = stage.season_id
join public.championships championship on championship.id = season.championship_id
cross join lateral (
  select 'Endurance 1h'::text as name, 'endurance'::text as kind
  where stage.format = 'endurance'
  union all
  select 'Corrida 1 - Horário'::text, 'race'::text
  where stage.format = 'regular'
  union all
  select 'Corrida 2 - Anti-horário'::text, 'race'::text
  where stage.format = 'regular'
) session_row
where season.year = 2026
  and championship.slug = 'udk'
  and stage.deleted_at is null
on conflict (stage_id, name) do update
set
  kind = excluded.kind,
  category_id = excluded.category_id,
  deleted_at = null,
  updated_at = now();

update public.points_rules rule
set active = false, updated_at = now()
from public.seasons season
join public.championships championship on championship.id = season.championship_id
where rule.season_id = season.id
  and season.year = 2026
  and championship.slug = 'udk'
  and rule.event_format in ('regular', 'endurance')
  and rule.active
  and rule.deleted_at is null;

with regular_points as (
  select '{"1":50,"2":45,"3":42,"4":40,"5":38,"6":37,"7":36,"8":35,"9":34,"10":33,"11":32,"12":31,"13":30,"14":29,"15":28,"16":27,"17":26,"18":25,"19":24,"20":23,"21":22,"22":21,"23":20,"24":19,"25":18,"26":17,"27":16,"28":15,"29":14,"30":13,"31":12,"32":11,"33":10,"34":9,"35":8,"36":7,"37":6,"38":5,"39":4,"40":3,"41":2,"42":1}'::jsonb as points
), endurance_points as (
  select jsonb_object_agg(position::text, points order by position) as points
  from (
    select
      position,
      case position
        when 1 then 150
        when 2 then 145
        when 3 then 142
        when 4 then 140
        when 5 then 138
        else greatest(0, 143 - position)
      end as points
    from generate_series(1, 142) position
  ) scored
), season_scope as (
  select season.id
  from public.seasons season
  join public.championships championship on championship.id = season.championship_id
  where season.year = 2026 and championship.slug = 'udk'
), rule_versions as (
  select
    season_scope.id as season_id,
    format.event_format,
    coalesce(max(existing.version), 0) + 1 as next_version
  from season_scope
  cross join (values ('regular'::text), ('endurance'::text)) format(event_format)
  left join public.points_rules existing
    on existing.season_id = season_scope.id
   and existing.event_format = format.event_format
   and existing.category_id is null
  group by season_scope.id, format.event_format
)
insert into public.points_rules (
  season_id, category_id, event_format, position_points,
  pole_points, fastest_lap_points, active, version
)
select
  rule_versions.season_id,
  null,
  rule_versions.event_format,
  case when rule_versions.event_format = 'regular' then regular_points.points else endurance_points.points end,
  1,
  1,
  true,
  rule_versions.next_version
from rule_versions
cross join regular_points
cross join endurance_points;
