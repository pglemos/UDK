-- `public.is_admin()` is intentionally unavailable to anonymous callers.
-- Policies that invoke it must therefore never be evaluated for the anon role;
-- otherwise every invoker-security public view can fail before its public
-- read policy is applied.
do $$
declare
  policy_record record;
begin
  for policy_record in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname in ('public', 'storage')
      and roles @> array['public']::name[]
      and (
        coalesce(qual, '') || ' ' || coalesce(with_check, '')
      ) ~* '(^|[^[:alnum:]_])((public[.])?is_admin)[[:space:]]*[(]'
  loop
    execute format(
      'alter policy %I on %I.%I to authenticated',
      policy_record.policyname,
      policy_record.schemaname,
      policy_record.tablename
    );
  end loop;
end
$$;
