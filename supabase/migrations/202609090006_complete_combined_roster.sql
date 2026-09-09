-- Completa o cadastro dos pilotos presentes nos relatorios da 2a etapa.
-- A migration 004 ja publicada cria o resultado geral; esta correcao torna o
-- rebuild deterministico tambem em bancos limpos, sem reescrever migracoes
-- anteriores que ja podem existir no historico remoto.

set statement_timeout = '30s';

with season_scope as (
  select season.id as season_id, category.id as category_id
  from public.seasons season
  join public.championships championship on championship.id = season.championship_id
  join public.categories category on category.season_id = season.id
  where championship.slug = 'udk'
    and season.year = 2026
    and category.slug = 'rapidos'
), roster(slug, full_name, sport_name) as (
  values
    ('maxmiiler-frantiscoly', 'Maxmiiler Frantiscoly', 'Maxmiiler Frantiscoly'),
    ('newton', 'Newton', 'Newton'),
    ('rafael-teodoro', 'Rafael Teodoro', 'Rafael Teodoro'),
    ('lucas-gabriel-voieta-parreira', 'Lucas Gabriel Voieta Parreira', 'Lucas Gabriel Voieta Parreira')
)
insert into public.drivers (
  season_id, category_id, slug, full_name, sport_name, number, status, public_profile
)
select
  season_scope.season_id,
  season_scope.category_id,
  roster.slug,
  roster.full_name,
  roster.sport_name,
  null,
  'approved',
  true
from season_scope
cross join roster
where not exists (
  select 1
  from public.drivers driver
  where driver.season_id = season_scope.season_id
    and driver.slug = roster.slug
    and driver.deleted_at is null
);

-- Materializa os oito entries que dependiam desses quatro pilotos: quatro em
-- cada corrida. Os dados reproduzem a ordem geral homologada e o NC da C2.
with target as (
  select result.id as result_id, result.external_racing_id, stage.season_id
  from public.results result
  join public.stages stage on stage.id = result.stage_id
  where result.category_id is null
    and result.external_racing_id in (2026090801, 2026090802)
    and result.deleted_at is null
    and stage.deleted_at is null
), payload(
  external_id, driver_slug, position, kart_number, laps, total_time_ms, best_lap_ms, status
) as (
  values
    (2026090801::bigint, 'newton', 26, 148, 18, 985796, 52825, 'classified'),
    (2026090801, 'maxmiiler-frantiscoly', 27, 122, 18, 986267, 52101, 'classified'),
    (2026090801, 'rafael-teodoro', 31, 138, 18, 998513, 53574, 'classified'),
    (2026090801, 'lucas-gabriel-voieta-parreira', 33, 110, 17, 951823, 53169, 'classified'),
    (2026090802, 'maxmiiler-frantiscoly', 21, 105, 19, 1030598, 52195, 'classified'),
    (2026090802, 'newton', 29, 108, 19, 1040188, 52888, 'classified'),
    (2026090802, 'rafael-teodoro', 31, 133, 18, 997946, 53521, 'classified'),
    (2026090802, 'lucas-gabriel-voieta-parreira', 33, 117, 1, 67009, 59498, 'nc')
)
insert into public.result_entries (
  result_id, driver_id, position, kart_number, laps, total_time_ms, best_lap_ms,
  penalty_ms, pole, fastest_lap, status, best_pit, penalty_points,
  timing_adjustment_laps, sporting_note
)
select
  target.result_id,
  driver.id,
  payload.position,
  payload.kart_number,
  payload.laps,
  payload.total_time_ms,
  payload.best_lap_ms,
  0,
  false,
  false,
  payload.status,
  false,
  0,
  0,
  null
from target
join payload on payload.external_id = target.external_racing_id
join public.categories category
  on category.season_id = target.season_id
 and category.slug = 'rapidos'
join public.drivers driver
  on driver.season_id = target.season_id
 and driver.category_id = category.id
 and driver.slug = payload.driver_slug
 and driver.deleted_at is null
where not exists (
  select 1
  from public.result_entries existing
  where existing.result_id = target.result_id
    and existing.driver_id = driver.id
    and existing.deleted_at is null
);

-- Reprocessa os snapshots por categoria depois de completar o roster.
create or replace function public.can_judge_season(p_season_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select (
    -- SECURITY DEFINER runs with the function owner. Supabase's migration
    -- connection can expose a pooler/admin session user instead of the
    -- function owner as session_user, so use current_user for this scoped,
    -- transaction-local migration context.
    current_user = 'postgres'
    and current_setting('udk.migration_context', true) = 'standings_rebuild'
  ) or public.has_active_role(array['admin','organization','judge'], null, p_season_id)
$$;

do $$
declare
  v_season_id uuid;
  v_category_id uuid;
begin
  perform set_config('udk.migration_context', 'standings_rebuild', true);

  select season.id
  into v_season_id
  from public.seasons season
  join public.championships championship on championship.id = season.championship_id
  where championship.slug = 'udk'
    and season.year = 2026;

  for v_category_id in
    select category.id
    from public.categories category
    where category.season_id = v_season_id
      and category.deleted_at is null
  loop
    perform public.recalculate_standings(v_season_id, v_category_id);
  end loop;
end
$$;
