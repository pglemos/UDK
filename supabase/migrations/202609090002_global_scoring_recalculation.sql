-- UDK 2026: pontuação pela ordem geral conjunta da bateria/prova.
-- A categoria continua sendo apenas o agrupamento do campeonato.

alter table public.points_rules
  add column if not exists best_pit_points numeric(8,2) not null default 0;

with scope as (
  select rule.id, rule.event_format
  from public.points_rules rule
  join public.seasons season on season.id=rule.season_id
  join public.championships championship on championship.id=season.championship_id
  where championship.slug='udk' and season.year=2026
    and rule.category_id is null and rule.active and rule.deleted_at is null
), maps as (
  select 'regular' event_format,
    '{"1":50,"2":45,"3":42,"4":40,"5":38,"6":37,"7":36,"8":35,"9":34,"10":33,"11":32,"12":31,"13":30,"14":29,"15":28,"16":27,"17":26,"18":25,"19":24,"20":23,"21":22,"22":21,"23":20,"24":19,"25":18,"26":17,"27":16,"28":15,"29":14,"30":13,"31":12,"32":11,"33":10,"34":9,"35":8,"36":7,"37":6,"38":5,"39":4,"40":3,"41":2,"42":1}'::jsonb position_points,
    1::numeric pole_points, 1::numeric fastest_lap_points, 0::numeric best_pit_points
  union all
  select 'endurance', jsonb_object_agg(position::text, points order by position), 1, 1, 10
  from (select position, case position when 1 then 150 when 2 then 145 when 3 then 142 when 4 then 140 when 5 then 138 when 6 then 137 when 7 then 136 when 8 then 135 when 9 then 134 when 10 then 133 when 11 then 132 when 12 then 131 when 13 then 130 when 14 then 129 when 15 then 128 when 16 then 127 when 17 then 126 when 18 then 125 when 19 then 124 when 20 then 123 else 143-position end points from generate_series(1,30) position) x
)
update public.points_rules rule
set position_points=maps.position_points, pole_points=maps.pole_points,
    fastest_lap_points=maps.fastest_lap_points, best_pit_points=maps.best_pit_points,
    updated_at=now()
from maps join scope on scope.event_format=maps.event_format
where rule.id=scope.id;

create or replace function public.apply_result_entry_points()
returns trigger language plpgsql security definer set search_path=public as $$
declare selected_rule public.points_rules%rowtype;
begin
  selected_rule := public.resolve_result_points_rule(new.result_id);
  if selected_rule.id is null then raise exception 'active points rule not found for result %', new.result_id; end if;
  new.points := case when new.status='classified' then coalesce((selected_rule.position_points->>new.position::text)::numeric,0) else 0 end
    + case when new.pole then selected_rule.pole_points else 0 end
    + case when new.fastest_lap then selected_rule.fastest_lap_points else 0 end
    + case when new.best_pit then selected_rule.best_pit_points else 0 end
    - coalesce(new.penalty_points,0);
  new.updated_at=now(); return new;
end $$;

drop trigger if exists result_entries_auto_points on public.result_entries;
create trigger result_entries_auto_points before insert or update of result_id,position,pole,fastest_lap,best_pit,penalty_points,status
on public.result_entries for each row execute function public.apply_result_entry_points();

-- Corrida 1: Bernardo pole, Lucas volta rápida. Corrida 2: André pole, Arthur volta rápida.
update public.result_entries entry set pole=false, fastest_lap=false
from public.results result where result.id=entry.result_id and result.external_racing_id between 2026090801 and 2026090804;
update public.result_entries entry set fastest_lap=true
from public.results result, public.drivers driver
where result.id=entry.result_id and driver.id=entry.driver_id and result.external_racing_id=2026090801 and driver.slug='lucas-rabelo';
update public.result_entries entry set pole=true
from public.results result, public.drivers driver
where result.id=entry.result_id and driver.id=entry.driver_id and result.external_racing_id=2026090801 and driver.slug='bernardo-thadeu';
update public.result_entries entry set pole=true, fastest_lap=true
from public.results result, public.drivers driver
where result.id=entry.result_id and driver.id=entry.driver_id and result.external_racing_id=2026090802 and driver.slug='andre-felisberto';
update public.result_entries entry set fastest_lap=true
from public.results result, public.drivers driver
where result.id=entry.result_id and driver.id=entry.driver_id and result.external_racing_id=2026090802 and driver.slug='arthur-henrique';

-- Libera as posições antes de substituir a classificação por posição geral.
update public.result_entries entry set position=position+10000
from public.results result join public.stages stage on stage.id=result.stage_id
where entry.result_id=result.id and result.status in ('homologated','published','rectified')
  and result.deleted_at is null and stage.deleted_at is null and entry.deleted_at is null;

with ranked as (
  select entry.id,
    row_number() over (
      partition by result.stage_id, coalesce(result.session_id,'00000000-0000-0000-0000-000000000000'::uuid)
      order by (entry.status='classified') desc, entry.laps desc, entry.total_time_ms asc nulls last, entry.id
    )::integer position
  from public.result_entries entry
  join public.results result on result.id=entry.result_id
  join public.stages stage on stage.id=result.stage_id
  where result.status in ('homologated','published','rectified')
    and result.deleted_at is null and stage.deleted_at is null and entry.deleted_at is null
)
update public.result_entries entry set position=ranked.position
from ranked where ranked.id=entry.id;

-- O trigger recalcula todos os pontos históricos já publicados com a posição geral.
update public.result_entries entry set position=entry.position
from public.results result join public.stages stage on stage.id=result.stage_id
where entry.result_id=result.id and result.status in ('homologated','published','rectified')
  and result.deleted_at is null and stage.deleted_at is null and entry.deleted_at is null;

do $$
declare v_season_id uuid; v_category_id uuid; v_admin_id uuid;
begin
  select user_id into v_admin_id from public.user_roles where role='admin' and (expires_at is null or expires_at>now()) limit 1;
  if v_admin_id is null then raise exception 'no active admin available for standings recalculation'; end if;
  perform set_config('request.jwt.claim.sub', v_admin_id::text, true);
  select season.id into v_season_id from public.seasons season
  join public.championships championship on championship.id=season.championship_id
  where championship.slug='udk' and season.year=2026;
  for v_category_id in select category.id from public.categories category where category.season_id=v_season_id and category.deleted_at is null loop
    perform public.recalculate_standings(v_season_id, v_category_id);
  end loop;
end $$;
