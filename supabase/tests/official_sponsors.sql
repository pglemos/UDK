create extension if not exists pgtap;

begin;
select plan(8);

with championship as (
  select id
  from public.championships
  where slug = 'udk'
    and deleted_at is null
  limit 1
)
insert into public.sponsors (
  championship_id,
  name,
  slug,
  logo_url,
  website_url,
  tier,
  status
)
select championship.id, sponsor.*
from championship
cross join (
  values
    ('Patrocinador histórico', 'legacy-inactive', '/legacy.svg', 'https://example.invalid/history', 'Histórico', 'inactive'),
    ('Patrocinador antigo ativo', 'legacy-active', '/legacy-active.svg', 'https://example.invalid/active', 'Antigo', 'active'),
    ('PVF Transportes', 'pvf-transportes', '/pvf.svg', 'https://example.invalid/pvf', 'Antigo', 'active')
) as sponsor(name, slug, logo_url, website_url, tier, status)
on conflict (championship_id, slug) do update
set
  name = excluded.name,
  logo_url = excluded.logo_url,
  website_url = excluded.website_url,
  tier = excluded.tier,
  status = excluded.status,
  deleted_at = null;

update public.sponsors
set
  status = 'inactive',
  deleted_at = now()
where slug = 'grupo-emtel';

\ir ../migrations/202608060001_official_sponsors.sql
\ir ../migrations/202608060001_official_sponsors.sql

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
  'the official roster has exactly seven active sponsors after two executions'
);

select set_eq(
  array(
    select sponsor.slug
    from public.sponsors sponsor
    join public.championships championship on championship.id = sponsor.championship_id
    where championship.slug = 'udk'
      and sponsor.status = 'active'
      and sponsor.deleted_at is null
    order by sponsor.slug
  ),
  array[
    'akamig',
    'firepit-brasil',
    'grupo-emtel',
    'guicosmos-tv',
    'transfermix',
    'veste-custom-wear',
    'vintage-sao-francisco'
  ]::text[],
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
    where sponsor.slug = 'legacy-inactive'
      and sponsor.status = 'inactive'
  ),
  1::bigint,
  'inactive historical sponsor records are preserved'
);

select is(
  (
    select count(*)
    from public.sponsors sponsor
    where sponsor.slug = 'legacy-active'
      and sponsor.status = 'active'
      and sponsor.deleted_at is null
  ),
  0::bigint,
  'active sponsors outside the roster are removed'
);

select is(
  (
    select count(*)
    from public.sponsors sponsor
    where sponsor.slug = 'grupo-emtel'
      and sponsor.status = 'active'
      and sponsor.deleted_at is null
  ),
  1::bigint,
  'an approved soft-deleted sponsor is restored'
);

select * from finish();
rollback;
