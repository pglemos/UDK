-- "Theodoro" (Endurance 18/08) e "Rafael Teodoro" (etapas regulares) são o mesmo piloto (cliente 114780,
-- único Teodoro inscrito na Endurance no sistema do kartódromo). Todo histórico passa para rafael-teodoro;
-- o cadastro duplicado é arquivado (soft delete) e a classificação da categoria é recalculada.
do $merge$
declare
  target_season uuid;
  keep_id uuid;
  drop_id uuid;
  fk record;
  moved integer;
begin
  select season.id into target_season
  from public.seasons season join public.championships championship on championship.id = season.championship_id
  where championship.slug = 'udk' and season.year = 2026 and season.deleted_at is null;

  select id into keep_id from public.drivers where season_id = target_season and slug = 'rafael-teodoro' and deleted_at is null;
  select id into drop_id from public.drivers where season_id = target_season and slug = 'theodoro' and deleted_at is null;
  if keep_id is null or drop_id is null then return; end if; -- replay de CI sem o roster de produção

  -- classificação é derivada: some e é reconstruída no fim
  delete from public.standings where driver_id = drop_id;

  -- laps aponta para (result_entry_id, result_id, driver_id) sem ON UPDATE: solta a FK, troca o piloto
  -- no resultado e nas voltas (pontos não mudam: o gatilho de pontos não olha driver_id) e recria a FK validando
  alter table public.laps drop constraint laps_result_entry_consistency_fkey;
  update public.result_entries set driver_id = keep_id where driver_id = drop_id;
  update public.laps set driver_id = keep_id where driver_id = drop_id;
  alter table public.laps add constraint laps_result_entry_consistency_fkey
    foreign key (result_entry_id, result_id, driver_id) references public.result_entries(id, result_id, driver_id) on delete cascade;

  for fk in
    select k.conrelid::regclass::text as tbl, a.attname as col
    from pg_constraint k join pg_attribute a on a.attrelid = k.conrelid and a.attnum = any(k.conkey)
    where k.contype = 'f' and k.confrelid = 'public.drivers'::regclass
      and k.conrelid not in ('public.standings'::regclass, 'public.result_entries'::regclass, 'public.laps'::regclass)
  loop
    execute format('update %s set %I = $1 where %I = $2', fk.tbl, fk.col, fk.col) using keep_id, drop_id;
    get diagnostics moved = row_count;
    if moved > 0 then raise notice 'merge theodoro: % linhas em %', moved, fk.tbl; end if;
  end loop;

  update public.drivers keep set
    avatar_url = coalesce(keep.avatar_url, old.avatar_url),
    hero_image_url = coalesce(keep.hero_image_url, old.hero_image_url),
    updated_at = now()
  from public.drivers old
  where keep.id = keep_id and old.id = drop_id;

  update public.drivers set status = 'archived', public_profile = false, deleted_at = now(), updated_at = now()
  where id = drop_id;

  perform set_config('udk.migration_context', 'standings_rebuild', true);
  perform public.recalculate_standings(target_season, (select category_id from public.drivers where id = keep_id));
end
$merge$;
