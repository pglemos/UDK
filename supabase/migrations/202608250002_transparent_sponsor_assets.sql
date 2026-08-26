-- Replace opaque sponsor exports with transparent public assets.
-- The fallback roster uses the same paths so the public UI stays deterministic.

with championship as (
  select id
  from public.championships
  where slug = 'udk'
    and deleted_at is null
  limit 1
)
update public.sponsors sponsor
set
  logo_url = case sponsor.slug
    when 'firepit-brasil' then '/sponsors/firepit-brasil.svg'
    when 'vintage-sao-francisco' then '/sponsors/vintage-sao-francisco.svg'
    when 'velho-oeste' then '/sponsors/velho-oeste.png'
    else sponsor.logo_url
  end,
  updated_at = now()
from championship
where sponsor.championship_id = championship.id
  and sponsor.slug in ('firepit-brasil', 'vintage-sao-francisco', 'velho-oeste')
  and sponsor.status = 'active'
  and sponsor.deleted_at is null;
