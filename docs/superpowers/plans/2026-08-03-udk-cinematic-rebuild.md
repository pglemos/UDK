# UDK Cinematic Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the complete public presentation layer with a coherent cinematic and community-first UDK experience while preserving existing Next.js, Supabase, authentication and operational contracts.

**Architecture:** Keep all current data-access and authenticated modules. Replace the fragmented public stylesheet stack with four focused stylesheets and update the shared shell, editorial primitives and public pages to use one visual system. All public routes continue to consume the existing server-side data functions.

**Tech Stack:** Next.js 16, React 19, TypeScript 5.9, Supabase JS, Lucide React, CSS, Vitest, GitHub Actions, Vercel.

## Global Constraints

- Work is finalized on `main`.
- Preserve official UDK logo assets.
- Preserve all Supabase schemas, queries and RLS behavior.
- Do not invent sporting results or editorial content.
- Support desktop, tablet, mobile, keyboard and reduced motion.
- Do not add a heavy animation dependency.

---

### Task 1: Define public experience contracts

**Files:**
- Create: `apps/plataforma/tests/cinematic-public-experience.test.ts`

**Interfaces:**
- Consumes the public page and shared component source files.
- Produces source-level regression checks for the cinematic shell, home sections, internal-route consistency, official brand and reduced-motion support.

- [ ] Write tests requiring `cinema-menu-media`, `cinema-route-curtain`, `cinema-home-hero`, `cinema-manifesto`, `cinema-season`, `cinema-community`, `cinema-registration`, and `prefers-reduced-motion`.
- [ ] Run `pnpm --filter @udk/plataforma test` and confirm the new contract fails before the implementation exists.
- [ ] Commit the failing contract test.

### Task 2: Replace the fragmented visual system

**Files:**
- Create: `apps/plataforma/app/cinema-core.css`
- Create: `apps/plataforma/app/cinema-home.css`
- Create: `apps/plataforma/app/cinema-pages.css`
- Create: `apps/plataforma/app/cinema-responsive.css`
- Modify: `apps/plataforma/app/race.css`

**Interfaces:**
- Produces all tokens, typography, shell, page, responsive and reduced-motion styles used by public routes.

- [ ] Replace all `tg-*` imports in `race.css` with the four `cinema-*` files.
- [ ] Implement true-black, true-white, warm-paper and official-cyan tokens.
- [ ] Implement the header, fullscreen menu, route curtain, buttons, editorial type, media masks, footer, focus states and reduced-motion fallback.
- [ ] Implement home-specific and internal-route-specific layouts.
- [ ] Run lint and tests.

### Task 3: Rebuild global navigation and motion

**Files:**
- Modify: `apps/plataforma/components/race/race-header.tsx`
- Modify: `apps/plataforma/components/race/race-shell.tsx`
- Create: `apps/plataforma/components/race/cinematic-motion.tsx`

**Interfaces:**
- Produces `CinematicRouteCurtain`, `CinematicPointer`, `CinematicIntro`, and an accessible fullscreen menu.

- [ ] Implement route-aware fullscreen navigation with image response and route numbering.
- [ ] Preserve escape-key handling, focus return and body scroll locking.
- [ ] Implement pointer behavior only for fine pointers and disable it for reduced motion.
- [ ] Implement a short first-visit intro that uses the official logo and never blocks keyboard users.
- [ ] Run typecheck and component tests.

### Task 4: Rebuild the home narrative

**Files:**
- Modify: `apps/plataforma/app/page.tsx`
- Modify: `apps/plataforma/components/race/editorial-primitives.tsx`

**Interfaces:**
- Consumes existing public stages, drivers, news and sponsors.
- Produces the complete cinematic home experience and reusable stage/driver editorial components.

- [ ] Replace the opening with a full-viewport media composition and integrated next-stage rail.
- [ ] Implement manifesto, season chapters, real proof numbers, ranking, drivers, community, news, sponsors and final CTA.
- [ ] Use honest empty states for every missing dataset.
- [ ] Run tests and typecheck.

### Task 5: Unify all internal public routes

**Files:**
- Modify: `apps/plataforma/components/race/ui.tsx`
- Modify public route pages under `apps/plataforma/app/calendario`, `classificacao`, `resultados`, `pilotos`, `noticias`, `regulamento`, `login` and `inscricao`.

**Interfaces:**
- Consumes shared `PageHero`, status, search, pagination, data and auth components.
- Produces one editorial system across all public routes.

- [ ] Convert internal heroes into route-specific cinematic headers.
- [ ] Preserve filters, forms, tables, pagination, metadata and auth behavior.
- [ ] Convert tables to responsive mobile records without losing semantic table markup on desktop.
- [ ] Ensure no page introduces fictitious sporting or editorial data.
- [ ] Run full tests and build.

### Task 6: Final verification and production integration

**Files:**
- Update tests as required without weakening behavioral assertions.

**Interfaces:**
- Produces a verified `main` commit and Vercel production deployment.

- [ ] Run `pnpm verify`.
- [ ] Run `pnpm lint`.
- [ ] Run `pnpm typecheck`.
- [ ] Run `pnpm test`.
- [ ] Run `pnpm build`.
- [ ] Confirm GitHub Actions and the Vercel commit check are successful.
- [ ] Verify that the final commit is the head of `main`.