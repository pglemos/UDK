-- Index every public-schema foreign-key prefix so relational checks and joins do not
-- degrade into sequential scans as the championship data grows.

create index if not exists appeals_driver_id_idx on public.appeals(driver_id);
create index if not exists appeals_penalty_id_idx on public.appeals(penalty_id);
create index if not exists audit_events_actor_id_idx on public.audit_events(actor_id);

create index if not exists category_changes_driver_id_idx on public.category_change_requests(driver_id);
create index if not exists category_changes_effective_stage_id_idx on public.category_change_requests(effective_stage_id);
create index if not exists category_changes_from_category_id_idx on public.category_change_requests(from_category_id);
create index if not exists category_changes_reviewed_by_idx on public.category_change_requests(reviewed_by);
create index if not exists category_changes_to_category_id_idx on public.category_change_requests(to_category_id);

create index if not exists checkins_checked_in_by_idx on public.checkins(checked_in_by);
create index if not exists checkins_driver_id_idx on public.checkins(driver_id);
create index if not exists cms_versions_created_by_idx on public.cms_versions(created_by);
create index if not exists documents_reviewed_by_idx on public.documents(reviewed_by);
create index if not exists drivers_category_id_idx on public.drivers(category_id);
create index if not exists endurance_members_driver_id_idx on public.endurance_members(driver_id);
create index if not exists endurance_teams_category_id_idx on public.endurance_teams(category_id);
create index if not exists evidence_created_by_idx on public.evidence(created_by);
create index if not exists guardian_links_approved_by_idx on public.guardian_links(approved_by);

create index if not exists import_batches_created_by_idx on public.import_batches(created_by);
create index if not exists import_batches_result_id_idx on public.import_batches(result_id);
create index if not exists incidents_created_by_idx on public.incidents(created_by);
create index if not exists incidents_driver_id_idx on public.incidents(driver_id);
create index if not exists incidents_team_id_idx on public.incidents(team_id);

create index if not exists kart_assignments_assigned_by_idx on public.kart_assignments(assigned_by);
create index if not exists kart_assignments_driver_id_idx on public.kart_assignments(driver_id);
create index if not exists kart_assignments_team_id_idx on public.kart_assignments(team_id);
create index if not exists kart_assignments_stage_team_idx on public.kart_assignments(stage_id, team_id);

create index if not exists laps_driver_id_idx on public.laps(driver_id);
create index if not exists laps_entry_result_driver_idx on public.laps(result_entry_id, result_id, driver_id);
create index if not exists notifications_user_id_idx on public.notifications(user_id);

create index if not exists payments_registration_id_idx on public.payments(registration_id);
create index if not exists payments_reviewed_by_idx on public.payments(reviewed_by);
create index if not exists penalties_driver_id_idx on public.penalties(driver_id);
create index if not exists penalties_stage_id_idx on public.penalties(stage_id);
create index if not exists points_rules_category_id_idx on public.points_rules(category_id);

create index if not exists registrations_approved_category_id_idx on public.registrations(approved_category_id);
create index if not exists registrations_requested_category_id_idx on public.registrations(requested_category_id);
create index if not exists result_entries_driver_id_idx on public.result_entries(driver_id);
create index if not exists results_category_id_idx on public.results(category_id);
create index if not exists results_session_id_idx on public.results(session_id);
create index if not exists results_stage_session_idx on public.results(stage_id, session_id);

create index if not exists role_permissions_category_id_idx on public.role_permissions(category_id);
create index if not exists role_permissions_session_id_idx on public.role_permissions(session_id);
create index if not exists role_permissions_stage_id_idx on public.role_permissions(stage_id);
create index if not exists sessions_category_id_idx on public.sessions(category_id);
create index if not exists sponsor_campaigns_sponsor_id_idx on public.sponsor_campaigns(sponsor_id);

create index if not exists standings_category_id_idx on public.standings(category_id);
create index if not exists standings_driver_id_idx on public.standings(driver_id);
create index if not exists stints_driver_id_idx on public.stints(driver_id);
create index if not exists term_acceptances_driver_id_idx on public.term_acceptances(driver_id);
create index if not exists term_acceptances_user_id_idx on public.term_acceptances(user_id);
create index if not exists user_roles_championship_id_idx on public.user_roles(championship_id);
create index if not exists user_roles_season_id_idx on public.user_roles(season_id);
