-- Unicidade passa a ignorar registros arquivados.
--
-- Todas as tabelas usam soft delete (deleted_at) e as listas do painel filtram
-- por deleted_at is null. As restrições UNIQUE, porém, contavam também as
-- linhas arquivadas: depois de arquivar um vínculo de responsável ou de
-- usuário de patrocinador, recriá-lo devolvia "já existe" — para um registro
-- que o operador não conseguia ver nem restaurar pela interface.
--
-- Cada restrição vira um índice único parcial com WHERE deleted_at IS NULL.
-- A garantia entre registros ativos é a mesma; o que muda é que arquivar
-- libera a combinação de novo.
--
-- Ficam de fora as três restrições que servem de alvo para chaves estrangeiras
-- compostas (sessions_stage_id_id_unique, endurance_teams_stage_id_id_unique e
-- result_entries_composite_unique): o Postgres exige uma constraint real ali.

alter table public.appeals drop constraint appeals_protocol_key;

create unique index appeals_protocol_ativo_idx
  on public.appeals (protocol)
  where deleted_at is null;

alter table public.categories drop constraint categories_season_id_slug_key;

create unique index categories_season_id_slug_ativo_idx
  on public.categories (season_id, slug)
  where deleted_at is null;

alter table public.championships drop constraint championships_slug_key;

create unique index championships_slug_ativo_idx
  on public.championships (slug)
  where deleted_at is null;

alter table public.checkins drop constraint checkins_stage_id_driver_id_key;

create unique index checkins_stage_id_driver_id_ativo_idx
  on public.checkins (stage_id, driver_id)
  where deleted_at is null;

alter table public.cms_pages drop constraint cms_pages_championship_id_slug_key;

create unique index cms_pages_championship_id_slug_ativo_idx
  on public.cms_pages (championship_id, slug)
  where deleted_at is null;

alter table public.cms_versions drop constraint cms_versions_page_id_version_key;

create unique index cms_versions_page_id_version_ativo_idx
  on public.cms_versions (page_id, version)
  where deleted_at is null;

alter table public.drivers drop constraint drivers_season_id_category_id_number_key;

create unique index drivers_season_id_category_id_number_ativo_idx
  on public.drivers (season_id, category_id, number)
  where deleted_at is null;

alter table public.drivers drop constraint drivers_profile_id_key;

create unique index drivers_profile_id_ativo_idx
  on public.drivers (profile_id)
  where deleted_at is null;

alter table public.drivers drop constraint drivers_season_id_slug_key;

create unique index drivers_season_id_slug_ativo_idx
  on public.drivers (season_id, slug)
  where deleted_at is null;

alter table public.endurance_members drop constraint endurance_members_team_id_driver_id_key;

create unique index endurance_members_team_id_driver_id_ativo_idx
  on public.endurance_members (team_id, driver_id)
  where deleted_at is null;

alter table public.endurance_teams drop constraint endurance_teams_stage_id_name_key;

create unique index endurance_teams_stage_id_name_ativo_idx
  on public.endurance_teams (stage_id, name)
  where deleted_at is null;

alter table public.guardian_links drop constraint guardian_links_guardian_id_driver_id_key;

create unique index guardian_links_guardian_id_driver_id_ativo_idx
  on public.guardian_links (guardian_id, driver_id)
  where deleted_at is null;

alter table public.laps drop constraint laps_result_entry_id_lap_number_key;

create unique index laps_result_entry_id_lap_number_ativo_idx
  on public.laps (result_entry_id, lap_number)
  where deleted_at is null;

alter table public.notification_preferences drop constraint notification_preferences_user_id_notification_kind_key;

create unique index notification_preferences_user_id_notification_kind_ativo_idx
  on public.notification_preferences (user_id, notification_kind)
  where deleted_at is null;

alter table public.registrations drop constraint registrations_protocol_key;

create unique index registrations_protocol_ativo_idx
  on public.registrations (protocol)
  where deleted_at is null;

alter table public.result_entries drop constraint result_entries_result_id_position_key;

create unique index result_entries_result_id_position_ativo_idx
  on public.result_entries (result_id, "position")
  where deleted_at is null;

alter table public.result_entries drop constraint result_entries_result_id_driver_id_key;

create unique index result_entries_result_id_driver_id_ativo_idx
  on public.result_entries (result_id, driver_id)
  where deleted_at is null;

alter table public.seasons drop constraint seasons_championship_id_year_key;

create unique index seasons_championship_id_year_ativo_idx
  on public.seasons (championship_id, year)
  where deleted_at is null;

alter table public.sessions drop constraint sessions_stage_id_name_key;

create unique index sessions_stage_id_name_ativo_idx
  on public.sessions (stage_id, name)
  where deleted_at is null;

alter table public.sponsor_users drop constraint sponsor_users_sponsor_id_user_id_key;

create unique index sponsor_users_sponsor_id_user_id_ativo_idx
  on public.sponsor_users (sponsor_id, user_id)
  where deleted_at is null;

alter table public.sponsors drop constraint sponsors_championship_id_slug_key;

create unique index sponsors_championship_id_slug_ativo_idx
  on public.sponsors (championship_id, slug)
  where deleted_at is null;

alter table public.standings drop constraint standings_season_id_category_id_driver_id_version_key;

create unique index standings_season_id_category_id_driver_id_version_ativo_idx
  on public.standings (season_id, category_id, driver_id, version)
  where deleted_at is null;

alter table public.stints drop constraint stints_team_id_sequence_key;

create unique index stints_team_id_sequence_ativo_idx
  on public.stints (team_id, sequence)
  where deleted_at is null;

alter table public.terms drop constraint terms_season_id_kind_version_key;

create unique index terms_season_id_kind_version_ativo_idx
  on public.terms (season_id, kind, version)
  where deleted_at is null;
