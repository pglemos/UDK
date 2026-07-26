-- Public visitors may read only current, published regulation documents.
-- Other published terms remain restricted to authenticated users by the existing policy.
grant select on public.terms to anon;

drop policy if exists public_regulations_read on public.terms;
create policy public_regulations_read on public.terms
for select to anon
using (
  kind = 'regulation'
  and status = 'published'
  and deleted_at is null
  and (effective_at is null or effective_at <= now())
);
