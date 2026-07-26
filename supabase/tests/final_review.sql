create extension if not exists pgtap;

begin;
select plan(6);

select ok(
  pg_get_functiondef('public.has_active_role(text[],uuid,uuid)'::regprocedure) ilike '%ur.deleted_at is null%',
  'scoped authorization ignores archived role grants'
);

select ok(
  pg_get_functiondef('public.has_any_active_role(text[])'::regprocedure) ilike '%ur.deleted_at is null%',
  'global role checks ignore archived role grants'
);

select ok(
  pg_get_functiondef('public.can_module_action(text,text,uuid,uuid,uuid)'::regprocedure) ilike '%role_row.deleted_at is null%',
  'granular module authorization ignores archived role grants'
);

select ok(
  pg_get_viewdef('public.public_results'::regclass, true) ilike '%season.deleted_at is null%'
  and pg_get_viewdef('public.public_results'::regclass, true) ilike '%championship.deleted_at is null%'
  and pg_get_viewdef('public.public_results'::regclass, true) ilike '%category.deleted_at is null%',
  'public results exclude archived championship hierarchy rows'
);

select ok(
  coalesce((select reloptions from pg_class where oid = 'public.public_results'::regclass), '{}'::text[])
    @> array['security_invoker=true'],
  'public results preserve invoker security'
);

select ok(
  not exists (
    select 1
    from public.points_rules rule
    where rule.deleted_at is null
    group by
      rule.season_id,
      coalesce(rule.category_id, '00000000-0000-0000-0000-000000000000'::uuid),
      rule.event_format,
      rule.version
    having count(*) > 1
  ),
  'points rule seeding does not create duplicate scope versions'
);

select * from finish();
rollback;
