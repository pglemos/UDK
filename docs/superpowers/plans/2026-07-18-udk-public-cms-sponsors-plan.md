# UDK Public Portal, CMS and Sponsors Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the premium public UDK experience, structured CMS, complete public profiles, sponsor activation, consented leads, analytics and SEO.

**Architecture:** The public app reads published projections only. The CMS stores structured blocks and versioned content; sponsor access is tenant-scoped and never exposes the driver database.

**Tech Stack:** Next.js App Router, React 19, Framer Motion, Lucide, Supabase, Puppeteer, Playwright, axe-core.

## Global Constraints

- Public readers never query private operational tables directly.
- Minor profiles expose sporting data but not private identity, contact, finance or guardian data.
- CMS uses approved structured blocks, not arbitrary executable HTML.
- Sponsor leads require explicit purpose-bound consent.
- Critical content may require approval before publication.

---

### Task 1: Create public read projections

**Files:**
- Create: `supabase/migrations/202607180040_public_projections.sql`
- Create: `packages/database/src/repositories/public.ts`
- Test: `packages/database/src/repositories/public.test.ts`

**Interfaces:**
- Produces: `getPublicHome`, `getPublicCalendar`, `getPublicDriver`, `getPublicResults`, `getPublicStandings`.

- [ ] Test anonymous access to published rows and denial for drafts/private fields.
- [ ] Implement security-barrier views or equivalent read projections.
- [ ] Verify minor privacy fields are absent from returned types.
- [ ] Commit with `feat: add public read projections`.

### Task 2: Build public application shell and home

**Files:**
- Create: `apps/web-publico/app/layout.tsx`
- Create: `apps/web-publico/app/page.tsx`
- Create: `apps/web-publico/components/site-header.tsx`
- Create: `apps/web-publico/components/hero.tsx`
- Create: `apps/web-publico/components/next-stage.tsx`
- Create: `apps/web-publico/components/standings-preview.tsx`
- Test: `apps/web-publico/e2e/home.spec.ts`

**Interfaces:**
- Consumes: public projections and shared UI.
- Produces: responsive UDK public shell.

- [ ] Write desktop and mobile E2E assertions based on the approved Figma hierarchy.
- [ ] Implement hero, countdown, next stage, leaders, latest results and sponsor strip.
- [ ] Verify keyboard navigation and reduced-motion behavior.
- [ ] Commit with `feat: build udk public home`.

### Task 3: Build premium standings and result pages

**Files:**
- Create: `apps/web-publico/app/classificacao/page.tsx`
- Create: `apps/web-publico/app/resultados/[resultId]/page.tsx`
- Create: `apps/web-publico/components/standings/summary.tsx`
- Create: `apps/web-publico/components/standings/detailed.tsx`
- Create: `apps/web-publico/components/standings/driver-drawer.tsx`
- Create: `apps/web-publico/components/standings/result-modal.tsx`
- Test: `apps/web-publico/e2e/standings.spec.ts`

**Interfaces:**
- Produces: category tabs, summary/detail toggle, fixed matrix, version state and drill-down interactions.

- [ ] Test Ultras Insanos and Ultras Rápidos tabs.
- [ ] Test provisional, official and rectified badges.
- [ ] Implement responsive fixed-column matrix and accessible modal/drawer focus management.
- [ ] Commit with `feat: add premium public standings`.

### Task 4: Build public driver and team profiles

**Files:**
- Create: `apps/web-publico/app/pilotos/[slug]/page.tsx`
- Create: `apps/web-publico/app/equipes/[slug]/page.tsx`
- Create: `apps/web-publico/components/profile/performance-chart.tsx`
- Test: `apps/web-publico/e2e/profile.spec.ts`

**Interfaces:**
- Produces: sporting stats, history, categories, Endurance, public penalties, sponsors and media.

- [ ] Test adult and minor public profile data boundaries.
- [ ] Implement charts without exposing private data in page source.
- [ ] Commit with `feat: add public driver and team profiles`.

