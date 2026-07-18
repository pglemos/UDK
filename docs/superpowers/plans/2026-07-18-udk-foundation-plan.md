# UDK Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create the UDK monorepo foundation, shared UI, Supabase schema baseline, authentication, scoped permissions, audit and CI/CD.

**Architecture:** Two Next.js applications share domain packages through pnpm workspaces and Turborepo. Supabase provides PostgreSQL, Auth, Storage and RLS; all mutations pass through typed server-side services.

**Tech Stack:** pnpm, Turborepo, Next.js 16.0.10, React 19.2.3, TypeScript 5.9.3, Supabase 2.108.2, Vitest, Testing Library, Playwright.

## Global Constraints

- Repository name: `pglemos/udk`.
- Package scope: `@udk/*`.
- Default championship slug: `udk`.
- Store timestamps in UTC and render in `America/Sao_Paulo`.
- Every domain table includes `id`, `created_at`, `updated_at` and logical status where applicable.
- All protected tables require RLS before merge.

---

### Task 1: Initialize the monorepo

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `turbo.json`
- Create: `tsconfig.base.json`
- Create: `.npmrc`
- Create: `.gitignore`
- Create: `apps/web-publico/package.json`
- Create: `apps/plataforma/package.json`

**Interfaces:**
- Consumes: none.
- Produces: workspace scripts `lint`, `typecheck`, `test`, `test:e2e`, `build`.

- [ ] **Step 1: Write the workspace smoke test**

Create `scripts/verify-workspace.mjs`:

```js
import { readFile } from 'node:fs/promises';
const root = JSON.parse(await readFile(new URL('../package.json', import.meta.url)));
if (!root.workspaces?.includes('apps/*') || !root.workspaces?.includes('packages/*')) {
  throw new Error('workspace globs missing');
}
console.log('workspace-ok');
```

- [ ] **Step 2: Run the smoke test and verify failure**

```bash
node scripts/verify-workspace.mjs
```

Expected: failure because root files do not exist.

- [ ] **Step 3: Create root configuration**

Root `package.json` must declare `packageManager`, workspace scripts and exact baseline dependencies. `pnpm-workspace.yaml` must include `apps/*` and `packages/*`.

- [ ] **Step 4: Run the smoke test**

```bash
node scripts/verify-workspace.mjs
```

