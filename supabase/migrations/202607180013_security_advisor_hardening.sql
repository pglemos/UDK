-- Security advisor remediations for public views, trigger functions and storage listing.

alter view public.public_calendar set (security_invoker = true);
alter view public.public_standings set (security_invoker = true);
alter view public.public_results set (security_invoker = true);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end
$$;

-- Public object URLs do not require a broad storage.objects SELECT policy.
drop policy if exists public_media_read on storage.objects;

-- PostgreSQL grants function execution to PUBLIC by default. Internal helpers and
-- trigger functions must be explicit instead of being exposed as REST RPCs.
revoke execute on function public.set_updated_at() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.audit_row_change() from public, anon, authenticated;
revoke execute on function public.validate_kart_assignment_scope() from public, anon, authenticated;

revoke execute on function public.has_active_role(text[], uuid, uuid) from public, anon;
revoke execute on function public.has_any_active_role(text[]) from public, anon;
revoke execute on function public.is_admin() from public, anon;
revoke execute on function public.can_manage_season(uuid) from public, anon;
revoke execute on function public.can_judge_season(uuid) from public, anon;
revoke execute on function public.can_marshal_season(uuid) from public, anon;
revoke execute on function public.can_finance_season(uuid) from public, anon;
revoke execute on function public.can_edit_championship(uuid) from public, anon;
revoke execute on function public.can_module_action(text, text, uuid, uuid, uuid) from public, anon;
revoke execute on function public.can_participate_as_driver(uuid) from public, anon;
revoke execute on function public.can_view_profile(uuid) from public, anon;
revoke execute on function public.storage_path_scoped_to_roles(text, text[]) from public, anon;
revoke execute on function public.recalculate_result_points(uuid) from public, anon;
revoke execute on function public.recalculate_standings(uuid, uuid) from public, anon;

grant execute on function public.has_active_role(text[], uuid, uuid) to authenticated;
grant execute on function public.has_any_active_role(text[]) to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.can_manage_season(uuid) to authenticated;
grant execute on function public.can_judge_season(uuid) to authenticated;
grant execute on function public.can_marshal_season(uuid) to authenticated;
grant execute on function public.can_finance_season(uuid) to authenticated;
grant execute on function public.can_edit_championship(uuid) to authenticated;
grant execute on function public.can_module_action(text, text, uuid, uuid, uuid) to authenticated;
grant execute on function public.can_participate_as_driver(uuid) to authenticated;
grant execute on function public.can_view_profile(uuid) to authenticated;
grant execute on function public.storage_path_scoped_to_roles(text, text[]) to authenticated;
grant execute on function public.recalculate_result_points(uuid) to authenticated;
grant execute on function public.recalculate_standings(uuid, uuid) to authenticated;
