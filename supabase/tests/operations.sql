create extension if not exists pgtap;

begin;
select plan(49);

select ok(to_regclass('public.documents') is not null, 'documents table exists');
select ok(to_regclass('public.credits') is not null, 'credits table exists');
select ok(to_regclass('public.points_rules') is not null, 'points rules table exists');
select ok(to_regclass('public.import_batches') is not null, 'import batches table exists');
select ok(to_regclass('public.laps') is not null, 'laps table exists');
select ok(to_regclass('public.incidents') is not null, 'incidents table exists');
select ok(to_regclass('public.evidence') is not null, 'evidence table exists');
select ok(to_regclass('public.notification_preferences') is not null, 'notification preferences table exists');
select ok(to_regclass('public.guardian_links') is not null, 'guardian links table exists');
select ok(to_regclass('public.terms') is not null, 'terms table exists');
select ok(to_regclass('public.term_acceptances') is not null, 'term acceptances table exists');
select ok(to_regclass('public.category_change_requests') is not null, 'category change requests table exists');
select ok(to_regclass('public.sessions') is not null, 'sessions table exists');
select ok(to_regclass('public.checkins') is not null, 'checkins table exists');
select ok(to_regclass('public.kart_assignments') is not null, 'kart assignments table exists');
select ok(to_regclass('public.sponsor_campaigns') is not null, 'sponsor campaigns table exists');
select ok(to_regclass('public.cms_versions') is not null, 'cms versions table exists');

select ok(exists(select 1 from information_schema.columns where table_schema='public' and table_name='result_entries' and column_name='points'), 'result entries points column exists');
select ok(exists(select 1 from information_schema.columns where table_schema='public' and table_name='result_entries' and column_name='pole'), 'result entries pole column exists');
select ok(exists(select 1 from information_schema.columns where table_schema='public' and table_name='result_entries' and column_name='fastest_lap'), 'result entries fastest lap column exists');
select ok(exists(select 1 from information_schema.columns where table_schema='public' and table_name='results' and column_name='session_id'), 'results session column exists');
select ok(exists(select 1 from information_schema.columns where table_schema='public' and table_name='stages' and column_name='registration_opens_at'), 'stage registration opening column exists');
select ok(exists(select 1 from information_schema.columns where table_schema='public' and table_name='stages' and column_name='registration_closes_at'), 'stage registration closing column exists');
select ok(exists(select 1 from information_schema.columns where table_schema='public' and table_name='public_calendar' and column_name='date_label'), 'public calendar exposes date label');
select ok(exists(select 1 from information_schema.columns where table_schema='public' and table_name='public_calendar' and column_name='time_label'), 'public calendar exposes time label');

select ok(to_regprocedure('public.recalculate_result_points(uuid)') is not null, 'result points function exists');
select ok(to_regprocedure('public.recalculate_standings(uuid,uuid)') is not null, 'standings function exists');
select ok(to_regprocedure('public.audit_row_change()') is not null, 'audit trigger function exists');
select ok(to_regprocedure('public.has_active_role(text[],uuid,uuid)') is not null, 'scoped role function exists');
select ok(to_regprocedure('public.can_manage_season(uuid)') is not null, 'season management function exists');
select ok(to_regprocedure('public.can_judge_season(uuid)') is not null, 'judging scope function exists');
select ok(to_regprocedure('public.can_marshal_season(uuid)') is not null, 'marshal scope function exists');
select ok(to_regprocedure('public.can_finance_season(uuid)') is not null, 'finance scope function exists');
select ok(to_regprocedure('public.can_edit_championship(uuid)') is not null, 'content scope function exists');

select ok(to_regclass('public.public_results') is not null, 'public results view exists');
select ok(to_regclass('public.public_standings') is not null, 'public standings view exists');
select ok(to_regclass('public.public_calendar') is not null, 'public calendar view exists');

select ok((select relrowsecurity from pg_class where oid='public.guardian_links'::regclass), 'guardian links uses RLS');
select ok((select relrowsecurity from pg_class where oid='public.terms'::regclass), 'terms uses RLS');
select ok((select relrowsecurity from pg_class where oid='public.term_acceptances'::regclass), 'term acceptances uses RLS');
select ok((select relrowsecurity from pg_class where oid='public.sessions'::regclass), 'sessions uses RLS');
select ok((select relrowsecurity from pg_class where oid='public.checkins'::regclass), 'checkins uses RLS');
select ok((select relrowsecurity from pg_class where oid='public.kart_assignments'::regclass), 'kart assignments use RLS');
select ok((select relrowsecurity from pg_class where oid='public.sponsor_campaigns'::regclass), 'sponsor campaigns use RLS');
select ok((select relrowsecurity from pg_class where oid='public.cms_versions'::regclass), 'cms versions use RLS');

select ok((select count(*) >= 3 from public.points_rules), 'default points rules are seeded');
select ok((select count(*) = 6 from storage.buckets where id in ('public-media','private-documents','payment-proofs','disciplinary-evidence','timing-imports','signatures')), 'all storage buckets exist');
select ok((select count(*) = 9 from pg_trigger where tgname in ('audit_guardian_links','audit_terms','audit_term_acceptances','audit_category_changes','audit_sessions','audit_checkins','audit_kart_assignments','audit_sponsor_campaigns','audit_cms_versions') and not tgisinternal), 'new operational audit triggers exist');
select ok((select count(*) >= 30 from pg_policies where schemaname='public'), 'public schema has operational RLS policies');

select * from finish();
rollback;
