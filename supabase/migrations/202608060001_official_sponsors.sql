with championship as (
  select id
  from public.championships
  where slug = 'udk'
    and deleted_at is null
  limit 1
)
delete from public.sponsors sponsor
using championship
where sponsor.championship_id = championship.id
  and sponsor.slug = 'pvf-transportes';

with championship as (
  select id
  from public.championships
  where slug = 'udk'
    and deleted_at is null
  limit 1
),
roster(name, slug, logo_url, website_url, tier, status) as (
  values
    ('Grupo Emtel', 'grupo-emtel', '/sponsors/grupo-emtel.svg', 'https://www.instagram.com/grupoemtel/', 'Patrocinador oficial', 'active'),
    ('Firepit Brasil', 'firepit-brasil', '/sponsors/firepit-brasil.svg', 'https://www.instagram.com/firepitbrasil/', 'Patrocinador oficial', 'active'),
    ('Guicosmos TV', 'guicosmos-tv', '/sponsors/guicosmos-tv.svg', 'https://www.instagram.com/guicosmos_tv/', 'Patrocinador oficial', 'active'),
    ('AKAMIG', 'akamig', '/sponsors/akamig.svg', 'https://www.instagram.com/akamigkart/', 'Patrocinador oficial', 'active'),
    ('TransferMix', 'transfermix', '/sponsors/transfermix.svg', 'https://www.instagram.com/transfermixbrindes/', 'Patrocinador oficial', 'active'),
    ('Veste Custom Wear', 'veste-custom-wear', '/sponsors/veste-custom-wear.svg', 'https://www.instagram.com/vestecw/', 'Patrocinador oficial', 'active'),
    ('Vintage São Francisco', 'vintage-sao-francisco', '/sponsors/vintage-sao-francisco.svg', 'https://www.instagram.com/vinagreorganico/', 'Patrocinador oficial', 'active')
)
insert into public.sponsors (
  championship_id,
  name,
  slug,
  logo_url,
  website_url,
  tier,
  status,
  deleted_at
)
select
  championship.id,
  roster.name,
  roster.slug,
  roster.logo_url,
  roster.website_url,
  roster.tier,
  roster.status,
  null
from championship
cross join roster
on conflict (championship_id, slug) do update
set
  name = excluded.name,
  logo_url = excluded.logo_url,
  website_url = excluded.website_url,
  tier = excluded.tier,
  status = excluded.status,
  deleted_at = null,
  updated_at = now();

with championship as (
  select id
  from public.championships
  where slug = 'udk'
    and deleted_at is null
  limit 1
)
delete from public.sponsors sponsor
using championship
where sponsor.championship_id = championship.id
  and sponsor.slug not in (
    'grupo-emtel',
    'firepit-brasil',
    'guicosmos-tv',
    'akamig',
    'transfermix',
    'veste-custom-wear',
    'vintage-sao-francisco'
  );
