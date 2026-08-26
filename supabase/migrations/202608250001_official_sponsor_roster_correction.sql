-- Atualiza o roster público após a correção comercial de agosto de 2026.
-- AKAMIG é uma federação; GUI COSMOS TV não é patrocinador oficial.

with championship as (
  select id
  from public.championships
  where slug = 'udk'
    and deleted_at is null
  limit 1
)
update public.sponsors sponsor
set
  status = 'archived',
  deleted_at = coalesce(sponsor.deleted_at, now()),
  updated_at = now()
from championship
where sponsor.championship_id = championship.id
  and sponsor.slug in ('akamig', 'guicosmos-tv')
  and sponsor.deleted_at is null;

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
    ('Firepit Brasil', 'firepit-brasil', '/sponsors/firepit-brasil.webp', 'https://www.instagram.com/firepitbrasil/', 'Patrocinador oficial', 'active'),
    ('Grupo do Carro', 'grupo-do-carro', '/sponsors/grupo-do-carro.svg', null::text, 'Patrocinador oficial', 'active'),
    ('TransferMix', 'transfermix', '/sponsors/transfermix.svg', 'https://www.instagram.com/transfermixbrindes/', 'Patrocinador oficial', 'active'),
    ('Veste Custom Wear', 'veste-custom-wear', '/sponsors/veste-custom-wear.svg', 'https://www.instagram.com/vestecw/', 'Patrocinador oficial', 'active'),
    ('Vintage São Francisco', 'vintage-sao-francisco', '/sponsors/vintage-sao-francisco.webp', 'https://www.instagram.com/vinagreorganico/', 'Patrocinador oficial', 'active'),
    ('Velho Oeste Clube de Tiro', 'velho-oeste', '/sponsors/velho-oeste.svg', null::text, 'Patrocinador oficial', 'active')
)
update public.sponsors sponsor
set
  name = roster.name,
  logo_url = roster.logo_url,
  website_url = roster.website_url,
  tier = roster.tier,
  status = roster.status,
  deleted_at = null,
  updated_at = now()
from championship, roster
where sponsor.championship_id = championship.id
  and sponsor.slug = roster.slug;

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
    ('Firepit Brasil', 'firepit-brasil', '/sponsors/firepit-brasil.webp', 'https://www.instagram.com/firepitbrasil/', 'Patrocinador oficial', 'active'),
    ('Grupo do Carro', 'grupo-do-carro', '/sponsors/grupo-do-carro.svg', null::text, 'Patrocinador oficial', 'active'),
    ('TransferMix', 'transfermix', '/sponsors/transfermix.svg', 'https://www.instagram.com/transfermixbrindes/', 'Patrocinador oficial', 'active'),
    ('Veste Custom Wear', 'veste-custom-wear', '/sponsors/veste-custom-wear.svg', 'https://www.instagram.com/vestecw/', 'Patrocinador oficial', 'active'),
    ('Vintage São Francisco', 'vintage-sao-francisco', '/sponsors/vintage-sao-francisco.webp', 'https://www.instagram.com/vinagreorganico/', 'Patrocinador oficial', 'active'),
    ('Velho Oeste Clube de Tiro', 'velho-oeste', '/sponsors/velho-oeste.svg', null::text, 'Patrocinador oficial', 'active')
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
where not exists (
  select 1
  from public.sponsors existing
  where existing.championship_id = championship.id
    and existing.slug = roster.slug
    and existing.deleted_at is null
);