Expected: `workspace-ok`.

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-workspace.yaml turbo.json tsconfig.base.json .npmrc .gitignore apps scripts
git commit -m "chore: initialize udk monorepo"
```

### Task 2: Create shared package skeletons

**Files:**
- Create: `packages/ui/package.json`
- Create: `packages/database/package.json`
- Create: `packages/auth/package.json`
- Create: `packages/permissions/package.json`
- Create: `packages/audit/package.json`
- Create: `packages/notifications/package.json`
- Create: `packages/payments/package.json`
- Create: `packages/scoring-engine/package.json`
- Create: `packages/results-importer/package.json`
- Create: `packages/disciplinary/package.json`
- Create: `packages/endurance/package.json`
- Create: `packages/offline-sync/package.json`
- Create: `packages/cms/package.json`
- Create: `packages/analytics/package.json`

**Interfaces:**
- Consumes: root workspace.
- Produces: importable package names under `@udk/*`.

- [ ] **Step 1: Write package resolution test**

Create `scripts/verify-packages.mjs` that reads every package manifest and asserts the name matches `@udk/<directory>`.

- [ ] **Step 2: Run and verify failure**

```bash
node scripts/verify-packages.mjs
```

Expected: failure listing missing manifests.

- [ ] **Step 3: Add focused package manifests and `src/index.ts` exports**
- [ ] **Step 4: Run verification**

```bash
node scripts/verify-packages.mjs
pnpm typecheck
```

Expected: both exit 0.

- [ ] **Step 5: Commit**

```bash
git add packages scripts/verify-packages.mjs
git commit -m "chore: add shared domain packages"
```

### Task 3: Add Supabase local project and core schema

**Files:**
- Create: `supabase/config.toml`
- Create: `supabase/migrations/202607180001_core.sql`
- Create: `packages/database/src/generated.types.ts`
- Create: `packages/database/src/client.ts`
- Test: `packages/database/src/core-schema.test.ts`

**Interfaces:**
- Consumes: Supabase CLI.
- Produces: `championships`, `seasons`, `categories`, `stages`, `sessions`, `profiles`, `user_roles`, `role_scopes`, `audit_events`.

- [ ] **Step 1: Write schema assertions**

The test queries `information_schema.tables` and asserts every core table exists after migration.

- [ ] **Step 2: Start Supabase and verify failure**

```bash
supabase start
pnpm --filter @udk/database test core-schema
```

Expected: missing-table failures.

- [ ] **Step 3: Implement migration**

Define UUID primary keys, UTC timestamps, foreign keys, unique championship slug, season status constraints and indexes on every scope column.

- [ ] **Step 4: Generate types and rerun test**

```bash
supabase db reset
supabase gen types typescript --local > packages/database/src/generated.types.ts
pnpm --filter @udk/database test core-schema
```

Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add supabase packages/database
git commit -m "feat: add core championship schema"
```

### Task 4: Implement authentication services

**Files:**
- Create: `packages/auth/src/server.ts`
- Create: `packages/auth/src/browser.ts`
- Create: `packages/auth/src/session.ts`
- Create: `apps/plataforma/app/(auth)/login/page.tsx`
- Create: `apps/plataforma/app/(auth)/recover/page.tsx`
- Test: `packages/auth/src/session.test.ts`

**Interfaces:**
- Consumes: Supabase Auth.
- Produces: `requireUser()`, `getOptionalUser()`, `signInWithPassword()`, `signOut()`.

- [ ] **Step 1: Write failing tests for missing and valid sessions**
- [ ] **Step 2: Run tests**

```bash
pnpm --filter @udk/auth test
```

Expected: missing exports.

- [ ] **Step 3: Implement typed server and browser clients**
- [ ] **Step 4: Run tests and route smoke test**

```bash
pnpm --filter @udk/auth test
pnpm --filter @udk/plataforma test -- login
```

Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add packages/auth apps/plataforma
git commit -m "feat: add authentication foundation"
```

### Task 5: Implement scoped permission evaluation

**Files:**
- Create: `packages/permissions/src/types.ts`
- Create: `packages/permissions/src/can.ts`
- Create: `packages/permissions/src/require-permission.ts`
- Test: `packages/permissions/src/can.test.ts`
- Create: `supabase/migrations/202607180002_permissions_rls.sql`

**Interfaces:**
- Consumes: active user roles and scopes.
- Produces: `can(input: PermissionInput): boolean`, `requirePermission(input): Promise<void>`.

- [ ] **Step 1: Write a permission matrix test**

Cover global admin, organization scope, expired marshal scope and cross-championship denial.

- [ ] **Step 2: Run and verify failure**

```bash
pnpm --filter @udk/permissions test
```

Expected: `can` not implemented.

- [ ] **Step 3: Implement exact-match plus inherited-scope evaluation**
- [ ] **Step 4: Add RLS policies mirroring server rules**
- [ ] **Step 5: Verify**

```bash
supabase db reset
pnpm --filter @udk/permissions test
pnpm --filter @udk/database test rls
```

Expected: pass and cross-tenant access denied.

- [ ] **Step 6: Commit**

```bash
git add packages/permissions supabase
git commit -m "feat: enforce scoped permissions"
```

### Task 6: Add immutable audit service

**Files:**
- Create: `packages/audit/src/write-audit-event.ts`
- Create: `packages/audit/src/types.ts`
- Test: `packages/audit/src/write-audit-event.test.ts`
- Modify: `supabase/migrations/202607180001_core.sql`

**Interfaces:**
- Consumes: authenticated actor and mutation metadata.
- Produces: `writeAuditEvent(event: AuditEventInput): Promise<string>`.

- [ ] **Step 1: Test that audit rows cannot be updated or deleted by application roles**
- [ ] **Step 2: Run and verify failure**
- [ ] **Step 3: Implement insert-only policy and service-role write path**
- [ ] **Step 4: Verify**

```bash
pnpm --filter @udk/audit test
pnpm --filter @udk/database test audit-immutability
```

Expected: insertion passes; update and delete are denied.

- [ ] **Step 5: Commit**

```bash
git add packages/audit supabase
git commit -m "feat: add immutable audit trail"
```

### Task 7: Build the UDK design system shell

**Files:**
- Create: `packages/ui/src/tokens.css`
- Create: `packages/ui/src/components/button.tsx`
- Create: `packages/ui/src/components/card.tsx`
- Create: `packages/ui/src/components/status-badge.tsx`
- Create: `packages/ui/src/components/data-table.tsx`
- Create: `packages/ui/src/components/app-shell.tsx`
- Test: `packages/ui/src/components/app-shell.test.tsx`

**Interfaces:**
- Consumes: UDK brand tokens.
- Produces: accessible UI primitives shared by both applications.

- [ ] **Step 1: Write accessibility-focused component tests**
- [ ] **Step 2: Run and verify failure**
- [ ] **Step 3: Implement tokens and components without championship-specific hardcoding outside tokens**
- [ ] **Step 4: Verify**

```bash
pnpm --filter @udk/ui test
pnpm --filter @udk/ui typecheck
```

Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add packages/ui
git commit -m "feat: add udk design system foundation"
```

### Task 8: Add CI and release gates

**Files:**
- Create: `.github/workflows/ci.yml`
- Create: `.github/workflows/e2e.yml`
- Create: `.github/pull_request_template.md`

**Interfaces:**
- Consumes: root scripts.
- Produces: mandatory lint, typecheck, test, migration and build checks.

- [ ] **Step 1: Add a workflow syntax test using actionlint**
- [ ] **Step 2: Create workflows with pnpm cache and Supabase service startup**
- [ ] **Step 3: Verify locally**

```bash
actionlint
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Expected: all exit 0.

- [ ] **Step 4: Commit**

```bash
git add .github
git commit -m "ci: add udk quality gates"
```
