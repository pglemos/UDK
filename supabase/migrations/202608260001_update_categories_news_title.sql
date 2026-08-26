-- Keep the published article title aligned with the public editorial copy.
with championship as (
  select id
  from public.championships
  where slug = 'udk'
    and deleted_at is null
  limit 1
)
update public.cms_pages page
set
  title = 'Ultra Rápidos e Ultra Insanos',
  updated_at = now()
from championship
where page.championship_id = championship.id
  and page.slug = 'categorias-rapidos-insanos'
  and page.deleted_at is null;