### Task 5: Implement structured CMS and approval workflow

**Files:**
- Create: `supabase/migrations/202607180041_cms.sql`
- Create: `packages/cms/src/block-schema.ts`
- Create: `packages/cms/src/publication.ts`
- Create: `apps/plataforma/app/(editor)/content/page.tsx`
- Create: `apps/plataforma/app/(editor)/content/[pageId]/page.tsx`
- Test: `packages/cms/src/publication.test.ts`

**Interfaces:**
- Produces: `validatePageBlocks`, `submitForReview`, `approveContent`, `schedulePublication`, `restoreVersion`.

- [ ] Test every supported block schema and reject executable HTML/script payloads.
- [ ] Test common direct publication versus critical approval requirement.
- [ ] Implement desktop/mobile preview and immutable version history.
- [ ] Commit with `feat: add structured cms`.

### Task 6: Add media library and official PDF generation

**Files:**
- Create: `packages/cms/src/media.ts`
- Create: `packages/cms/src/pdf/render-official-document.ts`
- Create: `apps/plataforma/app/api/documents/[documentId]/pdf/route.ts`
- Test: `packages/cms/src/pdf/render-official-document.test.ts`

**Interfaces:**
- Produces: `createMediaAsset`, `renderOfficialDocumentPdf`.

- [ ] Test private/public asset separation and content reference protection.
- [ ] Generate PDFs with UDK identity, version, QR verification and document state.
- [ ] Commit with `feat: add media library and official pdfs`.

### Task 7: Implement sponsors, campaigns and approvals

**Files:**
- Create: `supabase/migrations/202607180042_sponsors.sql`
- Create: `packages/cms/src/sponsors.ts`
- Create: `apps/plataforma/app/(sponsor)/campaigns/page.tsx`
- Create: `apps/plataforma/app/(organization)/sponsors/page.tsx`
- Test: `packages/cms/src/sponsors.test.ts`

**Interfaces:**
- Produces: `createCampaign`, `submitCampaign`, `approveCampaign`, `publishCampaign`.

- [ ] Test sponsor tenancy and approval state transitions.
- [ ] Prevent sponsors from reading unrelated campaigns or driver lists.
- [ ] Commit with `feat: add sponsor campaign workflow`.

### Task 8: Implement coupons and consented leads

**Files:**
- Create: `packages/cms/src/coupons.ts`
- Create: `packages/cms/src/leads.ts`
- Create: `apps/web-publico/app/parceiros/[slug]/page.tsx`
- Test: `packages/cms/src/leads.test.ts`

**Interfaces:**
- Produces: `createCoupon`, `recordCouponEvent`, `captureConsentedLead`.

- [ ] Test that lead capture fails without exact sponsor, purpose and field consent.
- [ ] Store consent version and timestamp with every delivered lead.
- [ ] Commit with `feat: add sponsor coupons and consented leads`.

### Task 9: Add analytics, SEO and social cards

**Files:**
- Create: `packages/analytics/src/events.ts`
- Create: `packages/analytics/src/reporting.ts`
- Create: `apps/web-publico/app/sitemap.ts`
- Create: `apps/web-publico/app/robots.ts`
- Create: `apps/web-publico/app/api/og/route.tsx`
- Test: `packages/analytics/src/events.test.ts`
- Test: `apps/web-publico/e2e/seo.spec.ts`

**Interfaces:**
- Produces: typed analytics events, sponsor-scoped reports, metadata and social cards.

- [ ] Test privacy-safe analytics payloads.
- [ ] Test canonical URLs, sitemap entries and Open Graph images.
- [ ] Commit with `feat: add analytics and seo`.

### Task 10: Run public release gate

```bash
pnpm --filter @udk/cms test
pnpm --filter @udk/analytics test
pnpm --filter @udk/web-publico test:e2e
pnpm --filter @udk/web-publico build
pnpm lint
pnpm typecheck
```

Expected: all commands exit 0.
