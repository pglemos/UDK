-- Tomadas de tempo (sessões kind = 'qualifying') ficam no painel e nos PDFs, fora das visões
-- públicas de resultados, posições e voltas: o site e a classificação continuam só com as corridas.
create or replace view public.public_portal_results as
WITH latest_results AS (
         SELECT DISTINCT ON (result_1.stage_id, (COALESCE(result_1.session_id, '00000000-0000-0000-0000-000000000000'::uuid))) result_1.id,
            result_1.stage_id,
            result_1.category_id,
            result_1.title,
            result_1.status,
            result_1.version,
            result_1.fastest_lap_ms,
            result_1.published_at,
            result_1.created_at,
            result_1.updated_at,
            result_1.session_id,
            result_1.deleted_at,
            result_1.source_system,
            result_1.external_racing_id,
            result_1.external_imported_at
           FROM results result_1
          WHERE result_1.deleted_at IS NULL AND (result_1.status = ANY (ARRAY['provisional'::text, 'homologated'::text, 'published'::text, 'rectified'::text]))
          ORDER BY result_1.stage_id, (COALESCE(result_1.session_id, '00000000-0000-0000-0000-000000000000'::uuid)), (result_1.category_id IS NULL) DESC, result_1.version DESC, result_1.updated_at DESC, result_1.id DESC
        )
 SELECT result.id,
    result.title,
    result.status,
    result.version,
    result.fastest_lap_ms,
    result.published_at,
    result.stage_id,
    stage.slug AS stage_slug,
    stage.title AS stage_title,
    stage.track,
    stage.starts_at,
    session_row.name AS session_name,
    session_row.kind AS session_kind,
    category.name AS category,
    category.slug AS category_slug
   FROM latest_results result
     JOIN stages stage ON stage.id = result.stage_id AND stage.deleted_at IS NULL
     JOIN seasons season ON season.id = stage.season_id AND season.deleted_at IS NULL
     JOIN championships championship ON championship.id = season.championship_id AND championship.deleted_at IS NULL
     LEFT JOIN sessions session_row ON session_row.id = result.session_id AND session_row.deleted_at IS NULL
     LEFT JOIN categories category ON category.id = result.category_id AND category.deleted_at IS NULL
  WHERE COALESCE(session_row.kind, 'race'::text) <> 'qualifying'::text;

create or replace view public.public_portal_result_entries as
SELECT entry.id,
    entry.result_id,
    entry."position",
    entry.kart_number,
    entry.laps,
    entry.total_time_ms,
    entry.best_lap_ms,
    entry.penalty_ms,
    entry.points,
    entry.pole,
    entry.fastest_lap,
    entry.best_pit,
    entry.penalty_points,
    entry.timing_adjustment_laps,
    entry.sporting_note,
    entry.status,
    entry.created_at,
    result.title AS result_title,
    session_row.name AS session_name,
    driver.slug AS driver_slug,
    driver.sport_name AS driver_name,
    driver.number AS driver_number,
    category.name AS category,
    category.slug AS category_slug,
    category.color AS category_color,
    stage.title AS stage_title
   FROM result_entries entry
     JOIN results result ON result.id = entry.result_id AND result.deleted_at IS NULL AND (result.status = ANY (ARRAY['provisional'::text, 'homologated'::text, 'published'::text, 'rectified'::text]))
     LEFT JOIN sessions session_row ON session_row.id = result.session_id AND session_row.deleted_at IS NULL
     JOIN drivers driver ON driver.id = entry.driver_id AND driver.deleted_at IS NULL AND driver.public_profile
     LEFT JOIN categories category ON category.id = driver.category_id AND category.deleted_at IS NULL
     JOIN stages stage ON stage.id = result.stage_id AND stage.deleted_at IS NULL
  WHERE entry.deleted_at IS NULL AND COALESCE(session_row.kind, 'race'::text) <> 'qualifying'::text;

create or replace view public.public_portal_laps as
SELECT lap.id,
    lap.result_id,
    lap.result_entry_id,
    lap.driver_id,
    driver.slug AS driver_slug,
    driver.sport_name AS driver_name,
    result.title AS result_title,
    stage.title AS stage_title,
    lap.lap_number,
    lap.lap_time_ms,
    lap.elapsed_time_ms,
    lap.speed_kph,
    lap."position",
    lap.valid,
    lap.invalid_reason
   FROM laps lap
     JOIN result_entries entry ON entry.id = lap.result_entry_id AND entry.result_id = lap.result_id AND entry.driver_id = lap.driver_id AND entry.deleted_at IS NULL
     JOIN results result ON result.id = lap.result_id AND result.deleted_at IS NULL AND (result.status = ANY (ARRAY['provisional'::text, 'homologated'::text, 'published'::text, 'rectified'::text]))
     JOIN drivers driver ON driver.id = lap.driver_id AND driver.deleted_at IS NULL AND driver.public_profile
     JOIN stages stage ON stage.id = result.stage_id AND stage.deleted_at IS NULL
  WHERE lap.deleted_at IS NULL AND NOT (EXISTS ( SELECT 1 FROM sessions session_row WHERE session_row.id = result.session_id AND session_row.kind = 'qualifying'::text));
