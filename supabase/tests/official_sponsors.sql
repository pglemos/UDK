create extension if not exists pgtap;

begin;
select plan(7);

select is(
  (
    select count(*)
    from public.sponsors sponsor
    join public.championships championship on championship.id = sponsor.championship_id
    where championship.slug = 'udk'
      and sponsor.status = 'active'
      and sponsor.deleted_at is null
  ),
  7::bigint,
  'the official roster has exactly seven active sponsors'
);

select is(
  (
    select string_agg(sponsor.slug, ',' order by sponsor.slug)
    from public.sponsors sponsor
    join public.championships championship on championship.id = sponsor.championship_id
    where championship.slug = 'udk'
      and sponsor.status = 'active'
      and sponsor.deleted_at is null
  ),
  'akamig,firepit-brasil,grupo-emtel,guicosmos-tv,transfermix,veste-custom-wear,vintage-sao-francisco',
  'the final active roster matches the approved sponsor slugs'
);

select is(
  (
    select count(*)
    from public.sponsors sponsor
    join public.championships championship on championship.id = sponsor.championship_id
    where championship.slug = 'udk'
      and sponsor.status = 'active'
      and sponsor.deleted_at is null
      and sponsor.tier = 'Patrocinador oficial'
  ),
  7::bigint,
  'all official sponsors use the approved commercial tier'
);

select is(
  (
    select count(*)
    from public.sponsors sponsor
    join public.championships championship on championship.id = sponsor.championship_id
    where championship.slug = 'udk'
      and sponsor.status = 'active'
      and sponsor.deleted_at is null
      and sponsor.website_url ~ '^https://www[.]instagram[.]com/[A-Za-z0-9_.]+/$'
  ),
  7::bigint,
  'all official sponsors point to Instagram profiles'
);

select is(
  (
    select count(*)
    from public.sponsors sponsor
    where sponsor.slug = 'pvf-transportes'
      and sponsor.status = 'active'
      and sponsor.deleted_at is null
  ),
  0::bigint,
  'PVF Transportes is not active'
);

select is(
  (
    select count(*)
    from public.sponsors sponsor
    join public.championships championship on championship.id = sponsor.championship_id
    where championship.slug = 'udk'
      and sponsor.status = 'active'
      and sponsor.deleted_at is null
      and sponsor.logo_url ~ '^/sponsors/[a-z0-9-]+[.]svg$'
  ),
  7::bigint,
  'all official sponsors use local SVG logos'
);

select is(
  (
    select count(distinct sponsor.slug)
    from public.sponsors sponsor
    join public.championships championship on championship.id = sponsor.championship_id
    where championship.slug = 'udk'
      and sponsor.status = 'active'
      and sponsor.deleted_at is null
  ),
  7::bigint,
  'the active sponsor roster contains no duplicate slugs'
);

select * from finish();
rollback;
