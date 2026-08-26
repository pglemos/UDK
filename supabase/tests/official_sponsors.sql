create extension if not exists pgtap;

begin;
select plan(8);

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
  'firepit-brasil,grupo-do-carro,grupo-emtel,transfermix,velho-oeste,veste-custom-wear,vintage-sao-francisco',
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
      and (
        sponsor.website_url is null
        or sponsor.website_url ~ '^https://www[.]instagram[.]com/[A-Za-z0-9_.]+/$'
      )
  ),
  7::bigint,
  'all official sponsors use an approved Instagram profile or no external destination'
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
      and sponsor.logo_url ~ '^/sponsors/[a-z0-9-]+[.](svg|webp)$'
  ),
  7::bigint,
  'all official sponsors use local logo assets'
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

select is(
  (
    select count(*)
    from public.sponsors sponsor
    join public.championships championship on championship.id = sponsor.championship_id
    where championship.slug = 'udk'
      and sponsor.slug in ('akamig', 'guicosmos-tv')
      and sponsor.status = 'active'
      and sponsor.deleted_at is null
  ),
  0::bigint,
  'AKAMIG and GUI COSMOS TV are not active sponsors'
);

select * from finish();
rollback;
