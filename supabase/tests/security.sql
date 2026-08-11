create extension if not exists pgtap;

begin;
select plan(35);

select ok(to_regprocedure('public.can_participate_as_driver(uuid)') is not null, 'participant scope helper exists');
select ok(to_regprocedure('public.can_view_profile(uuid)') is not null, 'profile scope helper exists');
select ok(to_regprocedure('public.can_module_action(text,text,uuid,uuid,uuid)') is not null, 'granular permission helper exists');
select ok(to_regprocedure('public.storage_path_scoped_to_roles(text,text[])') is not null, 'storage scope helper exists');

select ok(
  exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'user_roles'
      and policyname = 'organization_roles_manage'
      and coalesce(qual, '') like '%role%admin%'
      and coalesce(with_check, '') like '%role%admin%'
  ),
  'organization role policy protects the global admin role'
);

select ok(
  exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'private_documents_staff'
      and coalesce(qual, '') like '%storage_path_scoped_to_roles%'
  ),
  'private documents staff policy is resource scoped'
);
select ok(
  exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'payment_proofs_staff'
      and coalesce(qual, '') like '%storage_path_scoped_to_roles%'
  ),
  'payment proofs staff policy is resource scoped'
);
select ok(
  exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'disciplinary_evidence_staff'
      and coalesce(qual, '') like '%storage_path_scoped_to_roles%'
  ),
  'disciplinary evidence policy is resource scoped'
);
select ok(
  exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'timing_imports_staff'
      and coalesce(qual, '') like '%storage_path_scoped_to_roles%'
  ),
  'timing imports policy is resource scoped'
);

select ok(
  exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'terms'
      and policyname = 'public_regulations_read'
      and roles::text like '%anon%'
      and coalesce(qual, '') like '%regulation%'
      and coalesce(qual, '') like '%published%'
      and coalesce(qual, '') like '%deleted_at%'
  ),
  'anonymous visitors can read only published active regulations'
);

select ok(
  (select confdeltype = 'r'
   from pg_constraint
   where conname = 'results_stage_session_consistency_fkey'),
  'result session deletion is restricted'
);
select ok(
  (select confdeltype = 'r'
   from pg_constraint
   where conname = 'kart_assignments_stage_session_consistency_fkey'),
  'kart session deletion is restricted'
);
select ok(
  exists (
    select 1 from pg_constraint
    where conname = 'kart_assignments_exactly_one_assignee'
      and pg_get_constraintdef(oid) like '%num_nonnulls%'
  ),
  'kart assignment requires exactly one assignee'
);
select ok(
  exists (select 1 from pg_constraint where conname = 'laps_result_entry_consistency_fkey'),
  'lap/result/driver consistency foreign key exists'
);
select ok(
  exists (select 1 from pg_trigger where tgname = 'kart_assignments_scope_check' and not tgisinternal),
  'kart assignment season scope trigger exists'
);

select ok((select relrowsecurity from pg_class where oid = 'public.sponsor_users'::regclass), 'sponsor users use RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.role_permissions'::regclass), 'role permissions use RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.term_acceptances'::regclass), 'term acceptances use RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.documents'::regclass), 'documents use RLS');

select ok(
  exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'drivers' and column_name = 'deleted_at'
  ),
  'drivers support logical deletion'
);
select ok(
  exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'results' and column_name = 'deleted_at'
  ),
  'results support logical deletion'
);
select ok(
  exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'evidence' and column_name = 'deleted_at'
  ),
  'disciplinary evidence supports logical deletion'
);

select is(
  (select count(*)::integer from public.seasons),
  (select count(distinct season_id)::integer from public.points_rules),
  'every existing season has a baseline points configuration'
);
select ok(
  not exists (
    select 1
    from public.seasons season
    where not exists (
      select 1 from public.points_rules rule
      where rule.season_id = season.id and rule.event_format = 'regular' and rule.active
    )
  ),
  'every season has an active regular points rule'
);
select ok(
  exists (
    select 1 from pg_proc
    where proname = 'recalculate_standings'
      and prosrc like '%for update%'
  ),
  'standing recalculation serializes version allocation'
);

select ok(
  coalesce((select reloptions from pg_class where oid = 'public.public_calendar'::regclass), '{}'::text[]) @> array['security_invoker=true'],
  'public calendar uses invoker security'
);
select ok(
  coalesce((select reloptions from pg_class where oid = 'public.public_standings'::regclass), '{}'::text[]) @> array['security_invoker=true'],
  'public standings use invoker security'
);
select ok(
  coalesce((select reloptions from pg_class where oid = 'public.public_results'::regclass), '{}'::text[]) @> array['security_invoker=true'],
  'public results use invoker security'
);
select ok(
  coalesce((select proconfig from pg_proc where oid = 'public.set_updated_at()'::regprocedure), '{}'::text[]) @> array['search_path=public'],
  'updated-at trigger fixes its search path'
);
select ok(
  not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'public_media_read'
  ),
  'public media bucket does not expose object listing'
);
select ok(
  not has_function_privilege('anon', 'public.audit_row_change()', 'EXECUTE'),
  'anonymous users cannot execute the audit trigger function'
);
select ok(
  not has_function_privilege('authenticated', 'public.audit_row_change()', 'EXECUTE'),
  'signed-in users cannot invoke the audit trigger function directly'
);
select ok(
  not has_function_privilege('anon', 'public.recalculate_standings(uuid,uuid)', 'EXECUTE'),
  'anonymous users cannot recalculate standings'
);
select ok(
  has_function_privilege('authenticated', 'public.recalculate_standings(uuid,uuid)', 'EXECUTE'),
  'signed-in users may call the guarded standings recalculation function'
);
select is(
  (select count(*)::bigint
   from pg_policies
   where schemaname in ('public', 'storage')
     and roles @> array['public']::name[]
     and (coalesce(qual, '') || ' ' || coalesce(with_check, ''))
       ~* '(^|[^[:alnum:]_])((public[.])?is_admin)[[:space:]]*[(]'),
  0::bigint,
  'policies calling is_admin are restricted to authenticated users'
);

select * from finish();
rollback;
