# UDK Cinematic Rebuild Design

## Objective

Rebuild the public UDK experience as one coherent editorial and cinematic website, using the official UDK identity and the existing Supabase data contracts. The visual direction is 60% inspired by Twice Media House for motion, composition, typography and immersive navigation, and 40% inspired by The Grind for community storytelling, proof, conversion and long-form rhythm.

This is a direction-of-art reference, not a copy of proprietary code, imagery, text or brand identity.

## Non-negotiable constraints

- Final work lands on `main`.
- Preserve the existing Next.js 16 application and Supabase integrations.
- Preserve real data for stages, standings, results, drivers, news, sponsors and regulations.
- Do not invent winners, testimonials, members, metrics or published content.
- Use the official UDK logo and avatar already stored in `public/brand` and `public/icons`.
- Keep `/painel` and authenticated operational workflows functionally intact.
- Support desktop, tablet and mobile.
- Respect `prefers-reduced-motion` and keyboard navigation.
- Keep the public site fast enough for production deployment on Vercel.

## Creative direction

### Twice influence

- Full-viewport opening with race media and oversized editorial typography.
- Persistent but restrained navigation, plus an immersive fullscreen menu.
- Route curtain, cursor response and clipped reveal motion on capable desktop devices.
- Project-style presentation for championship stages.
- Large typographic transitions instead of repeated card grids.
- Strong editorial footer and continuous navigation between public routes.

### The Grind influence

- Community-first narrative built around real UDK participants and moments.
- Alternating light and dark narrative bands.
- Real championship numbers presented as proof, not decoration.
- Human-scale driver profiles and cultural sections.
- Multi-step registration entry with clear progress, summary and confirmation states.
- Long pages with varied rhythm, image scale and conversion points.

## Information architecture

### Global shell

- Official UDK logo in header and footer.
- Desktop navigation with one primary CTA.
- Fullscreen menu with route numbering and reactive media.
- Route transition curtain and scroll progress.
- Large editorial footer with location, Instagram, championship routes and registration CTA.

### Home

1. Cinematic introduction and full-viewport hero.
2. Dominant statement, registration CTA and calendar CTA.
3. Next-stage information integrated into the composition, not presented as a SaaS widget.
4. Light manifesto band with large text and race photography.
5. Season chapters presented as visual projects.
6. Real championship proof numbers.
7. Editorial podium and full ranking preview.
8. Asymmetric driver portraits.
9. Community and paddock narrative.
10. Featured news and secondary editorial rail.
11. Sponsors and strong final registration CTA.

### Internal routes

- `/calendario`: audiovisual stage chapters and filters.
- `/classificacao`: editorial podium, category navigation and professional ranking.
- `/resultados`: stage selector, podium, lap data and honest empty states.
- `/pilotos`: cinematic asymmetric directory.
- `/pilotos/[slug]`: individual hero, real metrics, biography and history.
- `/noticias`: editorial portal with lead story and rail.
- `/noticias/[slug]`: immersive article reading with related content.
- `/regulamento`: sticky index and readable chapters.
- `/login`: minimal split screen preserving auth behavior.
- `/inscricao`: six-stage progressive entry, summary and confirmation direction while preserving existing account routing.

## Visual system

- Base palette: near-black, true white, warm paper and official cyan accent.
- Typography: condensed display face for headlines and neutral sans-serif for content and controls.
- Geometry: open layouts, full-bleed media, thin rules, minimal radii and no generic dashboard cards.
- Motion: mask reveals, restrained parallax, horizontal stage track, menu transitions and hover media response.
- Accessibility: visible focus, semantic landmarks, proper labels, reduced-motion fallback and sufficient contrast.

## Architecture

The current public data and auth modules remain the source of truth. The rebuild replaces only the public presentation layer:

- `RaceShell` owns global navigation, transitions and footer.
- `RaceHeader` owns desktop navigation and the immersive menu.
- shared editorial primitives own headings, stage projects, driver portraits and empty states.
- page components consume existing public data functions and never duplicate data logic.
- a compact CSS system replaces the fragmented `tg-*` stylesheet stack.

## Error and empty-state behavior

- Missing stages, results, drivers, news, sponsors or regulations render designed empty states.
- Invalid driver and news slugs continue to use `notFound()`.
- Supabase unavailability continues to use the existing fallback contracts.
- No interface displays fabricated content to avoid visual gaps.

## Verification

The final commit must pass:

- `pnpm verify`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

The Vercel check on the final `main` commit must return success. Public routes must be checked for responsive overflow, keyboard navigation, reduced motion and use of the official logo.