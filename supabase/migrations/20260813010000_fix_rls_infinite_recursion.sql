-- Corrige recursão infinita de RLS (Postgres 42P17) em drivers e sponsors.
--
-- Havia dois ciclos: a policy de `drivers` consultava `guardian_links`, cuja
-- policy consultava `drivers` de volta; e a de `sponsors` consultava
-- `sponsor_users`, cuja policy consultava `sponsors`. Qualquer SELECT em
-- drivers, sponsors ou em qualquer tabela que os referencie devolvia 500,
-- deixando praticamente todo o painel autenticado inutilizável.
--
-- A quebra do ciclo é feita movendo cada travessia entre tabelas para uma
-- função SECURITY DEFINER, que roda sem RLS e portanto não reentra na policy
-- da outra tabela.

-- drivers -> guardian_links
create or replace function public.is_guardian_of_driver(p_driver_id uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select exists (
    select 1
    from public.guardian_links gl
    where gl.driver_id = p_driver_id
      and gl.guardian_id = auth.uid()
      and gl.status = 'approved'
  )
$$;

-- guardian_links -> drivers
create or replace function public.owns_driver_profile(p_driver_id uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select exists (
    select 1
    from public.drivers d
    where d.id = p_driver_id
      and d.profile_id = auth.uid()
  )
$$;

create or replace function public.can_manage_driver(p_driver_id uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select public.can_manage_season((select d.season_id from public.drivers d where d.id = p_driver_id))
$$;

-- sponsors -> sponsor_users
create or replace function public.is_sponsor_member(p_sponsor_id uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select exists (
    select 1
    from public.sponsor_users su
    where su.sponsor_id = p_sponsor_id
      and su.user_id = auth.uid()
      and su.status = 'active'
  )
$$;

-- sponsor_users -> sponsors
create or replace function public.can_edit_sponsor(p_sponsor_id uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select public.can_edit_championship((select s.championship_id from public.sponsors s where s.id = p_sponsor_id))
$$;

revoke all on function public.is_guardian_of_driver(uuid) from public, anon;
revoke all on function public.owns_driver_profile(uuid) from public, anon;
revoke all on function public.can_manage_driver(uuid) from public, anon;
revoke all on function public.is_sponsor_member(uuid) from public, anon;
revoke all on function public.can_edit_sponsor(uuid) from public, anon;

grant execute on function public.is_guardian_of_driver(uuid) to authenticated;
grant execute on function public.owns_driver_profile(uuid) to authenticated;
grant execute on function public.can_manage_driver(uuid) to authenticated;
grant execute on function public.is_sponsor_member(uuid) to authenticated;
grant execute on function public.can_edit_sponsor(uuid) to authenticated;

-- Policies reescritas sobre as funções acima. O alcance de cada uma é o mesmo
-- de antes; muda apenas por onde a checagem passa.

drop policy if exists guardian_driver_read on public.drivers;
create policy guardian_driver_read on public.drivers
  for select to authenticated
  using (public.is_guardian_of_driver(id));

drop policy if exists guardian_links_participant_read on public.guardian_links;
create policy guardian_links_participant_read on public.guardian_links
  for select to authenticated
  using (
    guardian_id = auth.uid()
    or public.owns_driver_profile(driver_id)
    or public.can_manage_driver(driver_id)
  );

drop policy if exists guardian_links_staff_manage on public.guardian_links;
create policy guardian_links_staff_manage on public.guardian_links
  for all to authenticated
  using (public.can_manage_driver(driver_id))
  with check (public.can_manage_driver(driver_id));

drop policy if exists sponsor_own_company_read on public.sponsors;
create policy sponsor_own_company_read on public.sponsors
  for select to authenticated
  using (public.is_sponsor_member(id));

drop policy if exists sponsor_users_staff_manage on public.sponsor_users;
create policy sponsor_users_staff_manage on public.sponsor_users
  for all to authenticated
  using (public.can_edit_sponsor(sponsor_id))
  with check (public.can_edit_sponsor(sponsor_id));
