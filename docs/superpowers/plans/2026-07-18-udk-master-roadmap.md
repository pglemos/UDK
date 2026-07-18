# UDK Master Roadmap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the UDK platform through independently deployable phases without modifying the P1 Academy product.

**Architecture:** Build a new pnpm/Turborepo monorepo with separate public and authenticated Next.js applications and focused domain packages. Each phase owns its migrations, APIs, tests, documentation and deployment gate.

**Tech Stack:** Next.js 16.0.10, React 19.2.3, TypeScript 5.9.3, Supabase 2.108.2, Framer Motion 12.23.26, Lucide React 0.555.0, Vitest, Playwright, pnpm, Turborepo.

## Global Constraints

- Target repository is `pglemos/udk`; do not commit implementation to `pglemos/p1academy`.
- UDK is the default championship while the schema remains multi-championship.
- Every mutation is authorized server-side and constrained by Supabase RLS.
- Every critical state change creates an immutable audit event.
- Use TDD for domain logic and permissions.
- No physical deletion of financial, sporting, disciplinary or audit history.
- Official tie-breaks come only from regulation versions.
- Phase one notifications are e-mail and internal platform only.

---

## Dependency map

```text
Foundation
  └── Core operations
      ├── Results and governance
      │   └── Public CMS and sponsors
      └── Endurance and offline
          └── Public CMS and sponsors
```

## Execution sequence

### Task 1: Execute foundation plan

**Files:**
- Read: `docs/superpowers/plans/2026-07-18-udk-foundation-plan.md`
- Produces: workspace, database foundation, auth, permissions, audit and CI.

**Interfaces:**
- Consumes: approved design specification.
- Produces: `@udk/database`, `@udk/auth`, `@udk/permissions`, `@udk/audit`, `@udk/ui`.

- [ ] **Step 1: Run the foundation plan from top to bottom**

Run each task using the required test-first cycle and commit after each task.

- [ ] **Step 2: Verify the phase gate**

Run:

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

Expected: all commands exit 0.

### Task 2: Execute core operations plan

**Files:**
- Read: `docs/superpowers/plans/2026-07-18-udk-core-operations-plan.md`

**Interfaces:**
- Consumes: foundation packages and authenticated shell.
- Produces: driver, guardian, document, registration, PIX, credit and check-in modules.

- [ ] **Step 1: Implement all core-operation tasks**
- [ ] **Step 2: Run adult and minor registration E2E suites**

Run:

```bash
pnpm --filter @udk/plataforma test:e2e --grep "adult registration|minor registration"
```

Expected: both scenarios pass.

### Task 3: Execute results and governance plan

**Files:**
- Read: `docs/superpowers/plans/2026-07-18-udk-results-governance-plan.md`

**Interfaces:**
- Consumes: homologated drivers, stages, sessions and audit.
- Produces: importer, scoring, standings, penalties, appeals and result versioning.

- [ ] **Step 1: Implement all result and governance tasks**
- [ ] **Step 2: Verify deterministic recalculation**

Run:

```bash
pnpm --filter @udk/scoring-engine test --runInBand
pnpm --filter @udk/results-importer test --runInBand
```

Expected: all fixtures produce stable snapshots.

### Task 4: Execute Endurance and offline plan

**Files:**
- Read: `docs/superpowers/plans/2026-07-18-udk-endurance-offline-plan.md`

**Interfaces:**
- Consumes: drivers, teams, stages, permissions, audit and scoring.
- Produces: team enrollment, invitations, stints, offline queue and sync conflict handling.

- [ ] **Step 1: Implement all Endurance and offline tasks**
- [ ] **Step 2: Verify offline recovery**

Run:

```bash
pnpm --filter @udk/plataforma test:e2e --grep "offline stint recovery"
```

Expected: queued events survive reload and synchronize without duplicate official stints.

### Task 5: Execute public CMS and sponsors plan

**Files:**
- Read: `docs/superpowers/plans/2026-07-18-udk-public-cms-sponsors-plan.md`

**Interfaces:**
- Consumes: published sporting data, profiles, teams and audit.
- Produces: public portal, CMS, sponsor area, analytics and SEO.

- [ ] **Step 1: Implement all public and commercial tasks**
- [ ] **Step 2: Verify public release gate**

Run:

```bash
pnpm --filter @udk/web-publico test:e2e
pnpm --filter @udk/web-publico build
```

Expected: E2E and production build pass.

## Final release gate

- [ ] Run full workspace verification:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
```

- [ ] Verify migrations on a clean staging database.
- [ ] Restore the latest staging backup into an isolated project and run smoke tests.
- [ ] Confirm the unresolved regulation inputs remain visibly blocked rather than guessed.
- [ ] Tag the release only after the complete gate exits 0.
