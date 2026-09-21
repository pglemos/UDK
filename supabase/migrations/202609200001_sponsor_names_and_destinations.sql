-- Corrige o nome público e os destinos oficiais dos patrocinadores.
-- O slug legado de Vinagre São Francisco é preservado como identificador estável.

with championship as (
  select id
  from public.championships
  where slug = 'udk'
    and deleted_at is null
  limit 1
),
corrections(slug, name, website_url) as (
  values
    ('transfermix', 'TransferMix', 'https://www.instagram.com/transfermixbh/'),
    ('vintage-sao-francisco', 'Vinagre São Francisco', 'https://www.instagram.com/vinagreorganico/'),
    ('velho-oeste', 'Velho Oeste Clube de Tiro', 'https://www.instagram.com/velhooesteclubedetiro/')
)
update public.sponsors sponsor
set
  name = corrections.name,
  website_url = corrections.website_url,
  updated_at = now()
from championship, corrections
where sponsor.championship_id = championship.id
  and sponsor.slug = corrections.slug
  and sponsor.deleted_at is null;
