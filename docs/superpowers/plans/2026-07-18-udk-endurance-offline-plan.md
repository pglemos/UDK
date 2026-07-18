# UDK Endurance and Offline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver Endurance team enrollment, invitations, substitutions, stints, individual eligibility, dual scoring and resilient offline track-side operation.

**Architecture:** Endurance domain services own team composition and stint state. The PWA persists signed local events and synchronizes them through an idempotent conflict-aware server endpoint.

**Tech Stack:** Next.js PWA, IndexedDB, Web Crypto, Supabase, TypeScript, Vitest, Playwright.

## Global Constraints

- Team requests are not official until confirmed by an authorized marshal or organization user.
- Offline records survive reload and device restart.
- Latest valid record wins current state; prior versions remain audited.
- Endurance team and individual points are independently configurable.

---

### Task 1: Add Endurance event and team schema

**Files:**
- Create: `supabase/migrations/202607180030_endurance.sql`
- Create: `packages/endurance/src/teams.ts`
- Create: `packages/endurance/src/invitations.ts`
- Test: `packages/endurance/src/teams.test.ts`

**Interfaces:**
- Produces: `createTeam`, `inviteDriver`, `acceptInvitation`, `homologateTeam`.

- [ ] Test min/max composition, titulars, reserves, duplicate-team conflicts and minors.
- [ ] Implement team and invitation state constraints.
- [ ] Verify homologation requires documents, terms and payment.
- [ ] Commit with `feat: add endurance teams`.

### Task 2: Add substitution governance

**Files:**
- Create: `packages/endurance/src/substitutions.ts`
- Create: `apps/plataforma/app/(driver)/endurance/teams/[teamId]/page.tsx`
- Create: `apps/plataforma/app/(organization)/endurance/teams/page.tsx`
- Test: `packages/endurance/src/substitutions.test.ts`

**Interfaces:**
- Produces: `requestSubstitution`, `approveSubstitution`, `rejectSubstitution`.

- [ ] Test before-deadline, after-deadline exception and payment-impact scenarios.
- [ ] Preserve old and new composition in audit.
- [ ] Commit with `feat: add endurance substitutions`.

### Task 3: Implement stint state machine

**Files:**
- Create: `packages/endurance/src/stints.ts`
- Create: `packages/endurance/src/stint-state.ts`
- Create: `apps/plataforma/app/(operations)/endurance/stints/page.tsx`
- Test: `packages/endurance/src/stint-state.test.ts`

**Interfaces:**
- Produces: `planStint`, `requestSwap`, `confirmSwap`, `openStint`, `closeStint`, `correctStint`.

- [ ] Test impossible sequences, two active drivers, end-before-start and unhomologated drivers.
- [ ] Implement request versus official confirmation distinction.
- [ ] Verify every correction creates a new version.
- [ ] Commit with `feat: add endurance stint operations`.

### Task 4: Implement participation eligibility and dual scoring

**Files:**
- Create: `packages/endurance/src/eligibility.ts`
- Create: `packages/scoring-engine/src/calculate-endurance-points.ts`
- Test: `packages/endurance/src/eligibility.test.ts`
- Test: `packages/scoring-engine/src/calculate-endurance-points.test.ts`

**Interfaces:**
- Produces: `evaluateDriverEligibility`, `calculateEndurancePoints`.

- [ ] Test minimum time, laps, percentage, stints, reserve rules and exceptions.
- [ ] Test team points unaffected while an ineligible driver receives zero individual points.
- [ ] Implement simulation output before rule changes.
- [ ] Commit with `feat: add endurance eligibility and scoring`.

### Task 5: Implement encrypted local event queue

**Files:**
- Create: `packages/offline-sync/src/db.ts`
- Create: `packages/offline-sync/src/encryption.ts`
- Create: `packages/offline-sync/src/queue.ts`
- Test: `packages/offline-sync/src/queue.test.ts`

**Interfaces:**
- Produces: `enqueueLocalEvent`, `listPendingEvents`, `markSynced`, `markConflict`.

- [ ] Test persistence after module reinitialization and deterministic device sequence.
- [ ] Implement IndexedDB storage encrypted with a device-bound Web Crypto key.
- [ ] Verify no plaintext sensitive payload remains in IndexedDB.
- [ ] Commit with `feat: add encrypted offline queue`.

### Task 6: Implement idempotent sync and conflict resolution

**Files:**
- Create: `packages/offline-sync/src/conflict.ts`
- Create: `packages/offline-sync/src/sync-client.ts`
- Create: `apps/plataforma/app/api/offline-sync/route.ts`
- Test: `packages/offline-sync/src/conflict.test.ts`

**Interfaces:**
- Produces: `compareOfflineEvents`, `syncPendingEvents`.

- [ ] Test local timestamp, device sequence, server receive time, clock offset and logical event ordering.
- [ ] Implement idempotency by local event UUID.
- [ ] Preserve losing versions in audit while applying the winning current state.
- [ ] Commit with `feat: add offline synchronization`.

### Task 7: Add PWA event cache and status UI

**Files:**
- Create: `apps/plataforma/public/manifest.webmanifest`
- Create: `apps/plataforma/app/sw.ts`
- Create: `apps/plataforma/components/offline-status.tsx`
- Create: `apps/plataforma/e2e/offline-stint.spec.ts`

**Interfaces:**
- Consumes: offline queue and event read model.
- Produces: offline-ready check-in, swaps, stints and incidents.

- [ ] Write Playwright test that disconnects the browser, records a stint, reloads, reconnects and verifies one official synced stint.
- [ ] Implement cache versioning and visible pending count.
- [ ] Verify service-worker upgrade does not discard pending queue data.
- [ ] Commit with `feat: add track-side offline pwa`.

### Task 8: Add Endurance public result read model

**Files:**
- Create: `packages/database/src/repositories/endurance-public.ts`
- Create: `apps/web-publico/app/endurance/[eventSlug]/page.tsx`
- Test: `apps/web-publico/e2e/endurance-result.spec.ts`

**Interfaces:**
- Produces: public team result, driver eligibility and stint timeline.

- [ ] Test public data excludes private driver and operational notes.
- [ ] Implement team standings, pilots, stops, best lap and stint timeline.
- [ ] Commit with `feat: publish endurance results`.

### Task 9: Run Endurance release gate

```bash
pnpm --filter @udk/endurance test
pnpm --filter @udk/offline-sync test
pnpm --filter @udk/scoring-engine test
pnpm --filter @udk/plataforma test:e2e --grep "offline stint"
pnpm --filter @udk/web-publico test:e2e --grep "endurance"
pnpm build
```

Expected: all commands exit 0.
